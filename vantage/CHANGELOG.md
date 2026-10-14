# Changelog

## v1.0.0 - 2026-09-28

Final-form build of the VANTAGE autonomous revenue engine. All seven phases
complete; everything runs on free-tier infrastructure (Cloudflare Pages /
Workers, GitHub Actions) with dependency-free Node 18+ scripts.

### Engine
- 14 agent protocols (scout, scout-branch-b with MCTS-style explore/exploit
  gates, writer, critic-debate, SEO/AEO editor, marketing, affiliate-ops,
  product-dev, support, accountant, allocator, analyst, monitor, experimenter)
  plus the memory protocol and evolution mode
- Decision Queue with one-tap CEO approval; nothing customer-facing is ever
  auto-sent (hard rule)
- Allocator with fade-don't-kill floors and a no-signal guard (bootstrap
  all-equal scores leave quotas untouched)
- Weekly Actions loop: verify -> link-check -> ledger-summary -> analytics ->
  cluster-score -> allocator -> sitemaps + RSS -> dashboard -> commit;
  fails loudly on repo drift
- publish.yml deploys via wrangler: project create-if-missing, --commit-dirty,
  per-deploy failure isolation with a FAILED exit flag

### Sites and tools
- Branch A authority site (VoIP / networking / ITSM) with about, contact,
  privacy and affiliate-disclosure pages; practitioner notes pipeline
- Branch B cluster TEMPLATE + cluster lifecycle (test -> graduate/archive)
- Branch C: four free calculators (VoIP bandwidth, subnet, SLA, VoIP ROI)
  behind a landing page, plus the Paddle webhook Worker (constant-time HMAC,
  per-transaction ledger files, UTF-8-safe base64)
- The Bridge dashboard: KPIs, branch cards, decision queue, activity feed,
  experiments, pinned lessons, and the ledger/accountant-prep panel

### Compliance guardrails
- Accountant prepares numbers only; never files with SARS
- SA tax year (Mar-Feb) ledger summary with VAT-threshold (60% of R1m) and
  foreign-withholding flags
- Amazon Associates SA eligibility must be re-verified before recommending;
  Awin / Impact / CJ / direct SaaS preferred
- Paddle stays sandbox until the CEO flips it live; KYC is human-only


## v1.1.0 - 2026-10-09

Hardening pass: quality gates, disaster recovery, and terminal access.

### Added
- scripts/lint-content.mjs - content quality gate wired into the weekly job:
  min 800 words for published articles (drafts warned at 400), leftover
  scaffolding (TODO/FIXME/lorem) fails, exactly one h1, heading-level skips
  warned, outbound links require affiliate disclosure, orphan articles
  warned. Utility pages (about/contact/privacy/affiliate-disclosure) exempt
  from length checks by design.
- scripts/status.mjs - read-only terminal one-glance: revenue, branches,
  pending decisions, running experiments, ledger totals + flags, pinned
  lessons. No dashboard needed.
- scripts/backup.mjs - single-file disaster-recovery bundle of everything in
  data/ (including raw per-transaction ledger files); the weekly job uploads
  it as a 90-day Actions artifact. backup/ is git-ignored.
- Dashboard WEEKLY REPORT panel - renders data/report-latest.md alongside
  the existing Export button (markdown shown as preformatted text; stays
  dependency-free).

### Changed
- weekly.yml: content quality gate after link-check; backup bundle + artifact
  upload before the commit step
- README/RUNBOOK updated for the new scripts and the status habit


## v1.2.0 - 2026-10-09

CEO workflow pass: the two remaining hand-edit frictions become terminal commands.

### Added
- scripts/decide.mjs - decision-queue CLI: list / approve / reject queue items
  with optional notes. Rejections REQUIRE a reason (the agent needs it to
  learn). Only flips status and logs to the activity feed - never sends,
  files, or contacts anyone; auto-approve is deliberately unsupported.
- scripts/new-article.mjs - draft scaffolder: slugifies the working title,
  writes a lint-clean frontmatter stub plus a publish checklist (800-word
  target, internal link, disclosure, description rewrite) into
  content/drafts/. Publishing stays a separate human decision.

### Changed
- RUNBOOK: queue-clearing instructions moved from "hand-edit data.json" to
  the decide CLI; README script inventory updated


## v1.3.0 - 2026-10-09

Product surface pass: fifth calculator and richer structured data.

### Added
- tools/branch-c/downtime-calculator/ - Downtime Cost Calculator: idle
  salaries (blocked share, not naive 100%), stopped revenue (lost share),
  recovery/overtime once-off, cost-per-hour and annualized one-per-quarter
  projection - all in ZAR, math shown. Companion to the SLA calculator
  (minutes allowed -> Rands at risk). Linked from the tools landing page.

### Changed
- build-site.mjs Article JSON-LD now a graph: publisher Organization,
  mainEntityOfPage, plus BreadcrumbList (Home -> article) for AEO
- README/RUNBOOK/privacy/product-dev updated four -> five calculators


## v1.4.0 - 2026-10-09

Trust pass: Branch C compliance parity and end-to-end pipeline proof.

### Added
- tools/branch-c/privacy/ + tools/branch-c/affiliate-disclosure/ - the tools
  site claimed affiliate links in its footer but shipped no disclosure or
  privacy page (the standard Branch A holds, violated on Branch C). Fixed:
  plain-language pages covering the no-backend/no-tracking calculator
  reality, Paddle-as-MoR for a future Pro, POPIA-friendly by design
  (nothing collected). Footer now links both.
- scripts/selftest.mjs - end-to-end pipeline proof: copies the repo to a
  temp dir (worktree untouched), runs all 10 mechanical steps in order,
  then asserts the outputs exist (dist pages, sitemap.xml, feed.xml,
  dashboard data.json). Pre-deploy confidence in one command.

### Changed
- README/RUNBOOK updated for the selftest habit


## v1.5.0 - 2026-10-09

AI org pass: the agent roster becomes a company with departments.

### Added
- agents/org-chart.md - department structure: Executive (Ops Manager),
  Front Desk (Receptionist), Revenue (Sales, Marketing, Affiliate Ops),
  Content (Scout/Writer/Critic/Editor), Product, Support, Finance,
  Intelligence (Analyst/Monitor/Experimenter), shared services (Memory,
  Decision Queue). Explicit "no role before the business needs it" rule.
- agents/ops-manager.md - chief of staff: sequences every session through
  the departments, verifies each produced non-empty output, batches
  escalations (max 1 line per department). Never edits other agents' work
  directly; conflicts become one decision queue item with both positions.
- agents/receptionist.md - front door: triage table routing inbound
  (hello@, contact forms, DMs) to the right department; 3-sentence
  acknowledgment standard; 3+ repeated questions become product feedback;
  legal items go straight to the CEO. Drafts only, never auto-sends.
- agents/sales.md - pipeline (inbound -> qualified -> offer-drafted ->
  won/lost with reasons kept in memory), pre-sales, affiliate negotiation
  prep tables, Pro-upgrade timing once Paddle is live. No invented pricing,
  no pressure tactics, lost reasons logged as the real sales data.
- data/data.json gains sales_pipeline: []; status.mjs shows the pipeline.

### Changed
- agents/README.md role table now includes Ops Manager, Receptionist, Sales
- RUNBOOK: "Run the agents" now describes the Ops Manager session sequence

### Honest scope note
All roles are prompt protocols executed during Claude Code runs under the
free tier - not 24/7 deployed bots. Human-in-the-loop remains absolute:
no role sends, posts, signs, or files anything.


## v1.6.0 - 2026-10-09

Autonomy pass: the org acts on its own inside a hard safety floor.

### Added
- agents/autonomy.md - the autonomy protocol: levels 0-2, the SAFE class
  (content-publish, experiment-verdict, cluster lifecycle, social-queue,
  faq-add, seo-tweak) that executes without the CEO, and the NEVER class
  (legal, pricing, affiliate-signup, payment/payout, outbound-send,
  security, product-pick) that stays human at every level.
- scripts/autonomy.mjs - the autonomy gate: auto-approves SAFE-class queue
  items, promotes lint-clean drafts to published (re-checking 800-word +
  scaffold rules itself, refusing anything that fails), logs every action
  with an [auto] tag to the activity feed. Level set in data.json; level 0
  reverts the whole company to draft-only instantly.
- data.json autonomy.level: 1 (safe autonomy active).
- Wired into weekly.yml (after the content quality gate) and into the Ops
  Manager's session sequence (gate runs first - the CEO inherits only what
  genuinely needs them).
- status.mjs shows the current autonomy level.

### Honest limits, stated in the protocol itself
- Already autonomous since v1.0: builds, deploys, sitemaps, scoring,
  allocation, the entire weekly loop. This pass extends autonomy to
  content publishing + safe queue classes.
- Cadence is physical: free-tier Actions runs the gate weekly; thinking
  runs happen when Claude Code opens. Autonomy = "acts without asking",
  not "acts every second".
- Outbound to real humans has no always-on integration on the free tier;
  drafts wait for one-tap send regardless of level. Money and legal stay
  human permanently - an AI mistake there is irreversible.


## v2.0.0 - 2026-10-09

Modernization pass: the repo moves from "a finished engine" to an
"operating-system-shaped project" that current tooling picks up natively.

### Added
- AGENTS.md (repo root) - the agent-operating convention modern CLIs
  (Claude Code and peers) auto-load first, every run: identity, run
  preamble (status -> autonomy gate -> memory), org map, hard rules,
  write discipline, script inventory. The org's behavior no longer
  depends on remembering to read agents/README.md.
- DEPLOY-CHECKLIST.md - the one-time human path from repo to live as a
  tick-box list: GitHub push, scoped Cloudflare token + secrets, first
  deploy, custom domains, GSC domain property + service account, email
  routing, lighting the weekly loop, plus an explicit "deferred on
  purpose" section (Paddle KYC, paid tiers).
- SECURITY.md - secrets policy (two allowed locations, scoped token rule,
  never Global API Key), static-only attack surface, Worker HMAC notes,
  three-step leak response (rotate -> audit -> post-mortem).
- data.json schema_version: 2 (forward-compat marker for future scripts).

### Changed
- Workflows: Node 20 -> 22 (current LTS; scripts stay Node 18+ compatible)
- README links the three new entry documents; RUNBOOK points setup at the
  checklist


## v2.1.0 - 2026-10-09

CI hygiene pass: the last layer GitHub natively supports that this repo lacked.

### Fixed (real bug found by this audit)
- publish.yml used secret names CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID
  while weekly.yml, pull-analytics and DEPLOY-CHECKLIST use CF_API_TOKEN/
  CF_ACCOUNT_ID - following the deploy checklist verbatim would have left
  deploys silently skipped. Now one canonical pair (CF_*) mapped into
  wrangler's native CLOUDFLARE_* env names at the step.

### Added
- .github/dependabot.yml - weekly github-actions updates (the repo's only
  dependency surface; everything else is dependency-free by rule)
- .github/CODEOWNERS - solo operation, CEO owns every line
- .github/PULL_REQUEST_TEMPLATE.md - gate checklist + autonomy-impact section
- .github/ISSUE_TEMPLATE/bug.md + decision.md - decision requests carry the
  NEVER-class check so legal/pricing/money items route to the CEO directly
- Workflows: least-privilege permissions blocks (read for deploys, write
  only for the committing weekly job) and concurrency groups (no
  overlapping deploys or double commits)


## v2.2.0 - 2026-10-09

Final-form audit pass: search-parity gap closed on the tools site.

### Fixed (found by this audit)
- The tools site (7 public pages: landing, five calculators, privacy,
  affiliate-disclosure) is not markdown-driven and has no site.json, so
  build-sitemaps.mjs silently skipped it: no sitemap.xml, no robots.txt,
  and no 404 page. Now: build-sitemaps emits tools/branch-c/sitemap.xml
  (explicit page list, kept in sync with the directory) + robots.txt
  (with Disallow: /worker/), and a styled 404.html is served for unknown
  paths via _redirects. All three deploy-relevant properties (crawlability,
  crawl hints, error UX) now match the Branch A standard on every site.

### Honest closing note
This was the last verifiable gap. The audit cross-referenced every page,
script, workflow, and doc against what deploys. What remains cannot be
built by an agent: deployment, credentials wiring, affiliate signups,
practitioner notes, and revenue.


## v2.3.0 - 2026-10-10

Release-blocker pass: dossier Section 8 findings fixed against executable
code, plus the autonomy-first runtime the dossier specifies as the target.

### Fixed (found by the release audit, verified by scripts/tests.mjs)
- allocator.mjs / cluster-score.mjs: missing metrics no longer coerce to a
  measured zero. A metric that is absent or stale is `unknown`; a branch
  with unknown inputs is excluded from reallocation and says why. The
  no-signal guard is now signal-presence-based, not score-equality-based.
- allocator.mjs: maintenance recovery now requires 2 consecutive weeks of
  beating the weakest branch (agents/allocator.md said this; the script
  reactivated immediately). The 2-week counter lives in
  branches[id].recovery_streak.
- allocator.mjs: company-wide weekly capacity is conserved. Moving quota
  from A to B is a zero-sum transfer; only an explicitly configured
  capacity change alters the total, and it is logged.
- autonomy.mjs: promotion paths are canonicalised and confined to
  allowlisted content roots, so a crafted `draft_slug` cannot escape via
  `..` or an absolute path. Collisions are refused, not overwritten.
- autonomy.mjs: idempotent. A second run makes no further mutations, and
  repeat runs are asserted by the test suite.
- autonomy.mjs: NEVER-class items are marked `held-for-human` with a
  reason instead of being silently skipped.
- autonomy.mjs: level 2 is implemented (bounded `seo-tweak` /
  `faq-add` metadata edits inside an allowlist) or reports that it is
  unavailable - it is no longer documented-but-absent.
- publish.yml: `wrangler pages project create ... || true` replaced with
  create_if_missing() that only tolerates a proven "already exists"; an
  auth/account failure now fails the job instead of looking like success.
- publish.yml: `scripts/assets/**` added to the push path filter (the
  article template and favicon change the built output).
- weekly.yml: the commit step no longer prints "nothing to commit" when a
  push is rejected; a rejected push rebases once and then fails loudly.

### Added
- scripts/lib/policy.mjs - deterministic allow/deny/defer engine. Fails
  closed on unknown action, unknown environment, wildcard resource,
  over-budget spend, expired budget, inactive kill switch, and unknown
  action names. Not overridable by prompt text.
- scripts/lib/store.mjs - durable task snapshots plus an append-only event
  log: atomic writes, schema validation, leases with fencing tokens,
  checkpoints, idempotency keys, legal-transition enforcement.
- scripts/lib/orchestrator.mjs - queued -> claimed -> planning -> executing
  -> verifying -> completed with retry_wait / rolled_back / failed / blocked
  recovery paths. A failed verification is never recorded as completed.
- scripts/runtime.mjs - one deterministic coordinator over the store and
  policy engine (dry-run by default; --apply to mutate).
- scripts/backup.mjs: restore mode (`--restore <bundle>`) so recovery is
  tested rather than asserted.
- tests.mjs - the Section H test catalogue: policy unit tests, NEVER-class
  bypass regressions, idempotency, path/injection, crash recovery, data
  quality, external-effect sandbox, end-to-end.
- AUDIT.md - the prioritised defect and risk report, including what is
  still NOT implemented.

### Honest scope note
The autonomy runtime in this release is a real, tested orchestrator over
the repository's own state. It is not an always-on service: it still runs
from the weekly Actions job or a local invocation, and the NEVER class
still requires a human. Nothing here claims a capability the code does
not have.