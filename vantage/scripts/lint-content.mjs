#!/usr/bin/env node
/**
 * VANTAGE content quality gate - dependency-free (Node 18+).
 * verify.mjs catches structural drift; this catches quality drift that
 * search engines punish and readers bounce on:
 *   1. published articles: minimum 800 words (drafts: warning at 400)
 *   2. no leftover authoring scaffolding (TODO, FIXME, XXX, lorem, [TBD])
 *   3. exactly one h1; headings do not skip levels (h2 -> h4)
 *   4. outbound http(s) links require an affiliate disclosure on the page
 *      or a site-level affiliate-disclosure page
 *   5. published article with zero internal links (warning - orphan)
 *   6. frontmatter must carry title AND description (a page with no
 *      description cannot rank or be quoted by an answer engine)
 *   7. no duplicate titles across published pages on one site
 * Exits 1 on any ERROR (warnings do not fail).
 * Usage: node scripts/lint-content.mjs
 * Wired into the weekly Actions job after link-check.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const errors = [];
const warnings = [];

const SITES = ['sites/branch-a', ...(existsSync('sites/branch-b') ? readdirSync('sites/branch-b', { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'TEMPLATE')
  .map(e => join('sites/branch-b', e.name)) : [])];

const UTILITY = ['about.md', 'contact.md', 'privacy.md', 'affiliate-disclosure.md']; // short by design
const seenTitles = new Map();

for (const site of SITES) {
  if (!existsSync(join(site, 'site.json'))) continue;
  for (const kind of ['published', 'drafts']) {
    const dir = join(site, 'content', kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const path = join(dir, f);
      const raw = readFileSync(path, 'utf8');
      const body = raw.replace(/^---[\s\S]*?---/, '');
      const label = `${path}`;
      const isUtility = UTILITY.includes(f);
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      const fmText = fm ? fm[1] : '';

      // 0. frontmatter completeness
      if (!fm) { errors.push(`${label}: missing frontmatter`); }
      else {
        if (!/^title:/m.test(fmText)) errors.push(`${label}: frontmatter missing title`);
        else if (kind === 'published') {
          const t = (fmText.match(/^title:\s*(.+)$/m) || [])[1] || '';
          const key = site + '::' + t.trim().toLowerCase();
          if (seenTitles.has(key)) errors.push(`${label}: duplicate title, already used by ${seenTitles.get(key)}`);
          else seenTitles.set(key, path);
        }
        if (kind === 'published' && !/^description:/m.test(fmText)) errors.push(`${label}: frontmatter missing description`);
      }

      // 1. length (utility pages are short by design)
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      if (!isUtility && kind === 'published' && words < 800) errors.push(`${label}: only ${words} words (min 800 for published articles)`);
      if (kind === 'drafts' && words < 400) warnings.push(`${label}: only ${words} words (draft, min 400 before publishing)`);

      // 2. scaffolding
      const scaffold = body.match(/\b(TODO|FIXME|XXX|TBD)\b|lorem ipsum/i);
      if (scaffold) errors.push(`${label}: leftover authoring scaffold "${scaffold[0]}"`);

      // 3. heading structure
      const headings = (body.match(/^#{1,6} .*/gm) || []);
      const h1s = headings.filter(h => /^# /.test(h));
      if (kind === 'published' && h1s.length !== 1) errors.push(`${label}: ${h1s.length} h1 headings (need exactly 1)`);
      let level = 2, skipped = null;
      for (const h of headings) {
        const l = h.match(/^#+/)[0].length;
        if (l > level + 1 && !skipped) skipped = l;
        level = l;
      }
      if (skipped) warnings.push(`${label}: heading level skipped (jumped to h${skipped})`);

      // 4. outbound links need disclosure
      const outbound = body.match(/\]\(https?:\/\/[^)]+\)/g) || [];
      const hasDisclosure = /affiliate/i.test(body) || existsSync(join(site, 'content', 'published', 'affiliate-disclosure.md'));
      if (outbound.length && !hasDisclosure) errors.push(`${label}: ${outbound.length} outbound links but no affiliate disclosure`);

      // 5. orphans (published articles only; utility pages exempt)
      if (kind === 'published' && !isUtility) {
        const internal = body.match(/\]\((\/|\.\/)[^)]*\)/g) || [];
        if (internal.length === 0) warnings.push(`${label}: no internal links (orphan - hurts crawl depth)`);
      }
    }
  }
}

for (const e of errors) console.error(`ERROR: ${e}`);
for (const w of warnings) console.warn(`WARN: ${w}`);
console.log(`lint-content: ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length) process.exit(1);