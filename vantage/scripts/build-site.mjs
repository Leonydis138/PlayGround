#!/usr/bin/env node
/**
 * VANTAGE static site builder - dependency-free (Node 18+, no npm install).
 * Reads sites/<branch>/content/published/*.md, renders to sites/<branch>/dist/
 * with the article template, JSON-LD schema, and internal links.
 * Usage: node scripts/build-site.mjs <branch>   (e.g. branch-a, or a
 *        sites/branch-b/graduated/<name> path)
 *
 * Slug rules: if a published file's frontmatter has `slug:`, that is the
 * URL slug; otherwise the filename (minus .md) is used. build-sitemaps.mjs
 * applies the same rule so the sitemap and the built site never disagree.
 *
 * Output is deterministic apart from the copyright year, so a rebuild from
 * the same commit produces the same artifact.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2] || 'branch-a';
const SITE = target.includes('/') ? target : join('sites', target);
const SRC = join(SITE, 'content', 'published');
const DIST = join(SITE, 'dist');

if (!existsSync(SRC)) { console.error(`No published content at ${SRC}`); process.exit(1); }
if (!existsSync(join(SITE, 'site.json'))) { console.error(`Missing ${SITE}/site.json`); process.exit(1); }
const siteCfg = JSON.parse(readFileSync(join(SITE, 'site.json'), 'utf8'));
const SITE_NAME = siteCfg.name || target;
const DOMAIN = (siteCfg.domain || 'vantage-ars.co.za').replace(/^https?:\/\//, '').replace(/\/$/, '');

// Escape for an HTML attribute *and* HTML text context. Order matters:
// ampersand first, then the rest, then quotes.
const escAttr = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function parsePost(file) {
  const raw = readFileSync(join(SRC, file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = Object.fromEntries(m[1].split('\n').filter(l => l.includes(':'))
    .map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  const slug = (meta.slug || file.replace(/\.md$/, '')).trim().replace(/[^a-z0-9-]/gi, '');
  if (!slug) throw new Error(`${file}: empty slug after sanitising`);
  return { meta, body: m[2], slug };
}

function inline(md) {
  return String(md)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, text, href) =>
      `<a href="${escAttr(href)}">${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderBody(md) {
  const lines = md.split('\n'); let html = '', inList = false, inCode = false, inTable = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false; }
      else { html += '<pre><code>'; inCode = true; }
      continue;
    }
    if (inCode) { html += escAttr(line) + '\n'; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`; continue;
    } else if (inList) { html += '</ul>'; inList = false; }
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length && cells.every(c => /^-+$/.test(c))) continue;
      if (!inTable) { html += '<table>'; inTable = true; }
      html += `<tr>${cells.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`;
      continue;
    } else if (inTable) { html += '</table>'; inTable = false; }
    if (line.trim() === '') continue;
    html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += '</ul>'; if (inTable) html += '</table>'; if (inCode) html += '</code></pre>';
  return html;
}

const posts = readdirSync(SRC).filter(f => f.endsWith('.md')).map(parsePost)
  .sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));

// Two published files resolving to one slug would silently drop a page.
const bySlug = new Map();
for (const p of posts) {
  if (bySlug.has(p.slug)) throw new Error(`slug collision: ${bySlug.get(p.slug).file} and ${p.file} both resolve to /${p.slug}/`);
  bySlug.set(p.slug, p);
}

const LAYOUT = (title, content, desc, jsonld, path) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escAttr(title)}</title><meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="https://${escAttr(DOMAIN)}/${escAttr(path)}">
<link rel="alternate" type="application/rss+xml" title="${escAttr(SITE_NAME)}" href="https://${escAttr(DOMAIN)}/feed.xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="${escAttr(SITE_NAME)}">
<meta property="og:title" content="${escAttr(title)}"><meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="https://${escAttr(DOMAIN)}/${escAttr(path)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escAttr(title)}">
<meta name="twitter:description" content="${escAttr(desc)}">
${jsonld || ''}
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="stylesheet" href="/assets/style.css">
</head><body><header><a class="home" href="/">&lt;- ${escAttr(SITE_NAME)}</a></header>
<main>${content}</main>
<footer><p>&copy; ${new Date().getFullYear()} ${escAttr(SITE_NAME)}. Some links may be affiliate links. <a href="/contact/">Contact</a></p></footer>
</body></html>`;

mkdirSync(join(DIST, 'assets'), { recursive: true });

const indexContent = `<h1>${escAttr(SITE_NAME)}</h1><p class="tagline">${escAttr(siteCfg.tagline || '')}</p><ul class="index">` +
  posts.map(p => `<li><a href="/${escAttr(p.slug)}/">${escAttr(p.meta.title || p.slug)}</a> <time>${escAttr(p.meta.date || '')}</time></li>`).join('') +
  '</ul>';
writeFileSync(join(DIST, 'index.html'), LAYOUT(SITE_NAME, indexContent, siteCfg.tagline || SITE_NAME, '', ''));

for (const p of posts) {
  const jsonld = `<script type="application/ld+json">${JSON.stringify([{
    '@context': 'https://schema.org', '@type': 'Article',
    headline: p.meta.title, description: p.meta.description,
    datePublished: p.meta.date,
    author: { '@type': 'Person', name: p.meta.author || 'Juan-Louw Greyling' },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: `https://${DOMAIN}/` },
    mainEntityOfPage: `https://${DOMAIN}/${p.slug}/`
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `https://${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: p.meta.title, item: `https://${DOMAIN}/${p.slug}/` }
    ]
  }])}</script>`;
  mkdirSync(join(DIST, p.slug), { recursive: true });
  writeFileSync(join(DIST, p.slug, 'index.html'),
    LAYOUT(p.meta.title, `<article><h1>${inline(p.meta.title || p.slug)}</h1>${renderBody(p.body)}</article>`,
      p.meta.description, jsonld, `${p.slug}/`));
}
writeFileSync(join(DIST, 'assets', 'style.css'), readFileSync(join('scripts', 'assets', 'article.css'), 'utf8'));
writeFileSync(join(DIST, 'assets', 'favicon.svg'), readFileSync(join('scripts', 'assets', 'favicon.svg'), 'utf8'));

// Security headers for the Pages project serving this dist
writeFileSync(join(DIST, '_headers'), [
  '/*',
  '  X-Frame-Options: DENY',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '', ''
].join('\n'));

// 404 page - otherwise a bad URL serves the host's generic error
writeFileSync(join(DIST, '404.html'), LAYOUT('404 - not found',
  `<article><h1>404 - not found</h1><p>That URL doesn't exist. Try the <a href="/">index</a> - everything published is listed there.</p></article>`,
  'Page not found', '', '404.html'));
console.log(`Built ${posts.length} posts for ${SITE} -> ${DIST}`);