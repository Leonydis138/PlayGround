#!/usr/bin/env node
/**
 * VANTAGE end-to-end selftest - dependency-free (Node 18+).
 * verify.mjs checks files; this proves the pipeline actually RUNS:
 * it copies the repo to a temp dir (worktree untouched), runs every
 * build/score script in order, fails on the first non-zero exit, asserts the
 * outputs exist, and exercises both success AND failure paths (a deliberately
 * bad draft must be refused by the autonomy gate, and a repeated run must be
 * a no-op). It can never touch or deploy production state.
 *
 *   node scripts/selftest.mjs
 * Run before any deploy push and in CI if you ever want a second gate.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STEPS = [
  'scripts/verify.mjs',
  'scripts/lint-content.mjs',
  'scripts/link-check.mjs',
  'scripts/tests.mjs',
  'scripts/ledger-summary.mjs',
  'scripts/cluster-score.mjs',
  'scripts/allocator.mjs',
  'scripts/autonomy.mjs',
  'scripts/build-site.mjs branch-a',
  'scripts/build-sitemaps.mjs',
  'scripts/build-dashboard.mjs',
  'scripts/backup.mjs'
];

const EXPECTED = [
  'sites/branch-a/dist/index.html',
  'sites/branch-a/dist/sitemap.xml',
  'sites/branch-a/dist/feed.xml',
  'sites/branch-a/dist/assets/style.css',
  'sites/branch-a/dist/404.html',
  'tools/branch-c/sitemap.xml',
  'tools/branch-c/robots.txt',
  'dashboard/dist/index.html',
  'dashboard/dist/data.json',
  'backup/backup-' + new Date().toISOString().slice(0, 10) + '.json'
];

const TMP = join(tmpdir(), `vantage-selftest-${process.pid}`);
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// Copy the repo minus git/dist/backup/node_modules noise.
cpSync('.', TMP, { recursive: true, filter: (src) => !/[\\/](\.git|dist|backup|node_modules|state)([\\/]|$)/.test(src) });

let failed = 0;
const run = (cmd, args = []) => spawnSync('node', [cmd, ...args], { cwd: TMP, encoding: 'utf8' });

for (const step of STEPS) {
  const [cmd, ...args] = step.split(' ');
  const r = run(cmd, args);
  const ok = r.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}${ok ? '' : `\n${r.stdout || ''}\n${r.stderr || ''}`}`);
  if (!ok) failed = 1;
}

for (const f of EXPECTED) {
  const ok = existsSync(join(TMP, f));
  console.log(`${ok ? 'PASS' : 'FAIL'}  output ${f}`);
  if (!ok) failed = 1;
}

// --- failure path: the gate must refuse a thin, scaffolded draft ----------
if (!failed) {
  const drafts = join(TMP, 'sites/branch-a/content/drafts');
  mkdirSync(drafts, { recursive: true });
  writeFileSync(join(drafts, 'gate-test.md'), `---
title: "Gate test"
description: "A deliberately thin draft that must never publish."
date: "2026-10-10"
---

# Gate test

TODO: write the article.

`);
  const data = JSON.parse(readFileSync(join(TMP, 'data/data.json'), 'utf8'));
  data.decision_queue.push({
    id: 'dq-selftest', type: 'content-publish', from_agent: 'Selftest',
    title: 'Gate test', draft_slug: 'gate-test',
    detail: 'selftest fixture', status: 'pending', created_at: new Date().toISOString()
  });
  writeFileSync(join(TMP, 'data/data.json'), JSON.stringify(data, null, 2) + '\n');

  const r1 = run('scripts/autonomy.mjs');
  const published = existsSync(join(TMP, 'sites/branch-a/content/published/gate-test.md'));
  const refused = /refused promotion/.test((r1.stdout || '') + (r1.stderr || ''));
  const okRefuse = r1.status === 0 && !published && refused;
  console.log(`${okRefuse ? 'PASS' : 'FAIL'}  autonomy gate refuses a 30-word scaffolded draft${okRefuse ? '' : ` (status=${r1.status} published=${published} refused=${refused})`}`);
  if (!okRefuse) failed = 1;

  // --- idempotency: a second identical run changes nothing ---------------
  const before = readFileSync(join(TMP, 'data/data.json'), 'utf8');
  const r2 = run('scripts/autonomy.mjs');
  const after = readFileSync(join(TMP, 'data/data.json'), 'utf8');
  const okIdem = r2.status === 0 && before === after;
  console.log(`${okIdem ? 'PASS' : 'FAIL'}  a second autonomy run is a byte-for-byte no-op${okIdem ? '' : ' (state changed on replay)'}`);
  if (!okIdem) failed = 1;
}

// --- recovery: backup restores into an isolated directory ----------------
if (!failed) {
  const r = run('scripts/backup.mjs', ['--restore', `backup/backup-${new Date().toISOString().slice(0, 10)}.json`, '--into', '/tmp/vantage-selftest-restore']);
  const restored = r.status === 0 && existsSync('/tmp/vantage-selftest-restore/data/data.json');
  console.log(`${restored ? 'PASS' : 'FAIL'}  backup restores into an isolated directory${restored ? '' : ` (status=${r.status} ${r.stdout || ''}${r.stderr || ''})`}`);
  if (restored) rmSync('/tmp/vantage-selftest-restore', { recursive: true, force: true });
  if (!restored) failed = 1;
}

rmSync(TMP, { recursive: true, force: true });
console.log(failed ? 'SELFTEST: FAILED' : `SELFTEST: all ${STEPS.length} steps + ${EXPECTED.length} outputs + failure/idempotency/recovery paths OK`);
process.exit(failed);