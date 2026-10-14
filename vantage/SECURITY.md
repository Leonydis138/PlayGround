# VANTAGE Security Policy

## Secrets - where they live and do not live
- Live in exactly two places: GitHub Actions secrets (CF_API_TOKEN,
  CF_ACCOUNT_ID, GSC_JSON_KEY, GSC_SITE_BRANCH_A, CF_SITE_TAG) and the CEO's
  local environment (`npx wrangler login`). Nowhere else.
- NEVER in: repo files, chats, issues, the canvas, PR descriptions, logs.
- `.gitignore` blocks `.env*`, `*.pem`, `service-account*.json` as a backstop.
- The Cloudflare token is scoped (Pages Edit + DNS Edit on one zone only).
  A Global API Key is never used; if one ever was, rotate it and switch to
  a scoped token.

## Site surface (all static, by design)
- Three Cloudflare Pages projects + one Worker (Paddle webhook, sandbox
  until a Pro launches). No databases, no user accounts, no sessions,
  no server-side execution of user input.
- Calculators are client-side only: user numbers never leave the browser.
- Security headers on the tools site via `_headers`; robots/sitemap emitted
  by the build.

## Worker specifics
- Paddle webhook verifies HMAC signatures in constant time and rejects
  on mismatch; secrets read from Worker environment bindings, not source.
- Ledger writes are append-only per-transaction files.

## The autonomy runtime (scripts/runtime.mjs, scripts/lib/*)
- `scripts/lib/policy.mjs` is the only thing that can authorise a state
  change. It is deterministic, fails closed, and is not reachable from
  prompt text. An unknown action name, an unknown environment, a wildcard
  resource, an expired budget or an active kill switch all deny.
- The NEVER class (legal, pricing, affiliate-signup, payment/payout,
  outbound-send, security, product-pick) returns `defer-human` at every
  autonomy level. There is no configuration that unlocks it, and the test
  suite asserts that no level, status string, or malformed item can widen it.
- Writes are atomic (temp file + rename) behind a single-writer lease with a
  fencing token, so a stale process cannot overwrite newer state.
- External effects run against mocks only. The suite never contacts a
  payment provider, a mail provider, or a live deploy.
- Policy decisions are logged with a reason code and an argument digest.
  Secret values are never logged.

## If something leaks
1. Rotate the credential at its source (GitHub secrets, Cloudflare token,
   GSC key) immediately - that is the whole response; static sites hold
   no user data to clean up.
2. Audit: `grep -rn` the tree for the leaked value, check Actions run logs
   for the affected window, check the activity feed for [auto] anomalies.
3. Post-mortem line in CHANGELOG (what rotated, why, when).

## Reporting
hello@vantage-ars.co.za - allow up to a week (solo operator, free tier).