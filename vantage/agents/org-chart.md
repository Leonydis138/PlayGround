# VANTAGE - AI Org Chart

Fourteen specialists existed first; this file adds the department layer so the
CEO can think of the system as a company, not a pile of prompts. Every role is
a prompt protocol executed during Claude Code runs - not a 24/7 deployed bot
(free tier + the human-in-the-loop hard rule). The Ops Manager sequences the
others; nobody reports to software alone.

## Executive
- **Ops Manager (chief of staff)** - `ops-manager.md`
  Runs every session: sequences the departments, checks each one did its
  work, escalates gaps to the CEO. The only agent that reads other agents'
  outputs as its primary job.

## Front Desk
- **Receptionist** - `receptionist.md`
  The front door for everything inbound (hello@vantage-ars.co.za, contact
  form, social DMs once wired): triage, route to the right department,
  draft the acknowledgment. Never auto-sends; never makes commitments.

## Revenue Department
- **Sales** - `sales.md`
  Turns interest into revenue: pre-sales questions on the calculators,
  affiliate-program negotiation prep, Paddle Pro upsell timing (once live).
  Drafts offers; the CEO approves and signs.
- **Marketing/Social** - `marketing.md` (repurpose + queue)
- **Affiliate Ops** - `affiliate-ops.md` (link map, program compliance)

## Content Department
- **Scout** - `scout.md` (+ `scout-branch-b.md`) - demand research
- **Writer** - `writer.md`, **Critic** - `critic.md` (debate gate),
  **SEO/AEO Editor** - `seo-editor.md`

## Product Department
- **Product/Dev** - `product-dev.md` (tools/branch-c, five calculators)

## Support Department
- **Support** - `support.md` (draft replies, one-tap send)

## Finance Department
- **Accountant** - `accountant.md` (ledger, SARS-adjacent prep - numbers only)
- **Allocator** - `allocator.mjs` script + protocol (quota decisions)

## Intelligence Department
- **Analyst/Reporter** - `analyst.md`, **Monitor** - `monitor.md`,
  **Experimenter** - `experimenter.md` (one running experiment per branch)

## Shared services (every department)
- **Memory protocol** - `memory.md` (lessons learned across roles)
- Decision Queue (escalations), activity feed (audit trail)

## What this org will NOT do (by design)
- No agent sends, files, signs, posts, or calls anyone. Every outbound action
  is a draft until the CEO taps approve.
- No auto-promotion, no "growth hacking" that risks the affiliate terms.
- No role exists for a task the business does not have yet. When a real need
  appears (e.g. paid ads, bookkeeping at scale, a second language), the CEO
  adds a department then - not before.