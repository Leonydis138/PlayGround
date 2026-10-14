# VANTAGE - Autonomous Revenue Engine

Three revenue branches, one engine. This repo is the machine.

Day one starts in DEPLOY-CHECKLIST.md. Every agent run starts in AGENTS.md
(auto-loaded operating instructions). Security policy: SECURITY.md.

## Layout

```
agents/            One prompt file per agent role (Scout, Writer, Editor, ...)
dashboard/         "The Bridge" - self-contained HTML dashboard
data/data.json     Single source of truth: metrics, ledger, decision queue, quotas
sites/branch-a/    Authority niche: VoIP / networking / ITSM (static, Cloudflare Pages)
sites/branch-b/    Opportunistic affiliate clusters (TEMPLATE + live clusters)
tools/branch-c/    Micro-SaaS: five calculator candidates + Paddle worker
scripts/           Dependency-free Node 18+ scripts: build-site, build-sitemaps
                   (also emits RSS), build-dashboard, allocator, cluster-score,
                   new-cluster, pull-analytics, verify, link-check, lint-content,
                   ledger-summary, status (terminal one-glance), decide (queue
                   CLI), new-article (draft scaffolder), backup (DR bundle),
                   selftest (end-to-end pipeline run in a temp copy),
                   runtime (autonomy orchestrator), tests (Section H suite)
scripts/lib/       policy.mjs (deterministic gate), store.mjs (durable task +
                   event log), orchestrator.mjs (lifecycle)
tests/             policy fixtures for scripts/tests.mjs
docs/              Design notes (genesis-integration.md - how Project Genesis
                   mechanisms became agent protocols, not code)
data/              data.json + experiments + agent memory + ledger + affiliate notes
CHANGELOG.md       Version history
LICENSE            All Rights Reserved (proprietary)
AGENTS.md          Agent operating instructions (auto-loaded first, every run)
AUDIT.md           Release audit: what is fixed, what is still not implemented
DEPLOY-CHECKLIST.md From repo to live, once - the human-only setup path
SECURITY.md        Secrets policy, site surface, incident response
.github/workflows/ Unattended mechanical jobs (publish, weekly allocator loop)
```

## How a run works

1. **Thinking (human-triggered, free):** CEO runs Claude Code in this repo.
   Claude reads the relevant files in `agents/`, does the reasoning, and writes
   drafts/changes to the repo. Daily at launch, then a few times a week.
2. **Mechanical (unattended, free):** GitHub Actions publishes committed
   drafts to Cloudflare Pages, refreshes `data/data.json` from analytics,
   and runs the Allocator scoring job weekly.
3. **Autonomy runtime:** `node scripts/runtime.mjs --dry` prints the plan and
   every policy decision without touching anything. `--apply` executes the
   same plan through the same policy gate.

## Hard rules (from the spec)

- Never auto-send customer-facing replies - support drafts queue for one-tap approval.
- Fade, don't kill: underperforming branches drop to maintenance quota, never zero.
- The Accountant agent prepares numbers; it never files anything with SARS.
- Amazon Associates: verify current South African eligibility before recommending;
  prioritise Awin / Impact / CJ / direct SaaS programs.

## Before you ship anything

```sh
node scripts/verify.mjs        # repo consistency
node scripts/lint-content.mjs  # content quality gate
node scripts/link-check.mjs    # internal links
node scripts/tests.mjs         # policy / idempotency / recovery suite
node scripts/selftest.mjs      # full pipeline in a throwaway copy
```