#!/usr/bin/env node
/**
 * VANTAGE article scaffolder - dependency-free (Node 18+).
 * Removes the blank-page cost of starting a draft and keeps frontmatter
 * lint-clean (title + date present, 800-word target stated up front).
 *   node scripts/new-article.mjs "SIP Trunk vs Hosted PBX Cost Math" --topic voip-cost
 *   node scripts/new-article.mjs "..." --branch branch-b/<cluster> --topic <slug>
 * Writes sites/<branch>/content/drafts/<slug>.md - never published/. The
 * Writer agent (or you) fills it in; publish is a separate human decision.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith('--')) {
  console.error('Usage: node scripts/new-article.mjs "Working title" [--branch branch-a] [--topic slug] [--author name]');
  process.exit(1);
}
const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null; };

const branch = opt('branch') || 'branch-a';
const topic = opt('topic') || 'general';
const author = opt('author') || 'Juan-Louw Greyling';
const rawTitle = args[0];

const slug = rawTitle.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '').trim()
  .replace(/\s+/g, '-').replace(/-+/g, '-')
  .split('-').slice(0, 8).join('-');
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`Title produced an unusable slug "${slug}" - use letters, numbers and spaces.`);
  process.exit(1);
}

const site = join('sites', branch);
// Confinement check: --branch must stay inside sites/.
const base = resolve(process.cwd(), 'sites');
const full = resolve(site);
if (full !== base && !full.startsWith(base + sep)) {
  console.error(`--branch ${branch} escapes the sites/ directory - refused.`);
  process.exit(1);
}
if (!existsSync(join(site, 'site.json'))) { console.error(`No site at ${site} (bad --branch?)`); process.exit(1); }
const drafts = join(site, 'content', 'drafts');
mkdirSync(drafts, { recursive: true });
const out = join(drafts, `${slug}.md`);
if (existsSync(out)) { console.error(`Draft exists: ${out}`); process.exit(1); }

const desc = rawTitle.length > 155 ? rawTitle.slice(0, 152) + '...' : rawTitle;
writeFileSync(out, `---
title: "${rawTitle.replace(/"/g, '\\"')}"
description: "${desc.replace(/"/g, '\\"')} - one concrete promise, not a summary"
date: "${new Date().toISOString().slice(0, 10)}"
author: "${author.replace(/"/g, '\\"')}"
topic: "${topic.replace(/"/g, '\\"')}"
---

# ${rawTitle}

> Target: 800+ words before publishing (lint-content.mjs will fail it under that).
> Delete this block when done.

## The problem (who hurts, how much)

## What you actually need (practitioner reality, not vendor copy)

- Pull from this site's notes/ folder if practitioner notes exist for "${topic}" - if not, add 3-5 bullets there first.

## The cost math (numbers, ZAR, assumptions stated)

## What vendors won't tell you

## Checklist before promoting drafts -> published

- [ ] 800+ words of substance, not padding, no TODO/scaffold left
- [ ] At least one internal link
- [ ] Outbound links have affiliate disclosure on page or site-level
- [ ] Description rewritten (not the placeholder above)
- [ ] \`node scripts/lint-content.mjs\` passes
- [ ] \`node scripts/link-check.mjs\` passes
`);

console.log(`Draft scaffolded: ${out}`);
console.log('Next: fill in from practitioner notes, then promote to content/published/ when ready.');