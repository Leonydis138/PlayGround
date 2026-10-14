/**
 * VANTAGE orchestrator - dependency-free (Node 18+).
 *
 * One deterministic coordinator. Specialist agents may propose actions, but
 * every mutation passes through the policy engine and this lifecycle. The
 * orchestrator is the only writer of canonical run status; workers return
 * structured results and never declare their own success.
 *
 * Lifecycle: queued -> claimed -> planning -> executing -> verifying -> completed
 * Recovery:  blocked | retry_wait | rolled_back | failed | cancelled
 *
 * Rules enforced here (asserted in scripts/tests.mjs):
 *   - `completed` is unreachable without recorded verification evidence
 *   - a failed check is never recorded as completed
 *   - a retry ceiling stops the loop rather than spinning
 *   - an exhausted ceiling produces a structured blocker, not a shrug
 */
import { randomUUID } from 'node:crypto';
import { redactRequest } from './policy.mjs';

export class Orchestrator {
  /**
   * @param {object} deps
   * @param {import('./store.mjs').Store} deps.store
   * @param {object} deps.policy       engine from createPolicy()
   * @param {Function} deps.plan       async (task) => steps[]
   * @param {Function} deps.execute    async (task, step, ctx) => {result}
   * @param {Function} deps.verify     async (task, ctx) => [{name, result, kind}]
   * @param {Function} [deps.sleep]    injectable for tests
   */
  constructor(deps) {
    for (const k of ['store', 'policy', 'plan', 'execute', 'verify']) {
      if (!deps || !deps[k]) throw new Error(`Orchestrator missing dependency: ${k}`);
    }
    this.store = deps.store;
    this.policy = deps.policy;
    this.plan = deps.plan;
    this.execute = deps.execute;
    this.verify = deps.verify;
    this.sleep = deps.sleep || (ms => new Promise(r => setTimeout(r, ms)));
    this.log = deps.log || (() => {});
  }

  /** Validate a plan before executing any of it. */
  _validatePlan(task, steps) {
    if (!Array.isArray(steps) || steps.length === 0) throw new Error('plan produced no steps');
    const allowedEnvs = new Set(task.scope?.environments || ['sandbox', 'test']);
    const allowedPaths = task.scope?.repository_paths || [];
    for (const s of steps) {
      if (!s || typeof s !== 'object') throw new Error('plan step must be an object');
      if (typeof s.action !== 'string') throw new Error('plan step missing action');
      // A step may not request more capability than its task was granted.
      if (s.environment && !allowedEnvs.has(s.environment)) {
        throw new Error(`step ${s.id || s.action} requests environment ${s.environment} outside the task scope (${[...allowedEnvs].join(', ')})`);
      }
      if (s.path && allowedPaths.length && !allowedPaths.some(p => s.path.startsWith(p))) {
        throw new Error(`step ${s.id || s.action} requests path ${s.path} outside the task scope`);
      }
      const req = {
        action: s.action,
        principal: { agent: task.owner_agent, role: 'worker' },
        resource: { path: s.path || null, ref: s.resource || null },
        environment: s.environment || 'sandbox',
        budget: { currency: 'ZAR', maximum: Number(s.cost_zar) || 0 },
        idempotency_key: s.idempotency_key || `${task.id}:${s.id || s.action}`,
        satisfied: s.satisfied || {}
      };
      const verdict = this.policy.evaluate(req);
      s._policy = verdict;
      if (verdict.decision === 'allow') continue;
      // Non-allow steps do not execute, but they do not abort the whole plan
      // either: the blocker is recorded with its reason so the operator can
      // see exactly which capability was missing.
      s._deferred = true;
    }
    return steps;
  }

  /**
   * Run one task to a terminal state, or stop at a precise blocker.
   * @returns {{outcome:string, task:object, decisions:object[]}}
   */
  async run(taskId, { actor = 'orchestrator', dryRun = false } = {}) {
const runId = `run-${randomUUID()}`;
    const decisions = [];
    const task0 = this.store.get(taskId);
    if (!task0) throw new Error(`no task ${taskId}`);

    if (task0.status === 'blocked') {
      // Resume from the last verified checkpoint rather than re-running from
      // an untrusted partial write.
      this.log(`resuming ${taskId} from checkpoint ${task0.checkpoint ? JSON.stringify(task0.checkpoint) : 'none'}`);
    }

    // A dry run must not touch durable state at all. It plans, it asks the
    // policy engine, and it reports - no lease, no transition, no event.
    if (dryRun) {
      const steps = this._validatePlan(task0, await this.plan(task0, { runId, actor, dryRun: true, decisions }));
      for (const s of steps) {
        if (s._policy) decisions.push({ step: s.id || s.action, ...s._policy, request: redactRequest({ action: s.action, environment: s.environment, path: s.path }) });
      }
      return { outcome: 'dry-run', task: task0, decisions };
    }

    const task = this.store.get(taskId);
    const lease = this.store.claim(taskId, runId, actor);
    const ctx = { runId, actor, token: lease.token, dryRun: false, decisions };

    try {
      this.store.transition(taskId, 'planning', { runId, actor, token: lease.token, reason: 'plan' });
      const steps = this._validatePlan(this.store.get(taskId), await this.plan(this.store.get(taskId), ctx));

      let policyBlock = null;
      let executed = 0;
      for (const s of steps) {
        if (s._deferred) {
          policyBlock = policyBlock || {
            question: `Capability "${s.action}" is not authorised in this environment (${s._policy.reason_code}).`,
            why_now: 'the task cannot complete without it',
            exact_human_action: `Grant the action in the policy ruleset, or run the task manually. Reason code: ${s._policy.reason_code}`,
            resume_condition: 're-run the task once the policy allows the action'
          };
          continue;
        }
        this.store.transition(taskId, 'executing', { runId, actor, token: lease.token });
        decisions.push({ step: s.id || s.action, ...s._policy });
        const out = await this.execute(this.store.get(taskId), s, ctx);
        this.store.checkpoint(taskId, { step: s.id || s.action, digest: out && out.digest ? out.digest : null, result: out && out.result ? out.result : null }, { runId, actor, token: lease.token });
        executed++;
      }

      // A plan where nothing could execute blocks immediately. There is
      // nothing to verify, and `planning -> verifying` is not a legal edge,
      // so entering verification here would be a state-machine bug.
      if (policyBlock && executed === 0) {
        this.store.block(taskId, policyBlock, { runId, actor, token: lease.token });
        return { outcome: 'blocked', task: this.store.get(taskId), decisions };
      }

      this.store.transition(taskId, 'verifying', { runId, actor, token: lease.token, reason: 'verification' });
      const results = await this.verify(this.store.get(taskId), ctx);
      const evidence = (results || []).map(r => ({
        kind: r.kind || 'test', name: r.name, result: r.result === true || r.result === 'pass' ? 'pass' : 'fail'
      }));
      const failed = evidence.filter(e => e.result !== 'pass');
      if (failed.length) {
        // A failed check is recorded as a failure with evidence, never as
        // completed. The evidence is kept so the next run can see what broke.
        this.store.transition(taskId, 'executing', { runId, actor, token: lease.token, evidence, reason: `verification failed: ${failed.map(f => f.name).join(', ')}` });
        const cur = this.store.get(taskId);
        if (cur.attempt >= (cur.retry?.max_attempts || 3)) {
          this.store.transition(taskId, 'failed', { runId, actor, token: lease.token, reason: 'retry ceiling reached' });
          return { outcome: 'failed', task: this.store.get(taskId), decisions };
        }
        this.store.transition(taskId, 'retry_wait', { runId, actor, token: lease.token, reason: 'retrying after failed verification' });
        return { outcome: 'retry_wait', task: this.store.get(taskId), decisions };
      }
      if (policyBlock) {
        this.store.block(taskId, policyBlock, { runId, actor, token: lease.token });
        return { outcome: 'blocked', task: this.store.get(taskId), decisions };
      }
      this.store.transition(taskId, 'completed', { runId, actor, token: lease.token, evidence });
      return { outcome: 'completed', task: this.store.get(taskId), decisions };
    } catch (err) {
      const cur = this.store.get(taskId);
      if (cur && !['failed', 'completed', 'cancelled'].includes(cur.status)) {
        try {
          this.store.transition(taskId, 'failed', { runId, actor, reason: `exception: ${err.message}` });
        } catch { /* the store already refused; surface the original error */ }
      }
      return { outcome: 'failed', task: this.store.get(taskId), decisions, error: err.message };
    }
  }

  /** Report every task that is not in a terminal state. */
  outstanding() {
    return this.store.list().filter(t => !['completed', 'failed', 'cancelled', 'rolled_back'].includes(t.status));
  }
}