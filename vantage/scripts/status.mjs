#!/usr/bin/env node
/**
 * VANTAGE terminal status - dependency-free (Node 18+).
 * One glance at everything that matters without opening the dashboard.
 * Read-only. NEVER sends anything anywhere.
 * Usage: node scripts/status.mjs
 * CEO habit: run this before reading anything else.
 */
import { readFileSync, existsSync } from 'node:fs';

const D = JSON.parse(readFileSync('data/data.json', 'utf8'));
// Unknown is not zero: a metric that never arrived prints as "unknown".
const money = n => (n === null || n === undefined ? 'unknown' : 'R' + Math.round(Number(n) || 0).toLocaleString('en-ZA'));
const num = (n, dp = 0) => (n === null || n === undefined ? 'unknown' : Number(n).toLocaleString('en-ZA', { maximumFractionDigits: dp }));
const line = (l, r) => `  ${l.padEnd(28)}${r}`;

console.log('VANTAGE STATUS - ' + (D.status_line || ''));
console.log('='.repeat(60));
console.log(`AUTONOMY: level ${D.autonomy?.level ?? 0}` + ((D.autonomy?.level ?? 0) >= 1 ? ' (safe-class actions execute autonomously; NEVER-class stays CEO)' : ' (draft-only - every action awaits approval)'));
console.log(`KILL SWITCH: ${D.policy?.kill_switch ? 'ENGAGED - mutations are denied' : 'off'}`);
console.log('');

console.log('REVENUE');
console.log(line('this week', money(D.revenue?.this_week)));
console.log(line('this month', money(D.revenue?.this_month)));
console.log(line('all-time', money(D.revenue?.all_time)));
console.log('');

console.log('BRANCHES');
for (const b of Object.values(D.branches || {})) {
  const fresh = b.metrics_as_of ? `as of ${String(b.metrics_as_of).slice(0, 10)}` : 'no analytics yet';
  console.log(line(b.name, `${b.mode} | 30d rev ${money(b.metrics?.revenue_30d)} | quota ${num(b.quota?.articles_per_week, 2)}/wk`));
  console.log(line('  data freshness', fresh));
}
if (D.capacity) {
  const total = Object.values(D.branches || {}).reduce((a, b) => a + (Number(b.quota?.articles_per_week) || 0), 0);
  console.log(line('capacity used / ceiling', `${num(total, 2)} / ${num(D.capacity.total_articles_per_week, 2)} per week`));
}
console.log('');

const q = (D.decision_queue || []).filter(x => x.status === 'pending' || x.status === 'held-for-human');
console.log(`NEEDS YOUR INPUT (${q.length})`);
if (!q.length) console.log('  nothing pending - good week');
for (const x of q) console.log(line(`[${x.type}] ${x.title}`, (x.status === 'held-for-human' ? 'HELD: ' : 'from ') + x.from_agent));
console.log('');

const ex = existsSync('data/experiments.json') ? JSON.parse(readFileSync('data/experiments.json', 'utf8')) : {};
const running = (ex.experiments || []).filter(x => x.status === 'running');
console.log(`EXPERIMENTS (${(ex.experiments || []).length} total, ${running.length} running)`);
for (const x of running.slice(-5)) console.log(line(x.id, `[${x.branch}] ${x.hypothesis || ''}`.slice(0, 60)));
console.log('');

if (existsSync('data/ledger-summary.json')) {
  const L = JSON.parse(readFileSync('data/ledger-summary.json', 'utf8'));
  console.log('LEDGER');
  console.log(line('revenue / cost / net', `${money(L.totals?.revenue)} / ${money(L.totals?.cost)} / ${money(L.totals?.net)}`));
  for (const f of L.flags || []) console.log('  FLAG: ' + f);
  if (!(L.flags || []).length) console.log('  no compliance flags');
  console.log('');
}

const mem = existsSync('data/agent-memory.json') ? JSON.parse(readFileSync('data/agent-memory.json', 'utf8')) : {};
const pinned = (mem.lessons || []).filter(l => l.pinned);
console.log(`PINNED LESSONS (${pinned.length})`);
for (const l of pinned.slice(-5)) console.log('  - ' + l.text);
if (!pinned.length) console.log('  none pinned yet');

const sp = D.sales_pipeline || [];
if (sp.length) {
  console.log('');
  console.log(`SALES PIPELINE (${sp.length})`);
  for (const s of sp) console.log(line(`${s.name || s.id}`, `${s.stage}${s.reason ? ' - ' + s.reason : ''}`));
}