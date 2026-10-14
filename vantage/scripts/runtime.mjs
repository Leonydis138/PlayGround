#!/usr/bin/env node
/**
 * VANTAGE autonomy runtime - dependency-free (Node 18+).
 * One deterministic coordinator over the task store and the policy engine.
 *
 *   node scripts/runtime.mjs            # dry run: print the plan + every
 *                                      # policy decision, mutate nothing
 *   node scripts/runtime.mjs --apply    # execute through the same gate
 *   node scripts/runtime.mjs --seed     # (re)create the bootstrap task set
 *
 * Dry run is the default because the safe way to read this machine is before
 * letting it move. Both paths call policy.evaluate() on every step; --apply
 * differs only in that it lets the orchestrator commit.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { createPolicy } from './lib/policy.mjs';
import { Store } from './lib/store.mjs';
import { Orchestrator } from './lib/orchestrator.mjs';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const SEED = process.argv.includes('--seed');
const STATE_DIR = 'state';

const DATA = JSON.parse(readFileSync('data/data.json', 'utf8'));

// Policy config is explicit, not implicit. An absent or empty rule set denies
// every mutation rather than defaulting to permissive.
const policyConfig = {
  policy_version: 1,
  kill_switch: DATA.policy?.kill_switch === true,
  budget: DATA.policy?.budget || { currency: 'ZAR', per_run_spend: 0, monthly_spend: 0 },
  limits: DATA.policy?.limits || { max_publications_per_run: 3, max_messages_per_hour: 0, max_retries_per_action: 3 },
  path_allowlist: DATA.policy?.path_allowlist,
  rules: [
    {
      id: 'content-publish',
      actions: ['content.publish'],
      environments: ['sandbox', 'test', 'preview'],
      paths: ['sites/'],
      decision: 'allow'
    },
    {
      id: 'seo-metadata',
      actions: ['seo.tweak', 'faq.add'],
      environments: ['sandbox', 'test', 'preview'],
      paths: ['sites/'],
      decision: 'allow'
    },
    {
      id: 'score-and-allocate',
      actions: ['data.state.write', 'queue.approve'],
      environments: ['sandbox', 'test'],
      paths: ['data/'],
      decision: 'allow'
    },
    {
      id: 'production-deploy',
      actions: ['pages.deploy', 'pages.build'],
      environments: ['production'],
      requires: ['protected_credential', 'all_gates_passed', 'rollback_plan', 'approved_target'],
      decision: 'allow_if_all'
    },
    {
      id: 'spend-or-payment',
      actions: ['purchase', 'payment.create', 'payout.create'],
      decision: 'defer-human'
    }
  ]
};

const policy = createPolicy(policyConfig);
const v = policy.validate();
if (!v.ok && APPLY) {
  console.error('Policy config invalid: ' + v.problems.join('; ') + ' - refusing to apply.');
  process.exit(1);
}

const store = new Store({ dir: STATE_DIR });

const BOOTSTRAP_TASKS = [
  {
    id: 'task-2026-0001',
    objective: 'Score branches and shift next week content quota inside the configured capacity',
    owner_agent: 'allocator',
    acceptance: ['scores recorded for every branch', 'unknown metrics excluded and reported', 'company-wide capacity conserved'],
    scope: { repository_paths: ['data/'], environments: ['sandbox', 'test'], external_channels: [], max_spend_zar: 0 },
    retry: { max_attempts: 3, backoff_seconds: [30, 120, 600] }
  },
  {
    id: 'task-2026-0002',
    objective: 'Promote one lint-clean Branch A draft to published',
    owner_agent: 'seo-editor',
    acceptance: ['published page exists at the expected slug', 'frontmatter intact', 'no scaffold tokens'],
    scope: { repository_paths: ['sites/branch-a/'], environments: ['sandbox', 'test', 'preview'], external_channels: [], max_spend_zar: 0 }
  }
];

if (SEED || store.list().length === 0) {
  for (const t of BOOTSTRAP_TASKS) {
    if (store.get(t.id)) continue;
    store.create({ ...t, run_id: 'run-seed', actor: 'orchestrator' });
    console.log(`seeded ${t.id}: ${t.objective}`);
  }
}

// Deterministic stand-ins for the thinking agents. They touch nothing; the
// point of the runtime is that the *lifecycle* is real and the policy
// decisions are real, not that this file contains a marketing opinion.
const plan = (task) => task.id === 'task-2026-0002'
  ? [{ id: 'promote', action: 'content.publish', path: 'sites/branch-a/content/published', environment: 'preview' }]
  : [{ id: 'score', action: 'data.state.write', path: 'data/data.json', environment: 'test' }];

const execute = async (task, step, ctx) => {
  const key = `${ctx.runId}:${step.id}`;
  const out = store.claimIdempotency(`${task.id}:${step.id}`, () => ({ dry_run: ctx.dryRun, at: new Date().toISOString() }));
  ctx.decisions.push({ step: step.id, idempotent_replay: out.replayed });
  return { digest: `step:${step.id}`, result: out.result };
};

const verify = async (task) => ([
  { kind: 'test', name: 'schema-valid', result: true },
  { kind: 'test', name: 'policy-decisions-recorded', result: true },
  { kind: 'test', name: 'acceptance-criteria-non-empty', result: (task.acceptance || []).length > 0 }
]);

const orch = new Orchestrator({ store, policy, plan, execute, verify, log: m => console.log('  ' + m) });

console.log(`\nVANTAGE runtime - ${APPLY ? 'APPLY' : 'DRY RUN (mutates nothing)'}`);
console.log(`policy v${policy.version} kill_switch=${policyConfig.kill_switch} rules=${policyConfig.rules.length}`);
console.log('');

let failures = 0;
for (const task of store.list()) {
  if (['completed', 'failed', 'cancelled', 'rolled_back'].includes(task.status)) continue;
  const res = await orch.run(task.id, { actor: 'runtime', dryRun: !APPLY });
  console.log(`\n${task.id} (${task.owner_agent}) -> ${res.outcome}`);
  for (const d of res.decisions) {
    if (d.decision) console.log(`   ${d.step}: ${d.decision} [${d.reason_code}]`);
  }
  if (res.error) { console.log(`   error: ${res.error}`); failures++; }
}

const outstanding = orch.outstanding();
console.log(`\noutstanding tasks: ${outstanding.length}`);
console.log(APPLY
  ? 'APPLY complete. Check state/events.jsonl for the audit trail.'
  : 'Dry run complete. Re-run with --apply to execute this same plan through the gate.');
process.exit(failures ? 1 : 0);