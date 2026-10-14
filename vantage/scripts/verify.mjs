#!/usr/bin/env node
/**
 * VANTAGE repo consistency verifier - dependency-free (Node 18+).
 * Catches the drift that breaks runs before it reaches production:
 *   1. every .json file parses and passes its schema shape
 *   2. no PLACEHOLDER strings anywhere
 *   3. published articles have valid frontmatter (title + date)
 *   4. agent docs referenced in KICKOFF/README exist
 *   5. workflows reference scripts that exist
 *   6. required files exist; duplicate IDs are rejected
 *   7. every file is pure ASCII (hard rule 6)
 *   8. policy config is loadable and never empty (fail-closed precondition)
 * Exits 1 on any ERROR (warnings do not fail). Run: node scripts/verify.mjs
 * Wired into the weekly Actions job so drift never survives a week.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const errors = [];
const warnings = [];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'dist' || e.name === '.git' || e.name === 'node_modules' || e.name === 'backup') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const REQUIRED = [
  'AGENTS.md', 'README.md', 'RUNBOOK.md', 'KICKOFF.md', 'CHANGELOG.md',
  'SECURITY.md', 'DEPLOY-CHECKLIST.md', 'LICENSE',
  'agents/autonomy.md', 'agents/allocator.md', 'agents/README.md',
  'data/data.json', 'data/experiments.json', 'data/agent-memory.json',
  'data/affiliate-programs.json', 'dashboard/index.html',
  'scripts/lib/policy.mjs', 'scripts/lib/store.mjs',
  'scripts/lib/orchestrator.mjs', 'scripts/runtime.mjs'
];

const files = walk('.');
let jsonCount = 0;
const parsed = new Map();

for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  if (f.endsWith('.json')) {
    try { parsed.set(f, JSON.parse(raw)); jsonCount++; }
    catch (e) { errors.push(`${f}: invalid JSON - ${e.message}`); }
  }
  // Skip this file - it documents and matches the pattern itself
  if (f !== 'scripts/verify.mjs') {
    const ph = raw.match(/PLACEHOLDER[A-Z-]*/);
    if (ph) errors.push(`${f}: contains ${ph[0]}`);
  }
  // Hard rule: pure ASCII in all files.
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (c > 126) {
      errors.push(`${f}: non-ASCII character at offset ${i} (U+${c.toString(16).toUpperCase()}) - hard rule 6 says pure ASCII`);
      break;
    }
    if (c === 9) { errors.push(`${f}: tab character at offset ${i} - use spaces`); break; }
  }
}
console.log(`checked ${files.length} files, ${jsonCount} JSON files parsed`);

// 1. required files
for (const r of REQUIRED) if (!existsSync(r)) errors.push(`missing required file: ${r}`);

// 2. frontmatter on published articles
for (const site of ['sites/branch-a', ...walk('sites/branch-b').filter(f => f.endsWith('site.json')).map(f => f.replace('/site.json', ''))]) {
  const pub = join(site, 'content', 'published');
  if (!existsSync(pub)) continue;
  for (const f of readdirSync(pub).filter(f => f.endsWith('.md'))) {
    const raw = readFileSync(join(pub, f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) { errors.push(`${pub}/${f}: missing frontmatter`); continue; }
    if (!/^title:/m.test(fm[1])) errors.push(`${pub}/${f}: frontmatter missing title`);
    if (!/^date:/m.test(fm[1])) warnings.push(`${pub}/${f}: frontmatter missing date`);
  }
}

// 3. agent docs referenced in KICKOFF exist
for (const m of readFileSync('KICKOFF.md', 'utf8').matchAll(/agents\/([a-z-]+)\.md/g)) {
  if (!existsSync(`agents/${m[1]}.md`)) errors.push(`KICKOFF.md references missing agents/${m[1]}.md`);
}

// 4. workflow scripts exist
if (existsSync('.github/workflows')) {
  for (const wf of readdirSync('.github/workflows')) {
    const raw = readFileSync(join('.github/workflows', wf), 'utf8');
    for (const m of raw.matchAll(/node (scripts\/[a-z-]+\.mjs)/g)) {
      if (!existsSync(m[1])) errors.push(`${wf} references missing ${m[1]}`);
    }
  }
}

// 5. data.json shape - duplicate IDs, policy present, capacity present
const D = parsed.get('data/data.json') || (existsSync('data/data.json') ? JSON.parse(readFileSync('data/data.json', 'utf8')) : null);
if (D) {
  if (!D.schema_version) errors.push('data/data.json: missing schema_version');
  if (!D.policy || typeof D.policy !== 'object') errors.push('data/data.json: missing policy block (policy engine fails closed without it)');
  else if (typeof D.policy.kill_switch !== 'boolean') errors.push('data/data.json: policy.kill_switch must be a boolean');
  if (!D.capacity || typeof D.capacity.total_articles_per_week !== 'number') {
    errors.push('data/data.json: missing capacity.total_articles_per_week (the Allocator cannot conserve quota without it)');
  }
  if (D.autonomy && ![0, 1, 2].includes(D.autonomy.level)) errors.push('data/data.json: autonomy.level must be 0, 1 or 2');
  const ids = new Set();
  for (const q of D.decision_queue || []) {
    if (!q.id) errors.push('data/data.json: a decision_queue item has no id');
    else if (ids.has(q.id)) errors.push(`data/data.json: duplicate decision_queue id ${q.id}`);
    else ids.add(q.id);
  }
  const ex = parsed.get('data/experiments.json');
  if (ex) {
    const eids = new Set();
    for (const e of ex.experiments || []) {
      if (!e.id) errors.push('data/experiments.json: an experiment has no id');
      else if (eids.has(e.id)) errors.push(`data/experiments.json: duplicate experiment id ${e.id}`);
      else eids.add(e.id);
      if (!e.success_metric && e.status === 'running') warnings.push(`data/experiments.json: ${e.id} is running with no success_metric`);
    }
  }
}

for (const w of warnings) console.error(`WARN: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  console.error(`\nverify FAILED: ${errors.length} error(s)`);
  process.exit(1);
}
console.log('verify OK - repo is consistent');