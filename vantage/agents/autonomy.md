# Protocol: AUTONOMY LEVELS

Every agent reads this. It defines what "act autonomously" means in this
company - and what it can never mean on this stack.

## The hard floor: one deterministic gate

`scripts/lib/policy.mjs` is the only thing that can authorise a state change.
It is code, not a prompt. It fails closed: an unknown action, an unknown
environment, a wildcard resource, an expired budget, an active kill switch,
or an unrecognised result all deny. No model, role file, queue status or
wording in a document can widen what it allows. `scripts/autonomy.mjs` and
`scripts/runtime.mjs` both route every mutation through it, and
`scripts/tests.mjs` asserts that fact.

## Levels (set in data/data.json -> autonomy.level)

- **Level 0 - draft-only.** Classic human-in-the-loop: every action that
  changes anything is a draft + a decision queue item. Nothing auto-executes.
- **Level 1 - safe autonomy (recommended operating level).** Agents act
  without the CEO inside their sandbox; the autonomy gate
  (`scripts/autonomy.mjs`, wired into the weekly Actions job and run at
  session start) auto-executes SAFE-class items.
- **Level 2 - safe + routine edits.** Level 1 plus: SEO/AEO routine edits to
  already-published content (meta descriptions, internal links, typo fixes)
  apply without re-approval, within a bounded allowlist of paths and fields.
  Substantive content changes still debate + gate. Level 2 edits are logged
  with before/after and are individually reversible.

## SAFE class (auto-executes at level >= 1)
- `content-publish` - promoting a lint-clean, link-checked draft to published
- `experiment-verdict` - recording a finished A/B's outcome
- `cluster-archive` / `cluster-graduate` - Branch B lifecycle moves
- `social-queue` - adding platform-native posts to the scheduling queue
- `faq-add` - answering a 3x-repeated question on-page
- `seo-tweak` - routine metadata fixes

The gate re-checks quality itself: it will refuse a `content-publish` that
is under 800 words, contains scaffold (TODO/lorem), or has a broken internal
link. Trust, but verify.

## NEVER class (hard floor - no level, no config, no exception)
- `legal` - anything with legal substance (POPIA, contracts, disputes)
- `pricing` - the price of anything
- `affiliate-signup` - signing the company up to a program
- `payment` / `payout` - money movement in any direction
- `outbound-send` - email, DM, post, comment to a real human being
- `security` - secrets, keys, DNS, account access
- `product-pick` - flagship/strategy choices (they define the company)

These are not "CEO is slow" items; they are items where an AI mistake is
irreversible, reputationally expensive, or legally binding on a human. The
gate marks them `held-for-human` with a reason rather than skipping them in
silence, so they are visible rather than forgotten.

## What is ALREADY autonomous (no CEO involved, has been since v1.0)
- Builds, deploys (Pages + worker), sitemaps, RSS, dashboard refreshes
- Weekly analytics pull, cluster scoring, allocator quota adjustments
  (with fade-don't-kill floors and the no-signal guard)
- Content quality gate + link-check (they fail the pipeline, not a human)
- The weekly Actions loop itself - the company runs every Monday 06:00 UTC
  with no human awake

## The physical limits (be honest with yourself)
- **Cadence:** free-tier GitHub Actions schedules the gate weekly. Thinking
  runs happen when the CEO opens Claude Code. Autonomy here means "acts
  without asking", not "acts every second of every day".
- **Outbound:** there is no always-on email/social integration on the free
  tier, so outbound drafts wait for one-tap send regardless of level. This
  is an infrastructure fact, not a policy choice.
- **Money/legal:** stays human. Permanently. The accountant is a human; the
  agents prepare their numbers.

## Escalation still works
Any agent may still queue anything for the CEO - autonomy removes the
obligation to ask on safe items, not the ability to ask. And the CEO can
revert anything the gate did: drafts un-promote, queue items re-open,
reversible by design (git history covers the rest).

## Changing the level
One line in `data/data.json`: `"autonomy": { "level": 1 }`. Set it to 0 and
the entire company reverts to draft-only instantly.

## A level is a ceiling, not a licence
A configured level is the maximum scope. It is never a reason to take a risky
action. If evidence is weak, the gate refuses and the state is preserved with
the uncertainty recorded.