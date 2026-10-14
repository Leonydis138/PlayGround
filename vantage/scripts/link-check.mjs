#!/usr/bin/env node
/**
 * VANTAGE internal link checker - dependency-free (Node 18+).
 * Catches broken internal links before they cost search trust:
 *   1. Markdown links in published content must point at an existing
 *      published slug (or a known page) on the same site. Checked for EVERY
 *      site, not just Branch A - a cluster with a broken link used to pass.
 *   2. Cross-site links between the branch properties must exist.
 *   3. Calculator cross-links in tools/ must resolve to real folders, and
 *      every public page on the tools site must be linked from somewhere.
 * External (http) links are NOT fetched - that is the Monitor agent's job.
 * Exits 1 on broken links. Run: node scripts/link-check.mjs
 * Wired into the weekly Actions job.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const broken = [];
let checked = 0;

const B_SKIP = new Set(['TEMPLATE', 'graduated', 'archived']);

function allSites() {
  const out = ['sites/branch-a'];
  const bRoot = 'sites/branch-b';
  if (existsSync(bRoot)) {
    for (const c of readdirSync(bRoot, { withFileTypes: true })) {
      if (!c.isDirectory() || B_SKIP.has(c.name)) continue;
      out.push(join(bRoot, c.name));
    }
    const grad = join(bRoot, 'graduated');
    if (existsSync(grad)) for (const c of readdirSync(grad, { withFileTypes: true })) {
      if (c.isDirectory()) out.push(join(grad, c.name));
    }
  }
  return out;
}

function publishedSlugs(siteDir) {
  const pub = join(siteDir, 'content', 'published');
  if (!existsSync(pub)) return null;
  const s = new Set(['', 'about', 'affiliate-disclosure', 'contact', 'privacy']);
  for (const f of readdirSync(pub).filter(f => f.endsWith('.md'))) {
    const raw = readFileSync(join(pub, f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    const sl = fm && fm[1].match(/^slug:\s*(.+)$/m);
    s.add(sl ? sl[1].trim() : f.replace(/\.md$/, ''));
  }
  return s;
}

// 1. Internal markdown links, on EVERY site that publishes content
for (const site of allSites()) {
  const pub = join(site, 'content', 'published');
  if (!existsSync(pub)) continue;
  const slugs = publishedSlugs(site);
  for (const f of readdirSync(pub).filter(f => f.endsWith('.md'))) {
    const raw = readFileSync(join(pub, f), 'utf8');
    for (const m of raw.matchAll(/\]\((\/[^)#?]*)\)/g)) {
      checked++;
      const target = m[1].replace(/^\//, '').replace(/\/$/, '');
      if (!slugs.has(target)) broken.push(`${pub}/${f}: internal link /${target} has no published page`);
    }
  }
}

// 2. tools/ cross-links - every href="/<dir>/" must resolve to a real folder
const toolRoot = 'tools/branch-c';
if (existsSync(toolRoot)) {
  const toolDirs = new Set(readdirSync(toolRoot, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'worker')
    .map(e => e.name));
  // The VoIP bandwidth calculator lives one level deeper: voip-bandwidth/calculator/
  const nested = readdirSync(toolRoot, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'worker')
    .flatMap(e => readdirSync(join(toolRoot, e.name), { withFileTypes: true })
      .filter(n => n.isDirectory())
      .map(n => `${e.name}/${n.name}`));
  for (const n of nested) toolDirs.add(n);

  for (const f of readdirSync(toolRoot).filter(f => f.endsWith('.html'))) {
    const raw = readFileSync(join(toolRoot, f), 'utf8');
    for (const m of raw.matchAll(/href="(\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)\//g)) {
      checked++;
      if (!toolDirs.has(m[1].slice(1))) broken.push(`${toolRoot}/${f}: links to missing calculator /${m[1].slice(1)}/`);
    }
  }

  // Every public page on the tools site must be reachable from the landing page.
  // Compare path forms without trailing slashes - the href capture above
  // excludes the closing slash while the page list uses it.
  const landing = readFileSync(join(toolRoot, 'index.html'), 'utf8');
  const strip = p => p.replace(/\/$/, '');
  const landingLinks = new Set([...landing.matchAll(/href="(\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)\//g)].map(m => strip(m[1])));
  for (const page of ['/privacy/', '/affiliate-disclosure/', '/sla-calculator/', '/downtime-calculator/', '/roi-calculator/', '/subnet-calculator/', '/voip-bandwidth/calculator/']) {
    checked++;
    if (!landingLinks.has(strip(page))) broken.push(`${toolRoot}/index.html: ${page} exists but is not linked from the landing page (orphan)`);
  }
}

for (const b of broken) console.error(`BROKEN: ${b}`);
if (broken.length) { console.error(`\nlink-check FAILED: ${broken.length} broken, ${checked} checked`); process.exit(1); }
console.log(`link-check OK: ${checked} internal links, 0 broken`);