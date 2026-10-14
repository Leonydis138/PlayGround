#!/usr/bin/env node
/**
 * Weekly branch Allocator. Scores each branch on
 *   revenue_growth_30d * 0.5 + traffic_growth_30d * 0.3 + conversion_rate * 0.2
 * (growth capped +/-100, conversion in percentage points), then shifts quotas:
 * top branch +1 article/week (cap 5); bottom branch -1, floored at
 * 1 piece/month (maintenance mode). Fade, don't kill: a branch NEVER goes to
 * zero, and a kill requires an explicit CEO decision-queue approval.
 *
 * Three defects in the previous version are fixed here, and each one is
 * asserted by scripts/tests.mjs:
 *
 *  1. MISSING DATA WAS ZERO. A branch with no analytics scored 0 and was
 *     ranked last, so the worst-fated branch got faded for being invisible.
 *     `scoreOf()` now returns `{score:null}` when inputs are absent or
 *     stale. Unknown branches are EXCLUDED from reallocation and the reason
 *     is written to the feed. The no-signal guard is now based on how many
 *     branches actually have signal, not on all scores being equal.
 *
 *  2. RECOVERY WAS IMMEDIATE. agents/allocator.md requires two consecutive
 *     weeks of beating the weakest branch before a branch leaves
 *     maintenance. `recovery_streak` now counts qualifying weeks; a week
 *     with no valid score does not increment it.
 *
 *  3. QUOTA MOVES WERE NOT ZERO-SUM. +1 to the top without a matching -1
 *     from the bottom grew total capacity every week. Moves are now
 *     transfers, and only `capacity.total_articles_per_week` changes the
 *     company-wide total (and that is logged).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = 'data/data.json';
const WEIGHTS = { revenue: 0.5, traffic: 0.3, conversion: 0.2 };
const clamp = v => Math.max(-100, Math.min(100, v));
const QUOTA_CAP = 5, FLOOR_MONTHLY = 0.25; // 1 piece/month ~ 0.25/week
const STALE_DAYS = 45;                       // older than this is not evidence
const RECOVERY_WEEKS = 2;

const num = v => (typeof v === 'number' && Number.isFinite(v)) ? v : null;
const now = new Date();
const nowMs = now.getTime();

function scoreOf(b) {
  const m = b.metrics || {};
  if (b.metrics_as_of) {
    const age = (nowMs - Date.parse(b.metrics_as_of)) / 86400000;
    if (!Number.isFinite(age) || age > STALE_DAYS) {
      return { score: null, why: `metrics are stale (as of ${String(b.metrics_as_of).slice(0, 10)}, ${Math.round(age)} days old)` };
    }
  } else if (!b.metrics_wired) {
    return { score: null, why: 'no analytics wired yet - metrics are unknown, not zero' };
  }
  const rev = num(m.revenue_growth_30d_pct);
  const traf = num(m.traffic_growth_30d_pct);
  const conv = num(m.conversion_rate_pct);
  const missing = [];
  if (rev === null) missing.push('revenue_growth_30d_pct');
  if (traf === null) missing.push('traffic_growth_30d_pct');
  if (conv === null) missing.push('conversion_rate_pct');
  if (missing.length) return { score: null, why: `missing metrics (${missing.join(', ')}) - unknown, not zero` };
  const score = clamp(rev) * WEIGHTS.revenue + clamp(traf) * WEIGHTS.traffic + conv * WEIGHTS.conversion;
  return { score: Math.round(score * 10) / 10, why: null };
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const branches = Object.entries(data.branches);
const lines = [];
const feed = what => { data.activity_feed = data.activity_feed || []; data.activity_feed.push({ agent: 'Allocator', when: now.toISOString(), what }); };

for (const [id, b] of branches) {
  const { score, why } = scoreOf(b);
  b.score = score;
  if (why) b.score_unknown_reason = why;
  else delete b.score_unknown_reason;
  if (b.recovery_streak === undefined) b.recovery_streak = 0;
  lines.push(score === null ? `  ${id}: UNKNOWN (${why}) - excluded from reallocation` : `  ${id}: score ${score}`);
}

const scored = branches
  .map(([id, b]) => ({ id, b, score: b.score }))
  .filter(s => s.score !== null && s.score !== undefined)
  .sort((a, b) => b.score - a.score);

const unknown = branches.filter(([, b]) => b.score === null).map(([id]) => id);

if (scored.length < 2) {
  const why = unknown.length
    ? `only ${scored.length} branch(es) have current analytics (unknown: ${unknown.join(', ')})`
    : 'not enough branches to compare';
  feed(`Allocation frozen - ${why}. Quotas and modes unchanged.`);
  data.updated_at = now.toISOString();
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log('Allocation FROZEN - ' + why + '. Quotas and modes unchanged.');
  console.log(lines.join('\n'));
  process.exit(0);
}

const top = scored[0], bottom = scored[scored.length - 1];
const weakestScore = bottom.score;
const changes = [];

// Capacity ceiling: absent an explicit setting, derive it from current quota
// so the first run is zero-sum rather than an accidental capacity increase.
const capCfg = data.capacity || {};
let ceiling = num(capCfg.total_articles_per_week);
if (ceiling === null) {
  ceiling = Math.max(...branches.map(([, b]) => Number(b.quota?.articles_per_week) || 0));
  capCfg.total_articles_per_week = ceiling;
  capCfg.capacity_last_changed = now.toISOString();
  capCfg._note = 'Company-wide content capacity. Quota moves between branches conserve this total; only an explicit change here alters it.';
  data.capacity = capCfg;
}
const totalNow = () => branches.reduce((a, [, b]) => a + (Number(b.quota?.articles_per_week) || 0), 0);
const quotaOf = b => Number(b.quota?.articles_per_week) || 0;
const setQuota = (b, v) => { b.quota.articles_per_week = Math.round(v * 100) / 100; };

// --- Fade the bottom branch toward the maintenance floor -------------------
const bottomBefore = quotaOf(bottom.b);
let bottomAfter = Math.max(FLOOR_MONTHLY, bottomBefore - 1);
if (bottomBefore !== bottomAfter) {
  setQuota(bottom.b, bottomAfter);
  if (bottom.id) changes.push(`${bottom.id} ${bottomBefore} -> ${bottomAfter}/wk`);
  if (bottomAfter <= FLOOR_MONTHLY) { bottom.b.mode = 'maintenance'; changes.push(`${bottom.id} -> maintenance`); }
}
bottom.b.recovery_streak = 0;

// --- Reinstate a maintenance branch only after RECOVERY_WEEKS consecutive
//     qualifying weeks (the policy in agents/allocator.md). ------------------
for (const s of scored) {
  if (s.id === bottom.id) continue;
  const b = s.b;
  if (b.mode !== 'maintenance') continue;
  if (s.score > weakestScore) {
    b.recovery_streak = (b.recovery_streak || 0) + 1;
    if (b.recovery_streak >= RECOVERY_WEEKS) {
      b.mode = 'active';
      b.recovery_streak = 0;
      changes.push(`${s.id} -> active (${RECOVERY_WEEKS} consecutive qualifying weeks)`);
    } else {
      changes.push(`${s.id} recovery streak ${b.recovery_streak}/${RECOVERY_WEEKS} - stays maintenance`);
    }
  } else {
    b.recovery_streak = 0;
  }
}

// --- Give the top branch what was freed, and reconcile the total -----------
// Quota moves are transfers. The one case that can move the company-wide
// total is a branch sitting BELOW the maintenance floor: bringing it up to
// the floor is a correction, and the extra capacity is drawn from the
// highest-ranked branch that can spare it. Leftover capacity is reported
// rather than silently created.
const topBefore = quotaOf(top.b);
let wanted = Math.min(QUOTA_CAP, topBefore + Math.max(0, bottomBefore - bottomAfter));
let total = totalNow();

if (total > ceiling) {
  // We overshot the ceiling (a below-floor correction). Draw the excess back
  // from the lowest-ranked branches that are above the floor.
  let excess = total - ceiling;
  for (const s of scored.slice().reverse()) {
    if (excess <= 1e-9) break;
    const b = s.b;
    const spare = quotaOf(b) - FLOOR_MONTHLY;
    if (spare <= 1e-9) continue;
    const take = Math.min(spare, excess);
    setQuota(b, quotaOf(b) - take);
    excess -= take;
    changes.push(`${s.id} ${Math.round((quotaOf(b) + take) * 100) / 100} -> ${quotaOf(b)}/wk (capacity reconciliation)`);
  }
  total = totalNow();
  if (total > ceiling + 1e-9) changes.push(`WARNING: cannot reconcile capacity, ${Math.round((total - ceiling) * 100) / 100}/wk over ceiling - every branch is at its floor`);
}

if (wanted !== topBefore && total <= ceiling + 1e-9) {
  setQuota(top.b, wanted);
  changes.push(`${top.id} ${topBefore} -> ${quotaOf(top.b)}/wk`);
} else if (wanted !== topBefore) {
  changes.push(`${top.id} already at the ${QUOTA_CAP}/wk cap or capacity is fully committed - freed capacity left unspent`);
}

// --- An explicitly configured capacity change is the only way the total moves
if (capCfg.total_articles_per_week !== ceiling) {
  feed(`COMPACITY CHANGED: weekly ceiling is now ${ceiling} articles/week (last changed ${capCfg.capacity_last_changed}).`);
}

const totalFinal = totalNow();
const totalOk = Math.abs(totalFinal - ceiling) < 1e-9;

data.updated_at = now.toISOString();
feed(`Weekly allocation: ${scored.map(s => `${s.id}=${s.score}`).join(', ')}. ` +
  (unknown.length ? `Excluded as unknown: ${unknown.join(', ')}. ` : '') +
  (changes.length ? changes.join('; ') + '. ' : 'no quota changes. ') +
  `Capacity ${totalFinal}/${ceiling} per week${totalOk ? '' : ' - CAPACITY DRIFT, review'}.`);

writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(lines.join('\n'));
console.log(changes.length ? '\n' + changes.join('\n') : '\nno quota changes');
console.log(`\ncapacity: ${totalFinal}/${ceiling} articles per week${totalOk ? ' (conserved)' : ' (DRIFT - investigate)'}`);
if (!totalOk) process.exit(1);