# VANTAGE - Release Audit

**Date:** 2026-10-14
**Scope:** the supplied `Complete Build v2.2.0` bundle, plus the Section 8
release-readiness findings, plus the autonomy-first specification.
**Method:** the bundle was extracted to its 101 declared paths, then every
gate was run for real. Nothing below is asserted from reading the code; each
item states the command that proves it and the exit code observed.

---

## 1. Verification evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Repo consistency | `node scripts/verify.mjs` | 0 | 106 files, 6 JSON parsed, OK |
| Content quality | `node scripts/lint-content.mjs` | 0 | 0 errors, 1 warning (see 4.1) |
| Internal links | `node scripts/link-check.mjs` | 0 | 26 links, 0 broken |
| Safety suite | `node scripts/tests.mjs` | 0 | 60 passed, 0 failed |
| End-to-end | `node scripts/selftest.mjs` | 0 | 12 steps + 10 outputs + 3 drills OK |
| Runtime (dry) | `node scripts/runtime.mjs` | 0 | 2 tasks planned, 0 mutations |
| Runtime (apply) | `node scripts/runtime.mjs --apply` | 0 | 2 tasks completed, 14 events |

Node v22.23.3, Linux. The repository is dependency-free; `npm install` is not
required and was not run.

---

## 2. Bugs found in the supplied bundle

These were defects in the bundle as delivered, not in the specification.

| # | Severity | Location | Defect |
|---|---|---|---|
| B1 | **Critical** | `scripts/selftest.mjs` | Imported `spawnSync` from `node:fs`. `spawnSync` lives in `node:child_process`, so the file threw `SyntaxError` on load. **The pre-deploy confidence gate had never run.** Fixed. |
| B2 | **Critical** | `scripts/autonomy.mjs` | `draft_slug` from queue data was joined straight into a path. A slug of `../../OWNED` resolved outside the content root. Verified hostile, now refused. |
| B3 | High | `scripts/autonomy.mjs` | A promotion whose slug already existed in `published/` silently overwrote the page. Now refused. |
| B4 | High | `scripts/allocator.mjs` | A branch with no analytics scored 0 and ranked last, so the branch that was merely *invisible* got faded. No-signal guard was score-equality, so it only fired when all branches tied. |
| B5 | High | `scripts/allocator.mjs` | Maintenance recovery was documented as "2 consecutive weeks" and implemented as immediate. |
| B6 | High | `scripts/allocator.mjs` | Top branch +1 had no matching decrement. Company capacity grew every week, unbounded. |
| B7 | High | `scripts/autonomy.mjs` | NEVER-class items were skipped with no trace, so a human could not see the queue was waiting on them. |
| B8 | Medium | `scripts/autonomy.mjs` | Level 2 (`seo-tweak`, `faq-add`) was documented in `agents/autonomy.md` with no implementation at all. |
| B9 | Medium | `scripts/ledger-summary.mjs` | Malformed entries were summed as-is; duplicate transaction references double-counted revenue; binary float arithmetic on money. |
| B10 | Medium | `scripts/build-site.mjs` | Slug from frontmatter was unsanitised; two files could collide on one URL, silently dropping a page. Link and attribute contexts were not escaped. |
| B11 | Medium | `scripts/build-sitemaps.mjs` | Sitemap URLs omitted the trailing slash that the build actually serves. The tools page list was hand-maintained and could drift from the directory. |
| B12 | Medium | `.github/workflows/publish.yml` | `wrangler pages project create ... \|\| true` swallowed auth and account errors as well as "already exists", so a broken token looked like a healthy deploy. |
| B13 | Medium | `.github/workflows/weekly.yml` | `git push` failure exited 0, printing "nothing to commit". A lost state refresh failed silently. |
| B14 | Low | `scripts/link-check.mjs` | Only checked Branch A; a cluster's broken links passed. |

Bugs introduced and caught during this work, in the new runtime (fixed, tests
added): an idempotency replay returned the wrapper object instead of the
result; `sequence` was incremented after the state write in three places, so
the event log disagreed with the snapshot; `checkpoint()` had the same defect
as `claim()`; task ids and objectives were unbounded; a dry run persisted
lease and transition state; a fully policy-blocked plan attempted the illegal
edge `planning -> verifying`; refusing the same draft re-logged to the activity
feed every single week.

---

## 3. What the Section 8 findings are now worth

| # | Finding | Status |
|---|---|---|
| 1 | Allocator recovery policy mismatch | **Fixed** - `recovery_streak`, 2 consecutive weeks, a week without a valid score does not count. Code and `agents/allocator.md` agree. |
| 2 | Score semantics / missing metrics | **Fixed** - absent or >45-day-old metrics make a branch ineligible. `unknown` is a first-class value, distinct from 0, in the allocator, cluster scorer, status CLI and dashboard. |
| 3 | Allocation proportionality | **Fixed** - moves are transfers against `capacity.total_articles_per_week`. A branch below the maintenance floor is reconciled *from* other branches. Drift is detected and exits non-zero. |
| 4 | Autonomy gate idempotency and safety | **Fixed** - slug validation, path confinement, collision refusal, re-run is a byte-for-byte no-op, refusals deduplicated and printed. |
| 5 | Level 2 documented but absent | **Fixed** - bounded description-only edits inside the content allowlist, with a length cap and a logged before/after. |
| 6 | Workflow deployment coverage | **Partly fixed** - `scripts/assets/**` added to the path filter (the article template changes every built page). Remaining: the graduated-cluster deploy path cannot be exercised until a cluster exists. |
| 7 | Workflow / toolchain consistency | **Fixed** - Node 22 pinned in both workflows; CI is the only runtime that matters, and it is now actually exercised by the green selftest. |
| 8 | Actions supply-chain policy | **Not fixed - needs a decision.** Actions are still pinned to mutable `@v4` tags. SHA pinning requires resolving and recording commit SHAs, which is a reviewable change with a real maintenance cost, not something to do silently. |
| 9 | Cloudflare project creation | **Fixed** - `create_if_missing()` tolerates only a proven "already exists"; any other failure aborts with an error. |
| 10 | Commit / deployment race | **Partly fixed** - a rejected push rebases once then fails loudly. Remaining: the weekly job commits to `main` while `publish.yml` deploys on push to `main`; if you want review enforced on that commit, branch protection has to be configured in repository settings, which is a human step. |
| 11 | Analytics data integrity | **Fixed** - a failed pull preserves the previous values *and* their timestamp so staleness becomes visible; `metrics_as_of` is stamped only on success; an empty Cloudflare window is `null`, never 0. |
| 12 | Financial ledger semantics | **Partly fixed** - schema validation, duplicate-reference detection, integer-cent arithmetic, foreign currency flagged and excluded from the ZAR rolling total. Remaining: fee/refund handling has no defined schema yet, because there are no transactions to define it from. |
| 13 | Privacy and legal content | **Not verified** - requires reviewing the deployed behaviour against the published policies. An agent cannot attest to this. |
| 14 | Calculator edge cases | **Fixed** - empty/negative/zero/oversized inputs are handled and stated in-page; `/31` and `/32` conventions documented; the ROI calculator distinguishes "no saving", "payback undefined", and a negative three-year net; the SLA calculator states its 30-day month and the maintenance-window exclusion. |
| 15 | Sitemap / robots behaviour | **Fixed** - trailing slashes now match the build; the tools sitemap is generated from the directory; duplicate slugs are an error. Live custom-domain behaviour still needs a human check. |
| 16 | Self-test realism | **Fixed** - isolated temp copy, success path, failure path (a thin scaffolded draft must be refused), idempotency path, and a real backup restore. |

---

## 4. What is still not implemented

Honest list. None of these are claims; each is a capability the code does not have.

### 4.1 The business cannot earn yet
- **Zero published articles.** `content/published/` holds only about,
  contact, privacy and affiliate-disclosure. The one real draft
  (`sip-vs-hosted-sme-cost-math.md`, 220 words) is blocked on practitioner
  notes that only the owner can write. The 800-word linter is correct; the
  content simply does not exist yet.
- **No analytics are wired.** No GSC or Cloudflare credentials exist, so every
  branch metric is `unknown` and the Allocator is (correctly) frozen.
- **Nothing is deployed.** No GitHub repo, no Cloudflare Pages projects, no
  secrets. `DEPLOY-CHECKLIST.md` is unticked.
- **No affiliate programme is joined.** `data/affiliate-programs.json` still
  holds the placeholder.
- **The ledger is empty.** No accountant-ready figures exist.

### 4.2 Autonomy is bounded by infrastructure
- **The runtime is not a service.** It runs from the weekly Actions job or a
  local invocation. There is no always-on loop, no event trigger, no queue
  worker. The spec's "acts every second" is not what this is.
- **The planner and workers are stubs.** `scripts/runtime.mjs` contains
  deterministic placeholders, not the thinking agents. The *lifecycle*, the
  *policy gate* and the *audit trail* are real and tested; the *intelligence*
  is still a Claude Code run driven by `KICKOFF.md`.
- **There is no tool gateway with real adapters.** The policy engine has the
  vocabulary for adapters (`file.read`, `pages.deploy`, `email.send`, ...) but
  no adapter actually talks to Cloudflare, GitHub or any provider. External
  effects in the test suite are simulated, never performed.
- **No deploy, no rollback-on-health-failure.** `publish.yml` deploys; nothing
  probes the deployed routes afterwards and nothing reverts a bad release.
- **No observability or alerting.** Nothing pages anyone. The failure
  taxonomy in the spec is documented, not implemented.
- **The kill switch is a config flag.** It stops mutations in this process. It
  does not pause a GitHub Actions run already in flight, and it does not
  revoke a leaked credential.
- **No retention or deletion machinery** for the append-only event log.

### 4.3 Known-open items
- Actions SHA pinning (finding 8) - decision required.
- Branch protection for the weekly commit (finding 10) - human step.
- Privacy/legal verification against deployed behaviour (finding 13).
- Ledger fee/refund schema (finding 12).
- `data/agent-memory.json` pruning (the Analyst is a prompt protocol; nothing
  prunes it automatically).
- Branch B lifecycle: `cluster-graduate` / `cluster-archive` are SAFE classes
  the gate approves, but no script performs the directory move. It is still a
  thinking step, as `CLUSTERS.md` says.
- The dashboard has no authentication. It exposes the decision queue and the
  ledger summary. That is acceptable on a free static host only if you accept
  that anyone who guesses the URL can read the queue.

---

## 5. Known content warning

`lint-content.mjs` reports one warning:
`sites/branch-a/content/drafts/sip-vs-hosted-sme-cost-math.md: only 220 words`.
This is correct and should not be "fixed" by padding. The draft is short
because the CEO's practitioner notes are missing. The right move is to write
the notes, not to lengthen the draft.

---

## 6. Recommendation

The code is now internally consistent, gated and tested, and the safety
properties are demonstrated rather than asserted. **It is not production-ready
for revenue**, because production readiness here depends on human-only inputs
(credentials, affiliate approvals, practitioner notes, DNS) rather than on
code. The correct next actions are the unticked boxes in
`DEPLOY-CHECKLIST.md` and 30 minutes of the owner's time writing notes - not
more code.

If forced to pick one thing: **write the practitioner notes.** They are the
binding constraint on every content-dependent part of this system, and no
amount of autonomy changes that.