#!/usr/bin/env node
/**
 * Branch B cluster scorer - runs at each cluster's 4-6 week mark (wired into
 * the weekly Actions job). Reads data/data.json -> branches.branch-b.clusters[]
 * and applies the Allocator formula (revenue .5 / traffic .3 / conversion .2,
 * growth normalised +/-100).
 *
 * Same rule as the branch Allocator: a cluster whose metrics never arrived
 * is `unknown`, not a 0. An unknown cluster keeps `maintain-test` and says
 * why - it is never judged, and never archived, on absent data.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = 'data/data.json';
const WEIGHTS = { revenue: 0.5, traffic: 0.3, conversion: 0.2 };
const clamp = v => Math.max(-100, Math.min(100, v));
const num = v => (typeof v === 'number' && Number.isFinite(v)) ? v : null;

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const branches = data.branches || {};
const clusters = (branches['branch-b'] && branches['branch-b'].clusters) || [];
const only = process.argv[2];

const verdicts = [];
for (const c of clusters) {
  if (c.status !== 'test') continue;
  if (only && c.name !== only) continue;
  const m = c.metrics || {};
  const rev = num(m.revenue_growth_30d_pct);
  const traf = num(m.traffic_growth_30d_pct);
  const conv = num(m.conversion_rate_pct);
  const missing = [];
  if (rev === null) missing.push('revenue_growth_30d_pct');
  if (traf === null) missing.push('traffic_growth_30d_pct');
  if (conv === null) missing.push('conversion_rate_pct');

  if (missing.length) {
    c.score = null;
    c.verdict = 'maintain-test';
    c.verdict_reason = `unknown: missing ${missing.join(', ')} - not scored, not archived`;
    verdicts.push(`${c.name}: UNKNOWN (missing ${missing.join(', ')}) -> maintain-test`);
    continue;
  }

  const score = clamp(rev) * WEIGHTS.revenue + clamp(traf) * WEIGHTS.traffic + conv * WEIGHTS.conversion;
  const conversions = num(m.conversions_30d) ?? 0;

  let verdict = 'maintain-test';
  if (score >= 20 && conversions > 0) verdict = 'graduate';
  else if (score < -25) verdict = 'maintenance';

  c.score = Math.round(score * 10) / 10;
  c.verdict = verdict;
  delete c.verdict_reason;
  verdicts.push(`${c.name}: score ${c.score} -> ${verdict}`);
}
if (verdicts.length === 0) verdicts.push('No test clusters due for scoring.');

data.activity_feed.push({
  agent: 'Allocator', when: new Date().toISOString(),
  what: `Cluster scoring: ${verdicts.join('; ')}`
});
writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(verdicts.join('\n'));
console.log('\nNOTE: "graduate" moves the cluster to sites/branch-b/graduated/ - a Claude Code thinking step, not automated.');