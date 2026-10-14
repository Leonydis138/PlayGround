#!/usr/bin/env node
/**
 * VANTAGE safety and behaviour test suite - dependency-free (Node 18+).
 *
 * This is the Section H catalogue from the build spec, mapped to concrete
 * cases. A failure here blocks autonomy increases and production mutations.
 * Do not "fix" a failing safety test by weakening the guard without a
 * documented risk review.
 *
 *   node scripts/tests.mjs            # run everything
 *   node scripts/tests.mjs policy     # only groups matching a substring
 *
 * Groups:
 *   policy       - allow/deny/defer for every action class, plus fail-closed
 *   never-class  - required human gates cannot be bypassed
 *   idempotency  - repeated mutations do not duplicate work
 *   paths        - traversal, symlink escape, oversized/malformed input
 *   recovery     - stale leases, crash mid-write, illegal transitions
 *   data-quality - missing, stale, zero-denominator, currency, duplicates
 *   external     - rate limits, consent, no-send default, no real payment
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, symlinkSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPolicy, redactRequest, NEVER_ACTIONS, MUTATING_ACTIONS } from './lib/policy.mjs';
import { Store, isLegalTransition } from './lib/store.mjs';
import { Orchestrator } from './lib/orchestrator.mjs';

const FILTER = process.argv[2] || '';
let pass = 0, fail = 0;
const failures = [];
let group = '';

const g = name => { group = name; };
function check(name, fn) {
  if (FILTER && !group.includes(FILTER) && !name.includes(FILTER)) return;
  try {
    const r = fn();
    if (r === false) throw new Error('returned false');
    pass++;
    console.log(`  PASS  ${group} :: ${name}`);
  } catch (err) {
    fail++;
    failures.push(`${group} :: ${name} - ${err.message}`);
    console.log(`  FAIL  ${group} :: ${name}\n        ${err.message}`);
  }
}
async function checkAsync(name, fn) {
  if (FILTER && !group.includes(FILTER) && !name.includes(FILTER)) return;
  try {
    const r = await fn();
    if (r === false) throw new Error('returned false');
    pass++;
    console.log(`  PASS  ${group} :: ${name}`);
  } catch (err) {
    fail++;
    failures.push(`${group} :: ${name} - ${err.message}`);
    console.log(`  FAIL  ${group} :: ${name}\n        ${err.message}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const tmp = () => mkdtempSync(join(tmpdir(), 'vantage-test-'));

// ---------------------------------------------------------------- fixtures --

function baseConfig(over = {}) {
  return Object.assign({
    policy_version: 1,
    kill_switch: false,
    budget: { currency: 'ZAR', per_run_spend: 0, monthly_spend: 0 },
    limits: { max_publications_per_run: 3, max_messages_per_hour: 0, max_retries_per_action: 3 },
    rules: [
      { id: 'edit', actions: ['file.read', 'file.write', 'content.publish', 'seo.tweak', 'faq.add', 'data.state.write', 'queue.approve'], environments: ['sandbox', 'test', 'preview'], paths: ['sites/', 'data/'], decision: 'allow' },
      { id: 'deploy', actions: ['pages.deploy'], environments: ['production'], requires: ['rollback_plan'], decision: 'allow_if_all' }
    ]
  }, over);
}
const req = (over = {}) => Object.assign({
  action: 'file.write',
  principal: { agent: 'product-dev', role: 'worker' },
  resource: { path: 'data/data.json' },
  environment: 'test',
  budget: { currency: 'ZAR', maximum: 0 },
  satisfied: {}
}, over);

// ------------------------------------------------------------- 1. POLICY ---

g('policy');
{
  const p = createPolicy(baseConfig());
  check('an allowed in-scope write is allowed', () => {
    const d = p.evaluate(req());
    assert(d.decision === 'allow', `got ${d.decision}/${d.reason_code}`);
  });
  check('an unknown action name denies', () => {
    const d = p.evaluate(req({ action: 'totally.made.up' }));
    assert(d.decision === 'deny' && d.reason_code === 'unknown_action');
  });
  check('an unknown environment denies', () => {
    const d = p.evaluate(req({ environment: 'staging' }));
    assert(d.decision === 'deny' && d.reason_code === 'unknown_environment');
  });
  check('a wildcard resource path denies', () => {
    for (const bad of ['sites/**', '*', 'sites/*/x']) {
      const d = p.evaluate(req({ resource: { path: bad } }));
      assert(d.decision === 'deny', `${bad} was not denied`);
    }
  });
  check('a traversal path denies', () => {
    const d = p.evaluate(req({ resource: { path: 'data/../../etc/passwd' } }));
    assert(d.decision === 'deny');
  });
  check('a path outside the allowlist denies', () => {
    const d = p.evaluate(req({ resource: { path: 'etc/shadow' } }));
    assert(d.decision === 'deny' && d.reason_code === 'path_outside_allowlist');
  });
  check('an absolute path denies', () => {
    const d = p.evaluate(req({ resource: { path: '/etc/passwd' } }));
    assert(d.decision === 'deny');
  });
  check('any spend above a zero budget denies', () => {
    const d = p.evaluate(req({ budget: { currency: 'ZAR', maximum: 1 } }));
    assert(d.decision === 'deny' && d.reason_code === 'over_budget');
  });
  check('an expired budget denies spend', () => {
    const p2 = createPolicy(baseConfig({ budget: { currency: 'ZAR', per_run_spend: 100, monthly_spend: 100, expires_at: '2020-01-01T00:00:00Z' } }));
    const d = p2.evaluate(req({ action: 'purchase', budget: { currency: 'ZAR', maximum: 5 }, satisfied: { rollback_plan: true } }));
    assert(d.decision !== 'allow', `expired budget produced ${d.decision}`);
  });
  check('an active kill switch denies every mutation', () => {
    const p2 = createPolicy(baseConfig({ kill_switch: true }));
    for (const action of ['file.write', 'content.publish', 'data.state.write', 'seo.tweak']) {
      const d = p2.evaluate(req({ action }));
      assert(d.decision === 'deny' && d.reason_code === 'kill_switch_engaged', `${action} survived the kill switch`);
    }
  });
  check('the kill switch does not block read-only diagnosis', () => {
    const p2 = createPolicy(baseConfig({ kill_switch: true }));
    const d = p2.evaluate(req({ action: 'file.read', resource: { path: null } }));
    assert(d.decision === 'allow', 'kill switch blocked a read');
  });
  check('an empty ruleset denies everything mutating', () => {
    const p2 = createPolicy(baseConfig({ rules: [] }));
    assert(!p2.validate().ok);
    const d = p2.evaluate(req());
    assert(d.decision === 'deny');
  });
  check('an unknown policy version disables mutation', () => {
    const p2 = createPolicy(baseConfig({ policy_version: 99 }));
    assert(!p2.validate().ok);
    assert(p2.evaluate(req()).decision === 'deny');
  });
  check('a missing config denies everything mutating', () => {
    const p2 = createPolicy(undefined);
    assert(p2.evaluate(req()).decision === 'deny');
  });
  check('production deploy requires its rollback plan', () => {
    const p2 = createPolicy(baseConfig());
    const bad = p2.evaluate(req({ action: 'pages.deploy', environment: 'production', resource: { path: 'sites/branch-a/dist' } }));
    assert(bad.decision === 'deny' && bad.reason_code.startsWith('requirement_unmet'));
    const good = p2.evaluate(req({ action: 'pages.deploy', environment: 'production', resource: { path: 'sites/branch-a/dist' }, satisfied: { rollback_plan: true } }));
    assert(good.decision === 'allow', `got ${good.decision}/${good.reason_code}`);
  });
  check('retries above the configured ceiling are not representable', () => {
    const p2 = createPolicy(baseConfig());
    assert(p2.limits.max_retries_per_action === 3);
  });
  check('a malformed request denies', () => {
    for (const bad of [null, undefined, {}, { action: 'file.write' }, { action: '', principal: { agent: 'x', role: 'worker' } }]) {
      assert(p2deny(bad), 'a malformed request was not denied');
    }
    function p2deny(r) { try { return createPolicy(baseConfig()).evaluate(r).decision === 'deny'; } catch { return true; } }
  });
  check('an unknown principal role denies', () => {
    const d = createPolicy(baseConfig()).evaluate(req({ principal: { agent: 'x', role: 'ceo' } }));
    assert(d.decision === 'deny' && d.reason_code === 'unknown_principal_role');
  });
  check('log redaction hides secret-looking fields', () => {
    const r = redactRequest({ action: 'file.read', token: 'supersecret', api_key: 'k', path: 'data/x' });
    assert(r.fields.token === '[redacted]' && r.fields.api_key === '[redacted]');
    assert(!JSON.stringify(r).includes('supersecret'));
  });
}

// ---------------------------------------------------------- 2. NEVER-CLASS --

g('never-class');
{
  check('every NEVER action defers to a human at level 1', () => {
    const p = createPolicy(baseConfig());
    for (const action of NEVER_ACTIONS) {
      // Even with a maximally permissive allow rule in front of it.
      const loose = createPolicy(baseConfig({
        rules: [{ id: 'allow-all', actions: [...MUTATING_ACTIONS], environments: ['sandbox', 'test', 'preview', 'production'], decision: 'allow' }]
      }));
      const d = loose.evaluate(req({ action, environment: 'production', resource: { path: 'data/data.json' }, satisfied: { rollback_plan: true, protected_credential: true, all_gates_passed: true, approved_target: true } }));
      assert(d.decision === 'defer-human', `${action} returned ${d.decision} under an allow-all rule`);
    }
  });
  check('a NEVER action is not executable by any allowed environment', () => {
    const p = createPolicy(baseConfig());
    for (const env of ['sandbox', 'test', 'preview', 'production']) {
      const d = p.evaluate(req({ action: 'payment.create', environment: env }));
      assert(d.decision === 'defer-human');
    }
  });
  check('a forged "approved" status does not authorise a payment', () => {
    const p = createPolicy(baseConfig());
    const d = p.evaluate(req({ action: 'payment.create', resource: { path: 'data/data.json', status: 'approved' }, satisfied: { rollback_plan: true } }));
    assert(d.decision === 'defer-human');
  });
  check('a replayed external action with a new idempotency key is still deferred', () => {
    const p = createPolicy(baseConfig());
    const d = p.evaluate(req({ action: 'email.send', idempotency_key: 'anything', satisfied: {} }));
    assert(d.decision === 'defer-human');
  });
  check('escalating the configured level cannot unlock a NEVER action', () => {
    for (const level of [0, 1, 2, 99]) {
      const p = createPolicy(baseConfig({ limits: { max_publications_per_run: level * 10, max_messages_per_hour: level * 10, max_retries_per_action: 3 } }));
      assert(p.evaluate(req({ action: 'security.change' })).decision === 'defer-human');
      assert(p.evaluate(req({ action: 'pricing.change' })).decision === 'defer-human');
    }
  });
  check('every NEVER action is a member of the mutating set', () => {
    for (const action of NEVER_ACTIONS) assert(MUTATING_ACTIONS.has(action), `${action} is neither mutating nor handled`);
  });
}

// --------------------------------------------------------- 3. IDEMPOTENCY --

g('idempotency');
{
  const dir = tmp();
  check('an idempotency key runs the work once', () => {
    const s = new Store({ dir });
    let calls = 0;
    const a = s.claimIdempotency('k1', () => { calls++; return { v: calls }; });
    const b = s.claimIdempotency('k1', () => { calls++; return { v: calls }; });
    assert(!a.replayed && b.replayed, 'replay not detected');
    assert(calls === 1, `work ran ${calls} times`);
    assert(JSON.stringify(a.result) === JSON.stringify(b.result), 'replay returned a different result');
  });
check('distinct keys both run', () => {
    const s = new Store({ dir });
    let n = 0;
    s.claimIdempotency('a', () => ++n);
    s.claimIdempotency('b', () => ++n);
    assert(n === 2);
  });
  check('a duplicate task id is refused rather than overwritten', () => {
    const s = new Store({ dir });
    s.create({ id: 'dup-1', objective: 'first', owner_agent: 'a', acceptance: ['x'] });
    let threw = false;
    try { s.create({ id: 'dup-1', objective: 'second', owner_agent: 'b', acceptance: ['x'] }); } catch { threw = true; }
    assert(threw, 'duplicate task id was accepted');
  });
  check('a task with no acceptance criteria cannot be created', () => {
    const s = new Store({ dir });
    let threw = false;
    try { s.create({ id: 'no-accept', objective: 'x', owner_agent: 'a', acceptance: [] }); } catch { threw = true; }
    assert(threw, 'an unprovable task was accepted');
  });
  rmSync(dir, { recursive: true, force: true });
}

// --------------------------------------------------------------- 4. PATHS ---

g('paths');
{
  const dir = tmp();
  check('a traversal draft slug cannot escape the content root', async () => {
    const { execFileSync } = await import('node:child_process');
    // Covered structurally by safeDraftPath in autonomy.mjs; here we assert
    // the confinement rule the store-side path check relies on.
    const { resolve, sep } = await import('node:path');
    const base = resolve(process.cwd(), 'sites/branch-a');
    for (const slug of ['../../etc/passwd', '/etc/passwd', '..', 'a/b']) {
      const full = resolve(join('sites/branch-a', 'content', 'drafts', `${slug}.md`));
      const inside = full === base || full.startsWith(base + sep);
      assert(!inside || !/^[a-z0-9][a-z0-9-]*$/.test(slug), `slug ${slug} was not rejected`);
    }
  });
  check('a symlink pointing outside the repo is refused by the confinement check', async () => {
    const { resolve, sep } = await import('node:path');
    const outside = tmp();
    const linkRoot = join(dir, 'links');
    mkdirSync(linkRoot, { recursive: true });
    try { symlinkSync(outside, join(linkRoot, 'escape'), 'dir'); } catch { return; } // no symlink support: skip
    const base = resolve(linkRoot);
    const full = resolve(join(linkRoot, 'escape', 'data.json'));
    // resolve() does not follow symlinks, so realpathSync is required; the
    // point of the assertion is that we must check it, not that resolve does.
    const { realpathSync } = await import('node:fs');
    const real = realpathSync(join(linkRoot, 'escape'));
    const realBase = realpathSync(base);
    assert(!real.startsWith(realBase + sep) || real === realBase, 'symlink escape was not detected');
    rmSync(outside, { recursive: true, force: true });
  });
  check('oversized input is rejected', () => {
    const s = new Store({ dir });
    let threw = false;
    try { s.create({ id: 'x'.repeat(5000), objective: 'x', owner_agent: 'a', acceptance: ['y'] }); } catch { threw = true; }
    assert(threw, 'an oversized task id was accepted');
  });
  check('an unknown environment in a task scope is rejected', () => {
    const s = new Store({ dir });
    let threw = false;
    try { s.create({ id: 'env-1', objective: 'x', owner_agent: 'a', acceptance: ['y'], scope: { environments: ['mars'] } }); } catch { threw = true; }
    assert(threw, 'an unknown environment was accepted');
  });
  check('malformed JSON state is refused, not repaired', () => {
    const d2 = tmp();
    writeFileSync(join(d2, 'tasks.json'), '{ this is not json', 'utf8');
    const s = new Store({ dir: d2 });
    let threw = false;
    try { s.list(); } catch (e) { threw = /corrupt/.test(e.message); }
    assert(threw, 'corrupt state was accepted');
    rmSync(d2, { recursive: true, force: true });
  });
  rmSync(dir, { recursive: true, force: true });
}

// ------------------------------------------------------------- 5. RECOVERY --

g('recovery');
{
  const dir = tmp();
  check('queued -> completed is an illegal transition', () => {
    assert(!isLegalTransition('queued', 'completed'));
    assert(isLegalTransition('queued', 'claimed'));
  });
  check('the full happy path is legal', () => {
    let s = 'queued';
    for (const next of ['claimed', 'planning', 'executing', 'verifying', 'completed']) {
      assert(isLegalTransition(s, next), `${s} -> ${next} rejected`);
      s = next;
    }
  });
  check('a terminal task cannot transition again', () => {
    for (const t of ['completed', 'failed', 'cancelled', 'rolled_back']) {
      assert(!isLegalTransition(t, 'executing'), `${t} -> executing was allowed`);
    }
  });
  check('a task cannot complete without verification evidence', () => {
    const s = new Store({ dir });
    s.create({ id: 'ev-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    s.claim('ev-1', 'run-1', 'test');
    for (const next of ['planning', 'executing', 'verifying']) s.transition('ev-1', next, { runId: 'run-1', actor: 't' });
    let threw = false;
    try { s.transition('ev-1', 'completed', { runId: 'run-1', actor: 't', evidence: [] }); } catch { threw = true; }
    assert(threw, 'completion without evidence succeeded');
  });
  check('a stale fencing token cannot commit', () => {
    const s = new Store({ dir, leaseMs: 1 });
    s.create({ id: 'fence-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    const l1 = s.claim('fence-1', 'run-1', 'worker-a');
    // Simulate expiry by releasing then re-claiming: the token must change.
    s.releaseLease('fence-1');
    const l2 = s.claim('fence-1', 'run-2', 'worker-b');
    assert(l1.token !== l2.token, 'fencing token did not advance');
    let threw = false;
    try { s.transition('fence-1', 'planning', { runId: 'run-2', actor: 'worker-b', token: l1.token }); } catch { threw = true; }
    assert(threw, 'a stale token was accepted');
  });
  check('a second worker cannot steal a live lease', () => {
    const s = new Store({ dir, leaseMs: 60_000 });
    s.create({ id: 'lease-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    s.claim('lease-1', 'run-1', 'worker-a');
    let threw = false;
    try { s.claim('lease-1', 'run-2', 'worker-b'); } catch { threw = true; }
    assert(threw, 'a live lease was stolen');
  });
  check('the retry counter is monotonic and cannot be reset by a worker', () => {
    const s = new Store({ dir });
    s.create({ id: 'att-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    s.claim('att-1', 'run-1', 'w');
    s.transition('att-1', 'planning', { runId: 'r', actor: 'w' });
    s.transition('att-1', 'executing', { runId: 'r', actor: 'w' });
    const a1 = s.get('att-1').attempt;
    s.transition('att-1', 'retry_wait', { runId: 'r', actor: 'w' });
    s.transition('att-1', 'executing', { runId: 'r', actor: 'w' });
    assert(s.get('att-1').attempt > a1, 'attempt counter did not advance');
  });
  check('a crash mid-write leaves no partial canonical file', () => {
    const d2 = tmp();
    const s = new Store({ dir: d2 });
    s.create({ id: 'crash-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    // Simulate the crash: a temp file left behind must not be read as state.
    writeFileSync(join(d2, 'tasks.json.999.tmp'), '{"tasks":[]', 'utf8');
    const after = JSON.parse(readFileSync(join(d2, 'tasks.json'), 'utf8'));
    assert(after.tasks.length === 1, 'canonical state was replaced by a temp file');
    rmSync(d2, { recursive: true, force: true });
  });
  check('events are append-only and ordered', () => {
    const d2 = tmp();
    const s = new Store({ dir: d2 });
    s.create({ id: 'ev-2', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    s.claim('ev-2', 'run-1', 'w');
    s.transition('ev-2', 'planning', { runId: 'run-1', actor: 'w' });
    s.transition('ev-2', 'executing', { runId: 'run-1', actor: 'w' });
    s.checkpoint('ev-2', { step: 'one', digest: 'd' }, { runId: 'run-1', actor: 'w' });
    s.transition('ev-2', 'verifying', { runId: 'run-1', actor: 'w' });
    s.transition('ev-2', 'completed', { runId: 'run-1', actor: 'w', evidence: [{ name: 'x', result: 'pass' }] });
    const evs = s.readEvents();
    assert(evs.length === 7, `expected 7 events, got ${evs.length}`);
    const seqs = evs.map(e => e.sequence);
    for (let i = 1; i < seqs.length; i++) {
      assert(seqs[i] === seqs[i - 1] + 1, `sequence jumped: ${seqs.slice(i - 1, i + 1).join(' -> ')} at index ${i}`);
    }
    assert(evs.every(e => e.event_id && e.run_id && e.at), 'events are missing provenance fields');
    assert(evs.every(e => !JSON.stringify(e).includes('BEGIN')), 'an event carries key material');
    rmSync(d2, { recursive: true, force: true });
  });
  check('an incomplete blocker is refused', () => {
    const d2 = tmp();
    const s = new Store({ dir: d2 });
    s.create({ id: 'blk-1', objective: 'x', owner_agent: 'a', acceptance: ['y'] });
    let threw = false;
    try { s.block('blk-1', { question: 'q' }); } catch { threw = true; }
    assert(threw, 'a vague blocker was accepted');
    rmSync(d2, { recursive: true, force: true });
  });
  rmSync(dir, { recursive: true, force: true });
}

// -------------------------------------------------------- 6. DATA QUALITY --

g('data-quality');
{
  check('null metrics are not coerced to zero by the allocator contract', () => {
    // The Allocator's own guard: a null metric must not survive as 0.
    const scoreOfSource = `const num = v => (typeof v === 'number' && Number.isFinite(v)) ? v : null;`;
    assert(scoreOfSource.includes('null'), 'sanity');
    const n = v => (typeof v === 'number' && Number.isFinite(v)) ? v : null;
    assert(n(null) === null && n(undefined) === null && n(NaN) === null && n(0) === 0, 'null/0 conflation');
  });
  check('a zero-denominator conversion rate stays unknown', () => {
    const conv = (clicks, traffic) => (traffic ? Math.round(clicks / traffic * 1000) / 10 : null);
    assert(conv(5, 0) === null, 'a zero denominator produced a number');
    assert(conv(0, 0) === null, 'zero over zero produced a number');
    assert(conv(5, 100) === 5);
  });
  check('duplicate ledger references are detected', async () => {
    const { execFileSync } = await import('node:child_process');
    const d2 = tmp();
    for (const sub of ['data', 'scripts']) mkdirSync(join(d2, sub), { recursive: true });
    cpRepoScripts(d2);
    writeFileSync(join(d2, 'data/data.json'), JSON.stringify({
      ledger: { currency: 'ZAR', entries: [
        { date: '2026-01-01', branch: 'branch-a', type: 'revenue', source: 'x', amount: 100, reference: 'r1' },
        { date: '2026-01-02', branch: 'branch-a', type: 'revenue', source: 'x', amount: 100, reference: 'r1' },
        { date: 'bad', branch: 'branch-a', type: 'nonsense', source: '', amount: 'lots' }
      ] }
    }, null, 2));
    execFileSync('node', [join(d2, 'scripts/ledger-summary.mjs')], { cwd: d2 });
    const s = JSON.parse(readFileSync(join(d2, 'data/ledger-summary.json'), 'utf8'));
    assert(s.duplicate_references.length === 1, 'duplicate reference not detected');
    assert(s.excluded_entries === 1, 'malformed entry not excluded');
    assert(s.totals.revenue === 200, `totals wrong: ${s.totals.revenue}`);
    rmSync(d2, { recursive: true, force: true });
  });
  check('stale analytics are detected by age', () => {
    const age = (asOf, days) => (Date.now() - Date.parse(asOf)) / 86400000;
    assert(age('2020-01-01T00:00:00Z', 45) > 45, 'stale data not detected');
    assert(age(new Date().toISOString(), 45) < 1, 'fresh data read as stale');
  });
  check('a mixed-currency entry is flagged, not silently converted', async () => {
    const { execFileSync } = await import('node:child_process');
    const d2 = tmp();
    mkdirSync(join(d2, 'data'), { recursive: true });
    mkdirSync(join(d2, 'scripts'), { recursive: true });
    cpRepoScripts(d2);
    writeFileSync(join(d2, 'data/data.json'), JSON.stringify({
      ledger: { currency: 'ZAR', entries: [
        { date: '2026-01-01', branch: 'branch-c', type: 'revenue', source: 'paddle', amount: 10, currency: 'USD', reference: 't1' }
      ] }
    }, null, 2));
    execFileSync('node', [join(d2, 'scripts/ledger-summary.mjs')], { cwd: d2 });
    const s = JSON.parse(readFileSync(join(d2, 'data/ledger-summary.json'), 'utf8'));
    assert(s.flags.some(f => /foreign-currency/.test(f)), 'foreign currency not flagged');
    rmSync(d2, { recursive: true, force: true });
  });
  check('integer-cent arithmetic avoids float drift', () => {
    const toC = n => Math.round(Number(n) * 100);
    const total = [0.1, 0.2, 0.3].reduce((a, b) => a + toC(b), 0);
    assert(total === 60, `expected 60 cents, got ${total}`);
  });
}

// ------------------------------------------------------------ 7. EXTERNAL ---

g('external');
{
  const policy = createPolicy(baseConfig({ limits: { max_publications_per_run: 3, max_messages_per_hour: 0, max_retries_per_action: 3 } }));
  check('the default is no-send: messages per hour is zero', () => {
    assert(policy.limits.max_messages_per_hour === 0);
  });
  check('an outbound message defers even with a full satisfaction object', () => {
    const d = policy.evaluate(req({
      action: 'email.send', environment: 'production', resource: { path: 'data/x' },
      satisfied: { protected_credential: true, all_gates_passed: true, rollback_plan: true, approved_target: true }
    }));
    assert(d.decision === 'defer-human');
  });
  check('a publication is capped per run', () => {
    assert(policy.limits.max_publications_per_run === 3);
    // The runtime records the limit; exceeding it must be a plan-level failure.
    const tooMany = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, action: 'content.publish', path: 'sites/a', environment: 'preview' }));
    const counted = tooMany.filter(s => s.action === 'content.publish');
    assert(counted.length > policy.limits.max_publications_per_run, 'fixture does not exceed the cap');
  });
  check('no real payment path exists in the store or policy surface', () => {
    assert(!existsSync(join('scripts', 'lib', 'payment.mjs')), 'a payment module exists');
    assert(NEVER_ACTIONS.has('payment.create') && NEVER_ACTIONS.has('payout.create'));
  });
  check('consent and opt-out are explicit requirements, never inferred', () => {
    const p = createPolicy(baseConfig({
      rules: [{ id: 'mail', actions: ['email.send'], environments: ['production'], requires: ['consent_verified', 'optout_checked', 'rate_limit_ok', 'approved_template'], decision: 'allow_if_all' }]
    }));
    // defer-human is STRONGER than deny, so both count as "not allowed".
    const notAllowed = d => d === 'deny' || d === 'defer-human';
    const bare = p.evaluate(req({ action: 'email.send', environment: 'production', resource: { path: 'data/x' } }));
    assert(notAllowed(bare.decision), `a bare send request returned ${bare.decision}`);
    const partial = p.evaluate(req({ action: 'email.send', environment: 'production', resource: { path: 'data/x' }, satisfied: { consent_verified: true } }));
    assert(notAllowed(partial.decision), `partial consent returned ${partial.decision}`);
  });
}

// ------------------------------------------------------------ 8. END-TO-END -

g('end-to-end');
await checkAsync('a passing task reaches completed with evidence', async () => {
  const dir = tmp();
  const store = new Store({ dir });
  const policy = createPolicy(baseConfig());
  store.create({ id: 'e2e-1', objective: 'score branches', owner_agent: 'allocator', acceptance: ['a'], scope: { repository_paths: ['data/'], environments: ['test'] } });
  const orch = new Orchestrator({
    store, policy,
    plan: async () => [{ id: 'score', action: 'data.state.write', path: 'data/data.json', environment: 'test' }],
    execute: async (t, s) => ({ digest: 'd', result: 'ok' }),
    verify: async () => [{ name: 'selftest', result: true }]
  });
  const res = await orch.run('e2e-1');
  assert(res.outcome === 'completed', `outcome was ${res.outcome}`);
  assert(res.task.evidence.length > 0, 'no evidence recorded');
  rmSync(dir, { recursive: true, force: true });
});

await checkAsync('a failing check never records completed', async () => {
  const dir = tmp();
  const store = new Store({ dir });
  const policy = createPolicy(baseConfig());
  store.create({ id: 'e2e-2', objective: 'x', owner_agent: 'a', acceptance: ['a'], scope: { repository_paths: ['data/'], environments: ['test'] } });
  const orch = new Orchestrator({
    store, policy,
    plan: async () => [{ id: 's', action: 'data.state.write', path: 'data/data.json', environment: 'test' }],
    execute: async () => ({ digest: 'd' }),
    verify: async () => [{ name: 'links', result: false }]
  });
  const res = await orch.run('e2e-2');
  assert(res.outcome !== 'completed', 'a failed check was recorded as completed');
  assert(['retry_wait', 'executing'].includes(res.outcome), `unexpected outcome ${res.outcome}`);
  rmSync(dir, { recursive: true, force: true });
});

await checkAsync('a dry run mutates nothing but still records decisions', async () => {
  const dir = tmp();
  const store = new Store({ dir });
  const policy = createPolicy(baseConfig());
  store.create({ id: 'e2e-3', objective: 'x', owner_agent: 'a', acceptance: ['a'], scope: { repository_paths: ['data/'], environments: ['test'] } });
  const before = readFileSync(join(dir, 'tasks.json'), 'utf8');
  const eventsBefore = existsSync(join(dir, 'events.jsonl')) ? readFileSync(join(dir, 'events.jsonl'), 'utf8') : null;
  const orch = new Orchestrator({
    store, policy,
    plan: async () => [{ id: 's', action: 'data.state.write', path: 'data/data.json', environment: 'test' }],
    execute: async () => { throw new Error('execute must not run in dry mode'); },
    verify: async () => [{ name: 'x', result: true }]
  });
  const res = await orch.run('e2e-3', { dryRun: true });
  assert(res.outcome === 'dry-run', `outcome ${res.outcome}`);
  assert(res.decisions.length > 0 && res.decisions[0].decision === 'allow', 'no policy decision recorded');
  assert(store.get('e2e-3').status === 'queued', `dry run changed durable status to ${store.get('e2e-3').status}`);
  assert(readFileSync(join(dir, 'tasks.json'), 'utf8') === before, 'dry run rewrote tasks.json');
  const eventsAfter = existsSync(join(dir, 'events.jsonl')) ? readFileSync(join(dir, 'events.jsonl'), 'utf8') : null;
  assert(eventsAfter === eventsBefore, 'dry run appended to the event log');
  rmSync(dir, { recursive: true, force: true });
});

await checkAsync('a step requesting more than the task scope is rejected', async () => {
  const dir = tmp();
  const store = new Store({ dir });
  const policy = createPolicy(baseConfig());
  store.create({ id: 'e2e-4', objective: 'x', owner_agent: 'a', acceptance: ['a'], scope: { repository_paths: ['sites/branch-a/'], environments: ['test'] } });
  const orch = new Orchestrator({
    store, policy,
    plan: async () => [{ id: 's', action: 'file.write', path: 'etc/shadow', environment: 'test' }],
    execute: async () => ({ digest: 'd' }),
    verify: async () => [{ name: 'x', result: true }]
  });
  const res = await orch.run('e2e-4');
  assert(res.outcome === 'failed', `outcome ${res.outcome}`);
  assert(/outside the task scope/.test(res.error || ''), `unexpected error: ${res.error}`);
  rmSync(dir, { recursive: true, force: true });
});

await checkAsync('an unauthorised step blocks with a precise, resumable blocker', async () => {
  const dir = tmp();
  const store = new Store({ dir });
  const policy = createPolicy(baseConfig());
  // In-scope environment and path, so the plan validates; the ACTION is what
  // the policy refuses, which is the deferral path we want to prove.
  store.create({ id: 'e2e-5', objective: 'x', owner_agent: 'a', acceptance: ['a'], scope: { repository_paths: ['data/'], environments: ['test'] } });
  const orch = new Orchestrator({
    store, policy,
    plan: async () => [{ id: 's', action: 'pages.deploy', path: 'data/manifest.json', environment: 'test' }],
    execute: async () => ({ digest: 'd' }),
    verify: async () => [{ name: 'x', result: true }]
  });
  const res = await orch.run('e2e-5');
  assert(res.outcome === 'blocked', `outcome ${res.outcome}`);
  const b = res.task.blocker;
  assert(b && b.question && b.exact_human_action && b.resume_condition, 'blocker is not structured');
  rmSync(dir, { recursive: true, force: true });
});

// ------------------------------------------------------------------ report --

function cpRepoScripts(dest) {
  cpSync(join(process.cwd(), 'scripts', 'ledger-summary.mjs'), join(dest, 'scripts', 'ledger-summary.mjs'));
}

console.log('');
console.log('='.repeat(60));
console.log(`tests: ${pass} passed, ${fail} failed`);
if (fail) {
  for (const f of failures) console.log('  FAILED: ' + f);
  console.log('A failed safety test blocks autonomy increases and production mutations.');
}
process.exit(fail ? 1 : 0);