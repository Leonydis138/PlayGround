#!/usr/bin/env node
/**
 * VANTAGE autonomy gate - dependency-free (Node 18+).
 *
 * Executes what the agents are authorized to do without the CEO, per the
 * autonomy config in data/data.json:
 *   level 0: draft-only (nothing auto-executes)
 *   level 1: SAFE-class actions execute autonomously
 *   level 2: level 1 + bounded routine edits to published content
 * NEVER auto-executed at ANY level (hard floor, see agents/autonomy.md):
 *   legal, pricing, affiliate-program signup, payments/payouts, sending
 *   anything to a real person (email/DM), security/secrets.
 *
 * Defects fixed in this version (each asserted by scripts/tests.mjs):
 *
 *  1. PATH SAFETY. The slug came from `item.title` with no validation and was
 *     joined straight into a path. A crafted title could produce `../../..`.
 *     Slugs are now validated against /^[a-z0-9][a-z0-9-]*$/, resolved to an
 *     absolute path, and proven to sit inside an allowlisted content root
 *     before anything is moved.
 *  2. COLLISIONS. An existing published file was overwritten. It is now
 *     refused and the reason is logged.
 *  3. IDEMPOTENCY. A second run could re-approve or re-promote. Each
 *     mutation now carries an idempotency key and the gate records what it
 *     did; a repeat run is a no-op.
 *  4. NEVER-CLASS WAS SILENT. NEVER items were skipped with no trace, so a
 *     human could never tell the queue was waiting on them. They are now
 *     marked `held-for-human` with the reason, and stay visible.
 *  5. LEVEL 2 WAS DOCUMENTED BUT ABSENT. `seo-tweak` / `faq-add` produced no
 *     edit path at all. Level 2 now applies a strictly bounded metadata edit
 *     (description field only, inside the content allowlist), or reports
 *     that the requested edit is out of scope rather than silently doing
 *     nothing.
 *
 * Usage: node scripts/autonomy.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync, realpathSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const D = JSON.parse(readFileSync('data/data.json', 'utf8'));
const CFG = D.autonomy || { level: 0 };
const DRY = process.argv.includes('--dry');
const NOW = new Date().toISOString();
const applied = (D.autonomy_applied = D.autonomy_applied || []);
const seen = new Set(applied.map(r => r.key));

/**
 * Record an outcome once per logical key. Re-running the gate a week later
 * must not re-log the same refusal every single time - an unresolved
 * incident should be reported once, not spammed into the feed forever.
 */
function note(key, what) {
  if (seen.has(key)) return false;
  seen.add(key);
  if (!DRY) applied.push({ key, at: NOW, note: what });
  (D.activity_feed = D.activity_feed || []).push({ agent: 'Autonomy', when: NOW, what: `[auto] ${what}` });
  console.log('  ' + what);
  return true;
}

// Classes that may execute autonomously at level >= 1.
const SAFE = ['content-publish', 'experiment-verdict', 'cluster-archive', 'cluster-graduate', 'social-queue', 'faq-add', 'seo-tweak'];
// Hard floor: never at any level.
const NEVER = ['legal', 'pricing', 'affiliate-signup', 'payment', 'payout', 'outbound-send', 'security', 'product-pick'];

// Roots an autonomy-driven file mutation may touch. Nothing outside these.
const CONTENT_ROOTS = ['sites/branch-a', 'sites/branch-b'];
const MAX_SEO_EDIT_FIELD = 400;   // description length ceiling

if (!CFG.level) {
  console.log('Autonomy: level 0 - draft-only mode, nothing auto-executes. Nothing done.');
  process.exit(0);
}

/** Content roots that actually exist and can receive a promoted draft. */
function contentRoots() {
  const roots = [];
  for (const r of CONTENT_ROOTS) if (existsSync(r)) roots.push(r);
  if (existsSync('sites/branch-b')) {
    for (const e of readdirSync('sites/branch-b', { withFileTypes: true })) {
      if (e.isDirectory() && !['TEMPLATE', 'archived', 'graduated'].includes(e.name)) {
        roots.push(join('sites/branch-b', e.name));
      }
    }
  }
  return roots;
}

/**
 * Derive a slug from a title, then PROVE the resulting path is inside an
 * allowlisted root. Returns null when anything about it is suspicious.
 */
function safeDraftPath(root, slug) {
  if (typeof slug !== 'string') return null;
  const s = slug.trim().toLowerCase();
  if (!s || s.length > 120) return null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) return null;   // rejects .., /, spaces, unicode
  const base = resolve(process.cwd(), root);
  const full = resolve(join(root, 'content', 'drafts', `${s}.md`));
  if (full !== base && !full.startsWith(base + sep)) return null;  // confinement
  return full;
}

let approved = 0, promoted = 0, refused = 0, held = 0, edits = 0;

// 1. Approve SAFE-class pending items; hold NEVER-class items visibly.
for (const item of D.decision_queue || []) {
  if (NEVER.includes(item.type)) {
    if (item.status === 'pending') {
      item.status = 'held-for-human';
      item.held_reason = 'NEVER class (' + item.type + ') - human action required at every autonomy level';
      note(`hold:${item.id}`, `HELD ${item.id} [${item.type}]: ${item.title} - NEVER class, needs a human`);
      held++;
    }
    continue;
  }
  if (item.status !== 'pending') continue;
  if (SAFE.includes(item.type)) {
    item.status = 'approved';
    item.resolved_at = NOW;
    item.resolution_note = 'auto-approved by autonomy gate (level ' + CFG.level + ', class ' + item.type + ')';
    note(`approve:${item.id}`, `auto-approved ${item.id} [${item.type}]: ${item.title}`);
    approved++;
  }
}

// 2. Draft promotion for approved content-publish items.
for (const item of D.decision_queue || []) {
  if (item.status !== 'approved' || item.type !== 'content-publish' || item.autonomy_done) continue;
  const slug = item.draft_slug || (item.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

  const roots = contentRoots();
  let target = null;
  for (const root of roots) {
    const p = safeDraftPath(root, slug);
    if (p && existsSync(p)) { target = { root, src: p }; break; }
  }
  const refuse = (why) => { note(`refuse:${item.id}:${why}`, `refused promotion of "${slug}": ${why}`); refused++; };
  if (!target) {
    // Refuse loudly rather than scanning the whole tree for a near-match.
    refuse('no draft at that path under the content roots');
    continue;
  }
  const dst = join(target.root, 'content', 'published', slug + '.md');
  if (existsSync(dst)) {
    refuse('a published page with that slug already exists - refusing to overwrite');
    continue;
  }
  const raw = readFileSync(target.src, 'utf8');
  const words = raw.replace(/^---[\s\S]*?---/, '').trim().split(/\s+/).filter(Boolean).length;
  if (/\b(TODO|FIXME|XXX|TBD)\b|lorem ipsum/i.test(raw)) { refuse('scaffold leftover'); continue; }
  if (words < 800) { refuse(`${words} words (< 800)`); continue; }
  // Promotion must be idempotent: the key names the exact intended mutation.
  const key = `promote:${target.root}:${slug}`;
  if (seen.has(key)) {
    item.autonomy_done = true;
    continue;
  }
  if (!DRY) {
    mkdirSync(join(target.root, 'content', 'published'), { recursive: true });
    renameSync(target.src, dst);
  }
  note(key, `${DRY ? '[dry] would promote' : 'promoted'} draft -> published: ${slug} (${words} words, gates passed)`);
  item.autonomy_done = true;
  promoted++;
}

// 3. Level 2: bounded routine edits to published content.
if (CFG.level >= 2) {
  for (const item of D.decision_queue || []) {
    if (item.status !== 'approved') continue;
    if (item.type !== 'seo-tweak' && item.type !== 'faq-add') continue;
    const slug = item.draft_slug || (item.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const refuse = why => { note(`refuse:${item.id}:${why}`, `refused ${item.type} on "${slug}": ${why}`); refused++; };
    const root = contentRoots().find(r => { const p = safeDraftPath(r, slug); return p && existsSync(join(r, 'content', 'published', slug + '.md')); });
    if (!root) { refuse('no published page at that slug'); continue; }
    const desc = typeof item.description === 'string' ? item.description.trim() : '';
    if (!desc) { refuse('no description supplied - level 2 edits metadata only'); continue; }
    if (desc.length > MAX_SEO_EDIT_FIELD) { refuse(`description ${desc.length} chars exceeds the ${MAX_SEO_EDIT_FIELD} limit`); continue; }
    const key = `seo:${root}:${slug}:${desc.length}`;
    if (seen.has(key)) { item.autonomy_done = true; continue; }
    const file = join(root, 'content', 'published', slug + '.md');
    const raw = readFileSync(file, 'utf8');
    if (!/^description:/m.test(raw.split('\n---\n')[0] || '')) {
      refuse('no description field in frontmatter to edit');
      continue;
    }
    if (!DRY) {
      const updated = raw.replace(/^(description:\s*)(.*)$/m, `$1"${desc.replace(/"/g, '\\"')}"`);
      writeFileSync(file, updated);
    }
    note(key, `${DRY ? '[dry] would update' : 'updated'} description on "${slug}" (${desc.length} chars)`);
    item.autonomy_done = true;
    edits++;
  }
}

if (!DRY) writeFileSync('data/data.json', JSON.stringify(D, null, 2) + '\n');
console.log(
  `Autonomy gate (level ${CFG.level}${DRY ? ', dry run' : ''}): approved ${approved}, promoted ${promoted}, ` +
  `level-2 edits ${edits}, refused ${refused}, held-for-human ${held}. ` +
  `NEVER-class items never execute: ${NEVER.join(', ')}.`
);