#!/usr/bin/env node
/**
 * VANTAGE backup bundle - dependency-free (Node 18+).
 * Everything that cannot be regenerated from the canvas lives in data/ and
 * state/. This bundles it into ONE dated JSON file so disaster recovery is a
 * single copy-paste: data.json (metrics, ledger, decision queue), experiments,
 * agent memory, affiliate notes, report, raw ledger entries, and the autonomy
 * task store + event log.
 *
 * The weekly Actions job uploads the bundle as an artifact (free tier).
 *
 *   node scripts/backup.mjs                              -> backup/backup-YYYY-MM-DD.json
 *   node scripts/backup.mjs --restore <bundle> [--into dir]
 *
 * Restore exists because a backup you have never restored is a guess. Restore
 * validates the bundle before writing anything and refuses a bundle whose
 * shape or schema version it does not recognise.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';

const FILES = [
  'data/data.json',
  'data/experiments.json',
  'data/agent-memory.json',
  'data/affiliate-programs.json',
  'data/ledger-summary.json',
  'data/report-latest.md',
  'state/tasks.json'
];

function collect() {
  const bundle = { generated_at: new Date().toISOString(), kind: 'vantage-backup', version: 2, data: {} };
  for (const f of FILES) {
    if (!existsSync(f)) continue;
    const raw = readFileSync(f, 'utf8');
    try { bundle.data[f] = JSON.parse(raw); }
    catch { bundle.data[f] = raw; }
  }
  if (existsSync('data/ledger')) {
    bundle.data['data/ledger/'] = {};
    for (const f of readdirSync('data/ledger')) {
      if (f === '.gitkeep') continue;
      const raw = readFileSync(`data/ledger/${f}`, 'utf8');
      try { bundle.data['data/ledger/'][f] = JSON.parse(raw); }
      catch { bundle.data['data/ledger/'][f] = raw; }
    }
  }
  // The event log is append-only history; it is the audit trail, so it ships.
  if (existsSync('state/events.jsonl')) bundle.data['state/events.jsonl'] = readFileSync('state/events.jsonl', 'utf8');
  return bundle;
}

const argv = process.argv.slice(2);
const ri = argv.indexOf('--restore');

if (ri >= 0) {
  const src = argv[ri + 1];
  const ii = argv.indexOf('--into');
  const dest = ii >= 0 ? argv[ii + 1] : null;
  if (!src || !existsSync(src)) { console.error(`--restore needs an existing bundle path (got "${src}")`); process.exit(1); }
  if (!dest) { console.error('--restore needs --into <dir> so a bad bundle cannot overwrite live state'); process.exit(1); }

  let bundle;
  try { bundle = JSON.parse(readFileSync(src, 'utf8')); } catch (e) {
    console.error(`bundle is not valid JSON: ${e.message} - nothing written`); process.exit(1);
  }
  if (!bundle || bundle.kind !== 'vantage-backup') { console.error('not a VANTAGE backup bundle - nothing written'); process.exit(1); }
  if (bundle.version !== 2) { console.error(`unsupported bundle version ${bundle.version} (expected 2) - nothing written`); process.exit(1); }
  if (!bundle.data || typeof bundle.data !== 'object' || !Object.keys(bundle.data).length) {
    console.error('bundle contains no data - nothing written'); process.exit(1);
  }

  mkdirSync(dest, { recursive: true });
  let written = 0;
  for (const [key, value] of Object.entries(bundle.data)) {
    const out = join(dest, key);
    mkdirSync(dirname(out), { recursive: true });
    if (key.endsWith('/')) {
      for (const [name, body] of Object.entries(value)) writeFileSync(join(out, name), JSON.stringify(body, null, 2) + '\n');
    } else if (typeof value === 'string') {
      writeFileSync(out, value);
    } else {
      writeFileSync(out, JSON.stringify(value, null, 2) + '\n');
    }
    written++;
  }
  console.log(`Restored ${written} source(s) from ${src} into ${dest}`);
  console.log('Verify the restored data.json before promoting it to live state. Live state was not touched.');
  process.exit(0);
}

mkdirSync('backup', { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const bundle = collect();
const out = `backup/backup-${stamp}.json`;
writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n');
const kb = Math.round(readFileSync(out).length / 1024);
console.log(`Backup written: ${out} (${kb} KB, ${Object.keys(bundle.data).length} sources)`);
console.log(`Restore drill: node scripts/backup.mjs --restore ${out} --into /tmp/vantage-restore-check`);