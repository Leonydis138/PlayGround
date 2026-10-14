#!/usr/bin/env node
/**
 * Analytics pull - runs in the weekly Actions job BEFORE the allocator.
 * Two sources, both free:
 *
 *   1. Google Search Console (searchanalytics.query) - clicks, impressions,
 *      CTR per site. Needs a GSC service account (human step: console.cloud
 *      .google.com -> enable "Google Search Console API" -> service account
 *      -> JSON key -> add as the GH secret GSC_JSON_KEY, and share the GSC
 *      property with the service account email).
 *   2. Cloudflare Web Analytics (GraphQL API) - page views. Needs API token
 *      + account/site IDs (GH secrets CF_API_TOKEN, CF_ACCOUNT_ID, CF_SITE_TAG).
 *
 * Until secrets exist, this runs in DRY mode: it leaves metrics untouched and
 * writes an honest "no analytics wired yet" line to the activity feed. That is
 * the correct outcome - not a zero. A missing import is never converted to
 * a measured 0, because the Allocator reads a 0 as "performed badly".
 *
 * Every successful pull stamps `metrics_as_of`, which is what makes staleness
 * detectable. A pull that fails leaves the previous values AND their previous
 * timestamp in place, so the data visibly ages instead of silently resetting.
 *
 * Usage: node scripts/pull-analytics.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DATA = 'data/data.json';
const HAVE_GSC = !!process.env.GSC_JSON_KEY;
const HAVE_CF = !!process.env.CF_API_TOKEN && !!process.env.CF_ACCOUNT_ID && !!process.env.CF_SITE_TAG;
const SITE_KEYS = { 'branch-a': process.env.GSC_SITE_BRANCH_A };

async function gsc30d(siteUrl) {
  const key = JSON.parse(process.env.GSC_JSON_KEY);
  const now = Math.floor(Date.now() / 1000);
  const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const pem = key.private_key.replace(/\\n/g, '\n');
  const pk = await crypto.subtle.importKey('pkcs8', pemToDer(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pk, new TextEncoder().encode(`${header}.${claim}`));
  const jwt = `${header}.${claim}.${b64urlRaw(sig)}`;
  const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })).json();
  if (!tok.access_token) throw new Error('GSC token exchange failed: ' + JSON.stringify(tok.error_description || tok.error || 'unknown'));

  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const r = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/' +
    encodeURIComponent(siteUrl) + '/searchAnalytics/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: [] })
  });
  if (!r.ok) throw new Error(`GSC query failed: HTTP ${r.status}`);
  const j = await r.json();
  return { clicks: j.rows?.[0]?.clicks ?? null, impressions: j.rows?.[0]?.impressions ?? null };
}

async function cf30d() {
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const end = new Date().toISOString().slice(0, 10);
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query { viewer { zones(filter: {zoneTag: "${process.env.CF_SITE_TAG}"}) { httpRequests1dGroups(limit: 100, filter: {date_geq: "${start}", date_lt: "${end}"}) { sum { requests pageViews } } } } }` })
  });
  if (!r.ok) throw new Error(`Cloudflare query failed: HTTP ${r.status}`);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error('Cloudflare error: ' + j.errors[0].message);
  const groups = j.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
  if (!groups.length) return null;   // no data in the window is not zero
  return groups.reduce((a, g) => a + (g.sum.pageViews || 0), 0);
}

function pemToDer(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return new Uint8Array(Buffer.from(body, 'base64'));
}
function b64urlRaw(buf) {
  return Buffer.from(new Uint8Array(buf)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const nowIso = new Date().toISOString();
const feed = what => (data.activity_feed = data.activity_feed || []).push({ agent: 'System', when: nowIso, what });

if (!HAVE_GSC && !HAVE_CF) {
  feed('Analytics pull skipped - GSC/Cloudflare secrets not wired yet. Metrics left UNKNOWN (not zero) so the Allocator will not read absence as failure.');
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log('DRY mode: no analytics secrets found. Metrics remain unknown. See the header of this file for the one-time human setup.');
  process.exit(0);
}

// Wired mode. A failure for one branch leaves that branch untouched and
// reports it; it never writes a 0 over a real previous value.
const SNAP = 'data/analytics-snapshot.json';
const prev = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, 'utf8')) : {};
const problems = [];
let pulled = 0;

for (const [id, b] of Object.entries(data.branches || {})) {
  const m = b.metrics;
  const old = prev[id] || {};
  try {
    if (HAVE_CF && process.env.CF_SITE_TAG) {
      const pv = await cf30d();
      if (pv === null) { problems.push(`${id}: Cloudflare returned no rows for the window (left unknown)`); }
      else {
        m.traffic_30d = pv;
        m.traffic_growth_30d_pct = old.traffic_30d ? Math.round(((pv - old.traffic_30d) / old.traffic_30d) * 100) : null;
        pulled++;
      }
    }
    if (HAVE_GSC && SITE_KEYS[id]) {
      const g = await gsc30d(SITE_KEYS[id]);
      m.clicks_30d = g.clicks;
      m.impressions_30d = g.impressions;
      m.conversion_rate_pct = (m.traffic_30d && g.clicks !== null)
        ? Math.round(g.clicks / m.traffic_30d * 1000) / 10
        : null;
      pulled++;
    }
    if (pulled > 0 && !problems.some(p => p.startsWith(id + ':'))) b.metrics_as_of = nowIso;
    b.metrics_wired = true;
  } catch (err) {
    problems.push(`${id}: ${err.message} (previous values and timestamp preserved)`);
  }
}

writeFileSync(SNAP, JSON.stringify(Object.fromEntries(Object.entries(data.branches || {})
  .map(([id, b]) => [id, { traffic_30d: b.metrics.traffic_30d, revenue_30d: b.metrics.revenue_30d }])), null, 2));

feed(`Analytics pull: ${pulled} measurement(s) written, snapshot saved.` +
  (problems.length ? ` Problems: ${problems.join('; ')}` : ''));
writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
for (const p of problems) console.log('PROBLEM: ' + p);
console.log(`Analytics pulled (${pulled} measurement(s)) and snapshot saved.`);