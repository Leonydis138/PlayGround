#!/usr/bin/env node
/**
 * VANTAGE sitemap + robots + RSS generator - dependency-free (Node 18+).
 * For each site with a site.json: writes sitemap.xml + robots.txt + feed.xml
 * into <site>/dist/ (creating dist if needed), listing every published
 * article. URLs are emitted with trailing-slash form to match what
 * build-site.mjs actually serves.
 * Usage: node scripts/build-sitemaps.mjs [branch ...]   (default: all sites)
 *
 * Site discovery (default): sites/branch-a, plus every live test cluster
 * under sites/branch-b/ (TEMPLATE and archived are skipped; graduated is
 * walked separately). Test clusters live directly under sites/branch-b/
 * per sites/branch-b/CLUSTERS.md - there is no "active/" subfolder.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const B_SKIP = new Set(['TEMPLATE', 'graduated', 'archived']);

function sitePaths() {
  const args = process.argv.slice(2);
  if (args.length) return args.map(a => a.includes('/') ? a : join('sites', a));
  const paths = ['sites/branch-a'];
  const bRoot = 'sites/branch-b';
  if (existsSync(bRoot)) {
    for (const c of readdirSync(bRoot, { withFileTypes: true })) {
      if (!c.isDirectory() || B_SKIP.has(c.name)) continue;
      paths.push(join(bRoot, c.name));
    }
    const grad = join(bRoot, 'graduated');
    if (existsSync(grad)) {
      for (const c of readdirSync(grad, { withFileTypes: true })) {
        if (c.isDirectory()) paths.push(join(grad, c.name));
      }
    }
  }
  return paths;
}

const today = new Date().toISOString().slice(0, 10);
let generated = 0;
const problems = [];

const xmlEsc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

for (const SITE of sitePaths()) {
  const cfgPath = join(SITE, 'site.json');
  if (!existsSync(cfgPath)) { console.error(`skip ${SITE}: no site.json`); continue; }
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const DOMAIN = (cfg.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!DOMAIN) { console.error(`skip ${SITE}: no domain set`); problems.push(`${SITE}: no domain`); continue; }

  const SRC = join(SITE, 'content', 'published');
  const DIST = join(SITE, 'dist');
  mkdirSync(DIST, { recursive: true });

  const posts = [];
  if (existsSync(SRC)) {
    for (const f of readdirSync(SRC).filter(f => f.endsWith('.md'))) {
      const raw = readFileSync(join(SRC, f), 'utf8');
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      const meta = fm ? Object.fromEntries(fm[1].split('\n').filter(l => l.includes(':'))
        .map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })) : {};
      // Honour a frontmatter `slug:` when present, else fall back to filename -
      // must match what scripts/build-site.mjs publishes.
      const slug = (meta.slug || f.replace(/\.md$/, '')).trim().replace(/[^a-z0-9-]/gi, '');
      if (!slug) { problems.push(`${SITE}/${f}: empty slug`); continue; }
      posts.push({ slug, title: meta.title || f, date: meta.date || '', description: meta.description || '' });
    }
  }
  const seen = new Set();
  for (const p of posts) {
    if (seen.has(p.slug)) problems.push(`${SITE}: duplicate slug /${p.slug}/ in the sitemap`);
    seen.add(p.slug);
  }

  const urls = [`https://${DOMAIN}/`, ...posts.map(p => `https://${DOMAIN}/${p.slug}/`)];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url><loc>${xmlEsc(u)}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>', ''
  ].join('\n');
  writeFileSync(join(DIST, 'sitemap.xml'), xml);

  writeFileSync(join(DIST, 'robots.txt'), [
    'User-agent: *',
    'Allow: /',
    `Sitemap: https://${DOMAIN}/sitemap.xml`, ''
  ].join('\n'));

  // RSS feed - latest 20 articles by date, so returning readers can subscribe
  const items = posts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    `  <title>${xmlEsc(cfg.name || SITE)}</title>`,
    `  <link>https://${DOMAIN}/</link>`,
    `  <description>${xmlEsc(cfg.tagline || '')}</description>`,
    ...items.flatMap(it => [
      '  <item>',
      `    <title>${xmlEsc(it.title)}</title>`,
      `    <link>https://${DOMAIN}/${it.slug}/</link>`,
      `    <guid isPermaLink="true">https://${DOMAIN}/${it.slug}/</guid>`,
      `    <pubDate>${xmlEsc(it.date)}</pubDate>`,
      `    <description>${xmlEsc(it.description)}</description>`,
      '  </item>'
    ]),
    '</channel></rss>', ''
  ].join('\n');
  writeFileSync(join(DIST, 'feed.xml'), feed);

  console.log(`${SITE}: sitemap.xml (${urls.length} urls) + robots.txt + feed.xml (${items.length} items) -> dist/`);
  generated++;
}

// Branch C tools site: static directory (no site.json, not markdown-driven),
// so the page list is derived from what is actually on disk. Kept honest by
// being generated rather than hand-maintained.
const TOOLS_DOMAIN = 'tools.vantage-ars.co.za';
if (!existsSync('tools/branch-c')) {
  console.error('tools/branch-c not found - skipping the tools sitemap');
} else {
  const pages = ['/'];
  for (const e of readdirSync('tools/branch-c', { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'worker') {
      if (existsSync(join('tools/branch-c', e.name, 'index.html'))) pages.push(`/${e.name}/`);
    }
  }
  // The VoIP bandwidth calculator nests one level deeper.
  for (const e of readdirSync('tools/branch-c', { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'worker' || e.name.startsWith('.')) continue;
    for (const n of readdirSync(join('tools/branch-c', e.name), { withFileTypes: true })) {
      if (n.isDirectory() && existsSync(join('tools/branch-c', e.name, n.name, 'index.html'))) {
        pages.push(`/${e.name}/${n.name}/`);
      }
    }
  }
  const toolsXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(p => `  <url><loc>${xmlEsc(`https://${TOOLS_DOMAIN}${p}`)}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>', ''
  ].join('\n');
  writeFileSync('tools/branch-c/sitemap.xml', toolsXml);
  writeFileSync('tools/branch-c/robots.txt', [
    'User-agent: *',
    'Allow: /',
    'Disallow: /worker/',
    `Sitemap: https://${TOOLS_DOMAIN}/sitemap.xml`, ''
  ].join('\n'));
  console.log(`tools/branch-c: sitemap.xml (${pages.length} urls) + robots.txt -> tools/branch-c/`);
}

if (!generated) console.log('no sites with a domain - nothing to do');
if (problems.length) {
  for (const p of problems) console.error(`PROBLEM: ${p}`);
  process.exit(1);
}