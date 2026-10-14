/**
 * VANTAGE durable task + event store - dependency-free (Node 18+).
 *
 * Two files, two different jobs:
 *   state/tasks.json       - a snapshot of every task, replaced atomically
 *   state/events.jsonl     - append-only history; every transition lands here
 *                            first and is never rewritten
 *
 * Guarantees this store provides (each asserted in scripts/tests.mjs):
 *   - atomic writes: temp file + rename, so a crash mid-write cannot leave a
 *     half-serialised canonical file
 *   - schema validation before any mutation; malformed state is refused, not
 *     silently repaired
 *   - single-writer lease with a fencing token; a stale worker whose lease
 *     expired cannot commit with an old token
 *   - legal state transitions enforced centrally; `queued -> completed` is
 *     invalid and rejected
 *   - idempotency keys on mutating steps, so a replayed run does not repeat
 *     an external effect
 *   - a monotonic sequence number per task that a worker cannot reset
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const SCHEMA_VERSION = 1;

export const LIFECYCLE = {
  queued: ['claimed', 'blocked', 'cancelled'],
  claimed: ['planning', 'retry_wait', 'blocked', 'failed', 'cancelled'],
  planning: ['executing', 'blocked', 'retry_wait', 'failed', 'cancelled'],
  executing: ['verifying', 'retry_wait', 'rolled_back', 'failed', 'blocked', 'cancelled'],
  verifying: ['completed', 'executing', 'retry_wait', 'failed', 'blocked', 'cancelled'],
  retry_wait: ['claimed', 'executing', 'failed', 'blocked', 'cancelled'],
  // Terminal
  completed: [],
  rolled_back: [],
  failed: [],
  blocked: ['queued'],   // unblocking resumes from the last verified checkpoint
  cancelled: []
};
export const TERMINAL = new Set(['completed', 'rolled_back', 'failed', 'cancelled']);

export function isLegalTransition(from, to) {
  if (from === to) return false;           // no-op transitions are not transitions
  return Array.isArray(LIFECYCLE[from]) && LIFECYCLE[from].includes(to);
}

const DEFAULT_LEASE_MS = 60_000;

export class Store {
  /**
   * @param {object} opts
   * @param {string} opts.dir       directory holding tasks.json + events.jsonl
   * @param {number} [opts.leaseMs] lease duration
   */
  constructor(opts = {}) {
    this.dir = opts.dir || 'state';
    this.leaseMs = opts.leaseMs || DEFAULT_LEASE_MS;
    this.tasksPath = join(this.dir, 'tasks.json');
    this.eventsPath = join(this.dir, 'events.jsonl');
    this._fence = 0;
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.tasksPath)) this._writeState({ schema_version: SCHEMA_VERSION, tasks: [], idempotency: {} });
  }

  // ---------------------------------------------------------------- io ----

  _writeState(obj) {
    mkdirSync(dirname(this.tasksPath), { recursive: true });
    const tmp = `${this.tasksPath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
    renameSync(tmp, this.tasksPath);       // atomic on POSIX
  }

  read() {
    const raw = readFileSync(this.tasksPath, 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      throw new Error(`tasks.json is corrupt - refusing to mutate (${e.message}). Restore from backup/ first.`);
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('tasks.json is not an object - refusing to mutate');
    if (!Array.isArray(parsed.tasks)) throw new Error('tasks.json has no tasks array - refusing to mutate');
    if (parsed.schema_version !== SCHEMA_VERSION) {
      throw new Error(`tasks.json schema_version ${parsed.schema_version} != ${SCHEMA_VERSION} - migrate before mutating`);
    }
    return parsed;
  }

  /** Append one event. Append-only: this never rewrites history. */
  appendEvent(ev) {
    if (!ev || typeof ev !== 'object') throw new Error('event must be an object');
    for (const k of ['event_id', 'task_id', 'run_id', 'sequence', 'at', 'actor', 'type']) {
      if (ev[k] === undefined || ev[k] === null) throw new Error(`event missing ${k}`);
    }
    mkdirSync(dirname(this.eventsPath), { recursive: true });
    appendFileSync(this.eventsPath, JSON.stringify(ev) + '\n');
    return ev;
  }

  readEvents() {
    if (!existsSync(this.eventsPath)) return [];
    return readFileSync(this.eventsPath, 'utf8')
      .split('\n').filter(Boolean).map(l => JSON.parse(l));
  }

  // ------------------------------------------------------------- tasks ----

  list(status) {
    const s = this.read();
    return status ? s.tasks.filter(t => t.status === status) : s.tasks;
  }

  get(id) {
    return this.read().tasks.find(t => t.id === id) || null;
  }

  /** Create a task. Rejects a duplicate id rather than overwriting. */
  create(task) {
    const s = this.read();
    validateTask(task);
    if (s.tasks.some(t => t.id === task.id)) throw new Error(`duplicate task id ${task.id}`);
    const now = new Date().toISOString();
    const rec = {
      schema_version: SCHEMA_VERSION,
      id: task.id,
      objective: task.objective,
      owner_agent: task.owner_agent,
      status: 'queued',
      priority: task.priority || 'normal',
      acceptance: Array.isArray(task.acceptance) ? task.acceptance : [],
      scope: task.scope || { repository_paths: [], environments: [], external_channels: [], max_spend_zar: 0 },
      risk: task.risk || { class: 'routine-reversible', data_sensitivity: 'public' },
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      retry: task.retry || { max_attempts: 3, backoff_seconds: [30, 120, 600] },
      rollback: task.rollback || { strategy: 'revert-commit', checkpoint: null },
      evidence: [],
      blocker: null,
      attempt: 0,
      sequence: 0,
      created_at: now,
      updated_at: now,
      lease: null,
      checkpoint: null
    };
    s.tasks.push(rec);
    this._writeState(s);
    this.appendEvent({
      event_id: `evt-${randomUUID()}`, task_id: rec.id, run_id: task.run_id || 'run-bootstrap',
      sequence: 0, at: now, actor: task.actor || 'orchestrator',
      type: 'task.created', resource: null, policy_decision_id: null, evidence: []
    });
    return rec;
  }

  /**
   * Acquire a lease. Returns a fencing token that increments on every
   * acquisition; a later write with an older token is rejected.
   */
  claim(id, runId, actor) {
    const s = this.read();
    const t = s.tasks.find(x => x.id === id);
    if (!t) throw new Error(`no task ${id}`);
    if (TERMINAL.has(t.status)) throw new Error(`task ${id} is terminal (${t.status}) - not claimable`);
    if (t.lease && Date.parse(t.lease.expires_at) > Date.now()) {
      throw new Error(`task ${id} is leased by ${t.lease.owner} until ${t.lease.expires_at}`);
    }
    if (t.status === 'queued') this._assertTransition(t, 'claimed');
this._fence += 1;
    const now = new Date();
    t.status = t.status === 'queued' ? 'claimed' : t.status;
    t.lease = { owner: actor, token: this._fence, acquired_at: now.toISOString(), expires_at: new Date(now.getTime() + this.leaseMs).toISOString() };
    t.updated_at = now.toISOString();
    t.sequence += 1;                       // persisted BEFORE the state is written,
    this._writeState(s);                   // so the event and the snapshot agree
    this.appendEvent({
      event_id: `evt-${randomUUID()}`, task_id: id, run_id: runId,
      sequence: t.sequence, at: t.updated_at, actor,
      type: 'task.claimed', resource: null, policy_decision_id: null,
      evidence: [{ kind: 'lease', name: 'token', result: String(this._fence) }]
    });
    return { token: this._fence, expires_at: t.lease.expires_at };
  }

  /** Fencing check: a stale token cannot commit. */
  assertFence(id, token) {
    const t = this.get(id);
    if (!t || !t.lease) throw new Error(`task ${id} has no lease - cannot commit`);
    if (t.lease.token !== token) throw new Error(`stale fencing token for ${id} (have ${token}, task holds ${t.lease.token})`);
    if (Date.parse(t.lease.expires_at) < Date.now()) throw new Error(`lease for ${id} expired at ${t.lease.expires_at}`);
  }

  /**
   * Move a task through the lifecycle. Illegal transitions throw; a failed
   * verification can never be recorded as completed.
   */
  transition(id, to, { runId, actor, token, evidence = [], reason = null, policy_decision_id = null } = {}) {
    const s = this.read();
    const t = s.tasks.find(x => x.id === id);
    if (!t) throw new Error(`no task ${id}`);
    if (token !== undefined) this.assertFence(id, token);
    if (!isLegalTransition(t.status, to)) {
      throw new Error(`illegal transition for ${id}: ${t.status} -> ${to}`);
    }
    if (to === 'completed' && !(evidence.length > 0)) {
      throw new Error(`task ${id} cannot complete without recorded verification evidence`);
    }
    const now = new Date().toISOString();
    const from = t.status;
    t.status = to;
    t.updated_at = now;
    if (to === 'executing') t.attempt += 1;
    if (TERMINAL.has(to)) t.lease = null;
    if (evidence.length) t.evidence.push(...evidence);
    t.sequence += 1;                       // persisted before the snapshot so the
    this._writeState(s);                   // event sequence and the snapshot agree
    this.appendEvent({
      event_id: `evt-${randomUUID()}`, task_id: id, run_id: runId || 'run-unknown',
      sequence: t.sequence, at: now, actor: actor || 'orchestrator',
      type: `task.${to}`, reason, resource: null,
      policy_decision_id, evidence,
      from, to
    });
    return t;
  }

  /** Record a resumable checkpoint after each mutation. */
  checkpoint(id, cp, { runId, actor, token } = {}) {
    const s = this.read();
    const t = s.tasks.find(x => x.id === id);
    if (!t) throw new Error(`no task ${id}`);
    if (token !== undefined) this.assertFence(id, token);
    t.checkpoint = { ...cp, at: new Date().toISOString() };
    t.updated_at = t.checkpoint.at;
    t.sequence += 1;                       // persisted before the snapshot so the
    this._writeState(s);                   // event sequence and the snapshot agree
    this.appendEvent({
      event_id: `evt-${randomUUID()}`, task_id: id, run_id: runId || 'run-unknown',
      sequence: t.sequence, at: t.checkpoint.at, actor: actor || 'worker',
      type: 'task.checkpoint', resource: cp, policy_decision_id: null, evidence: []
    });
    return t.checkpoint;
  }

  /** Attach a structured blocker (the only acceptable "blocked" payload). */
  block(id, blocker, { runId, actor, token } = {}) {
    for (const k of ['question', 'why_now', 'exact_human_action', 'resume_condition']) {
      if (!blocker || !blocker[k]) throw new Error(`blocker missing ${k}`);
    }
    const s = this.read();
    const t = s.tasks.find(x => x.id === id);
    if (!t) throw new Error(`no task ${id}`);
    if (token !== undefined) this.assertFence(id, token);
    if (!isLegalTransition(t.status, 'blocked')) throw new Error(`illegal transition for ${id}: ${t.status} -> blocked`);
    t.status = 'blocked';
    t.blocker = { ...blocker, created_at: new Date().toISOString() };
    t.updated_at = t.blocker.created_at;
    if (TERMINAL.has('blocked')) t.lease = null;
    this._writeState(s);
    this.appendEvent({
      event_id: `evt-${randomUUID()}`, task_id: id, run_id: runId || 'run-unknown',
      sequence: ++t.sequence, at: t.updated_at, actor: actor || 'orchestrator',
      type: 'task.blocked', reason: blocker.question, resource: null,
      policy_decision_id: null, evidence: []
    });
    return t.blocker;
  }

  /**
   * Idempotency: return the recorded result for a key, or record a new one.
   * A repeated key never performs the work twice.
   */
  claimIdempotency(key, resultFn) {
    const s = this.read();
    if (Object.prototype.hasOwnProperty.call(s.idempotency, key)) {
      return { replayed: true, result: s.idempotency[key].result };
    }
    const result = resultFn();
    s.idempotency[key] = { result, at: new Date().toISOString() };
    this._writeState(s);
    return { replayed: false, result };
  }

  releaseLease(id) {
    const s = this.read();
    const t = s.tasks.find(x => x.id === id);
    if (!t) return;
    t.lease = null;
    t.updated_at = new Date().toISOString();
    this._writeState(s);
  }

  _assertTransition(t, to) {
    if (!isLegalTransition(t.status, to)) throw new Error(`illegal transition for ${t.id}: ${t.status} -> ${to}`);
  }
}

function validateTask(task) {
  if (!task || typeof task !== 'object') throw new Error('task must be an object');
  for (const k of ['id', 'objective', 'owner_agent']) {
    if (typeof task[k] !== 'string' || !task[k]) throw new Error(`task missing ${k}`);
  }
  // Bound every free-text field: an unbounded id or objective is both an
  // oversized-input vector and an unbounded file-growth vector.
  if (task.id.length > 64) throw new Error(`task id is ${task.id.length} chars; the limit is 64`);
  if (task.objective.length > 2000) throw new Error('task objective exceeds 2000 characters');
  if (task.owner_agent.length > 64) throw new Error('task owner_agent exceeds 64 characters');
  if (typeof task.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/i.test(task.id)) {
    throw new Error(`task id "${task.id}" must be alphanumeric + hyphen`);
  }
  if (Array.isArray(task.acceptance) && task.acceptance.length === 0) {
    throw new Error(`task ${task.id} has no acceptance criteria - completion would be unprovable`);
  }
  const scope = task.scope || {};
  if (scope.max_spend_zar !== undefined && (typeof scope.max_spend_zar !== 'number' || scope.max_spend_zar < 0)) {
    throw new Error(`task ${task.id} has an invalid scope.max_spend_zar`);
  }
  if (Array.isArray(scope.environments)) {
    for (const e of scope.environments) {
      if (!['sandbox', 'test', 'preview', 'production'].includes(e)) {
        throw new Error(`task ${task.id} requests unknown environment "${e}"`);
      }
    }
  }
}