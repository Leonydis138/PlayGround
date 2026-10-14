#!/usr/bin/env node
/**
 * VANTAGE decision queue CLI - dependency-free (Node 18+).
 * Until now, clearing the queue meant hand-editing data.json. This makes the
 * CEO's weekly 5-minute review a terminal operation:
 *   node scripts/decide.mjs                    # list pending items
 *   node scripts/decide.mjs approve dq-001     # approve (logs note + feed)
 *   node scripts/decide.mjs approve dq-001 -m "applied to Awin"
 *   node scripts/decide.mjs reject dq-001 -m "not yet"
 * Hard rules kept: this only flips status and logs - it never sends, files,
 * or contacts anyone. Auto-approving is NOT supported on purpose.
 *
 * NEVER-class items can be listed here but approving one only marks it
 * resolved in the queue; the underlying action (payment, signup, send,
 * security change) still requires a human to perform it in its own system.
 * Read/write limited to data/data.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , cmd, id, ...rest] = process.argv;
const noteIdx = rest.indexOf('-m');
const note = noteIdx >= 0 ? (rest[noteIdx + 1] || '') : '';
const D = JSON.parse(readFileSync('data/data.json', 'utf8'));
const q = D.decision_queue || [];
const NOW = new Date().toISOString();

const NEVER = ['legal', 'pricing', 'affiliate-signup', 'payment', 'payout', 'outbound-send', 'security', 'product-pick'];

function save() {
  D.activity_feed = D.activity_feed || [];
  D.activity_feed.push({ agent: 'CEO', when: NOW, what: `${cmd} on queue (${note || 'no note'})` });
  writeFileSync('data/data.json', JSON.stringify(D, null, 2) + '\n');
}

if (!cmd || cmd === 'list') {
  const pending = q.filter(x => x.status === 'pending' || x.status === 'held-for-human');
  console.log(`DECISION QUEUE - ${pending.length} pending`);
  for (const x of pending) {
    console.log(`\n${x.id}  [${x.type}] from ${x.from_agent}${x.status === 'held-for-human' ? '  <-- HELD FOR HUMAN' : ''}`);
    console.log(`  ${x.title}`);
    console.log(`  ${x.detail}`);
    if (x.held_reason) console.log(`  held because: ${x.held_reason}`);
    if (NEVER.includes(x.type)) console.log(`  NEVER class: approving this only records your decision; the action itself is human-only.`);
  }
  if (!pending.length) console.log('Nothing pending. Good week.');
  const done = q.filter(x => x.status !== 'pending' && x.status !== 'held-for-human');
  if (done.length) {
    console.log(`\n(resolved: ${done.map(x => `${x.id}=${x.status}`).join(', ')})`);
  }
  process.exit(0);
}

const item = q.find(x => x.id === id);
if (!item) { console.error(`No queue item "${id}". Run: node scripts/decide.mjs (to list)`); process.exit(1); }
if (item.status !== 'pending' && item.status !== 'held-for-human') { console.error(`${id} is already ${item.status}.`); process.exit(1); }

if (cmd === 'approve') {
  item.status = 'approved';
  item.resolved_at = NOW;
  if (note) item.resolution_note = note;
  delete item.held_reason;
  save();
  console.log(`APPROVED ${id}: ${item.title}${note ? `\n  note: ${note}` : ''}`);
  if (NEVER.includes(item.type)) {
    console.log('NEVER class: this records your decision only. Perform the action yourself in its own system; no agent will execute it.');
  }
  console.log('The owning agent picks this up on the next run. Nothing was sent anywhere.');
} else if (cmd === 'reject') {
  if (!note) { console.error('Rejections need a reason: -m "why" (the agent needs it to learn)'); process.exit(1); }
  item.status = 'rejected';
  item.resolved_at = NOW;
  item.resolution_note = note;
  delete item.held_reason;
  save();
  console.log(`REJECTED ${id}: ${item.title}\n  reason: ${note}`);
} else {
  console.error('Usage: node scripts/decide.mjs [list | approve <id> [-m note] | reject <id> -m reason]');
  process.exit(1);
}