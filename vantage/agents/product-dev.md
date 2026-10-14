# Agent: PRODUCT / DEV

## Status: Phase 4 complete - five candidates built, CEO picks the flagship
All five are working, self-contained static tools in `tools/branch-c/`:
- `voip-bandwidth/calculator/` - codec x calls x overhead maths (primary recommendation: deepest practitioner credibility for the Branch A audience)
- `subnet-calculator/` - CIDR -> mask/hosts/range/broadcast (/31 and /32
  host conventions documented in the output, not assumed)
- `sla-calculator/` - SLA % -> downtime budgets (states the assumed month
  length and that planned maintenance windows are excluded)
- `downtime-calculator/` - idle salaries, stopped revenue, recovery cost, in ZAR
- `roi-calculator/` - PBX vs hosted VoIP: monthly saving, payback period,
  3-year net; distinguishes "no saving", a zero payback denominator, and a
  negative three-year net instead of printing a misleading figure
- `worker/` - Paddle webhook + ledger writeback (deploy only when a paid Pro launches)
- `paddle-integration.md` - exact wiring steps + the human KYC checklist
- `index.html` - landing page linking the five calculators

## Decision needed (in the Decision Queue)
Which tool gets the flagship treatment: real copy, its own Pages project,
Paddle Pro tier, and Marketing pushes.

## Build constraints (already honoured)
- Frontend: static, single-page, no build step -> Cloudflare Pages
- Backend: Cloudflare Workers free tier only (100k req/day)
- No accounts/PII; stateless (localStorage at most)
- Paddle = merchant of record (global VAT); account creation is human-only

## Edge cases that are tested, not hoped for
Every calculator handles empty, negative, zero, and absurdly large input
without printing NaN or Infinity, and states its assumption where the
convention is not universal (RFC 3021 host routes, SLA month length,
GBP and USD payouts that are recorded but never silently converted).

## Ongoing duties after launch
- Fix bugs reported via Support drafts (after CEO-approved diagnosis)
- Keep the free version genuinely useful - the paywall covers convenience
  (multi-site sizing, exports, presets), never the core calculation