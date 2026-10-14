#!/usr/bin/env node
/**
 * VANTAGE ledger summary - dependency-free (Node 18+).
 * Prepares the numbers the Accountant agent needs; the Accountant interprets,
 * the CEO's human accountant files. This script NEVER:
 *   - gives tax advice, files anything, or contacts anyone
 * Output: data/ledger-summary.json + console totals.
 * Usage: node scripts/ledger-summary.mjs [--tax-year]
 * Wired into the weekly Actions job (numbers stay current, zero effort).
 *
 * Money handling: amounts are summed in integer minor units (cents) so a
 * ledger of a few thousand entries cannot accumulate binary-float drift into
 * a total that does not reconcile with the raw records. A foreign-currency
 * entry is counted in its own currency and flagged; it is never silently
 * converted, because the FX rate is the Accountant's documented decision.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/data.json', 'utf8'));
const entries = Array.isArray(data.ledger?.entries) ? data.ledger.entries : [];
const NOW = new Date();

// SA tax year: 1 March - end Feb. Year label = the ending year.
function taxYear(d) { const dt = new Date(d); const y = dt.getFullYear(); return dt.getMonth() >= 2 ? y + 1 : y; }
const wantTaxYear = process.argv.includes('--tax-year');
const currentTaxYear = taxYear(NOW.toISOString());

const malformed = [];
const rows = [];
for (const e of entries) {
  const problems = [];
  if (!e || typeof e !== 'object') { malformed.push(String(e)); continue; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || ''))) problems.push('date must be YYYY-MM-DD');
  if (typeof e.amount !== 'number' || !Number.isFinite(e.amount)) problems.push('amount must be a finite number');
  if (e.type !== 'revenue' && e.type !== 'cost') problems.push('type must be revenue or cost');
  if (!e.branch) problems.push('branch is required');
  if (!e.source) problems.push('source is required - an unsourced figure is not a record');
  if (problems.length) { malformed.push(`${e.reference || e.date || 'entry'}: ${problems.join('; ')}`); continue; }
  rows.push({ ...e, ty: taxYear(e.date) });
}
const filtered = rows.filter(e => !wantTaxYear || e.ty === currentTaxYear);

// Duplicate transaction references would double-count money.
const refSeen = new Map();
const duplicates = [];
for (const e of filtered) {
  if (!e.reference) continue;
  if (refSeen.has(e.reference)) duplicates.push(e.reference);
  else refSeen.set(e.reference, 1);
}

const byBranch = {};
const byMonth = {};
let revenueC = 0, costC = 0;
const toCents = n => Math.round(Number(n) * 100);

for (const e of filtered) {
  const cents = toCents(e.amount);
  byBranch[e.branch] = byBranch[e.branch] || { revenue: 0, cost: 0 };
  byMonth[e.date.slice(0, 7)] = byMonth[e.date.slice(0, 7)] || { revenue: 0, cost: 0 };
  if (e.type === 'revenue') {
    revenueC += cents; byBranch[e.branch].revenue += cents; byMonth[e.date.slice(0, 7)].revenue += cents;
  } else {
    costC += cents; byBranch[e.branch].cost += cents; byMonth[e.date.slice(0, 7)].cost += cents;
  }
}
const rands = c => Math.round(c) / 100;
for (const b of Object.values(byBranch)) { b.revenue = rands(b.revenue); b.cost = rands(b.cost); }
for (const m of Object.values(byMonth)) { m.revenue = rands(m.revenue); m.cost = rands(m.cost); }

const flags = [];
if (malformed.length) flags.push(`${malformed.length} malformed ledger entr${malformed.length === 1 ? 'y' : 'ies'} excluded from totals - fix data/data.json (${malformed.slice(0, 3).join(' | ')})`);
if (duplicates.length) flags.push(`${duplicates.length} duplicate ledger reference(s): ${[...new Set(duplicates)].slice(0, 5).join(', ')} - a repeated reference double-counts revenue`);
// VAT registration threshold (SA): R1m taxable supplies / 12 months.
// Flag at 60% so the CEO has runway to talk to the accountant. Number only,
// never advice.
const rolling12mC = filtered
  .filter(e => (NOW - new Date(e.date)) < 365 * 86400000 && e.type === 'revenue' && (e.currency || 'ZAR') === 'ZAR')
  .reduce((a, e) => a + toCents(e.amount), 0);
const rolling12m = rands(rolling12mC);
if (rolling12m > 600000) flags.push(`Rolling 12-month ZAR revenue R${Math.round(rolling12m).toLocaleString('en-ZA')} is above 60% of the R1m VAT registration threshold - raise with the accountant`);
// Foreign-source payouts: networks pay USD/EUR/GBP - withholding is real.
const foreign = filtered.filter(e => e.type === 'revenue' && e.currency && e.currency !== 'ZAR');
if (foreign.length) flags.push(`${foreign.length} foreign-currency payout entries this tax year - excluded from the ZAR rolling total; verify withholding treatment with the accountant`);

const summary = {
  generated_at: NOW.toISOString(),
  tax_year: wantTaxYear ? currentTaxYear : null,
  totals: { revenue: rands(revenueC), cost: rands(costC), net: rands(revenueC - costC), entries: filtered.length },
  excluded_entries: malformed.length,
  duplicate_references: [...new Set(duplicates)],
  by_branch: byBranch,
  by_month: byMonth,
  flags
};
writeFileSync('data/ledger-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(`Ledger summary: ${filtered.length} entries, revenue R${Math.round(rands(revenueC)).toLocaleString('en-ZA')}, cost R${Math.round(rands(costC)).toLocaleString('en-ZA')}`);
for (const f of flags) console.log(`FLAG: ${f}`);
if (filtered.length === 0) console.log('(no ledger entries yet - bootstrap is honest)');