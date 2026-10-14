# VANTAGE Deploy Checklist - from repo to live, once

~30-45 minutes of human work. No agent can do these steps (accounts, KYC,
secrets). Print this, tick the boxes. Detail lives in RUNBOOK.md.

## 0. Prereqs
- [ ] GitHub account, git installed locally
- [ ] Cloudflare account with the vantage-ars.co.za zone active
  (domain registered, nameservers pointed at Cloudflare - you did this)

## 1. Repo -> GitHub (5 min)
- [ ] `git init && git add -A && git commit -m "VANTAGE v2.3.0"`
- [ ] Create a PRIVATE GitHub repo, push
- [ ] Sanity: no secrets in the tree - `grep -rn "CF_API_TOKEN\|BEGIN.*PRIVATE KEY" .` should only hit docs/examples

## 2. Cloudflare API access (5 min)
- [ ] Cloudflare dashboard -> My Profile -> API Tokens -> Create Token
- [ ] Template "Cloudflare Pages Edit" + add Zone:DNS:Edit for vantage-ars.co.za
- [ ] Copy the token NOW (shown once). Account ID: dashboard URL / Workers overview page
- [ ] GitHub repo -> Settings -> Secrets and variables -> Actions -> add:
  - [ ] `CF_API_TOKEN`
  - [ ] `CF_ACCOUNT_ID`
- [ ] Never paste these in chats, issues, or files

## 3. First deploy (10 min)
- [ ] Push any commit -> Actions tab -> publish.yml runs
  (wrangler creates the three Pages projects if missing and deploys)
- [ ] If it fails: read the job log; publish.yml is built to name the failing
      step and still flag FAILED at the end
- [ ] Verify: each project serves its content on its pages.dev URL

## 4. Custom domains (10 min)
Per Pages project -> Custom domains -> add:
- [ ] branch-a: `vantage-ars.co.za` + `www` (redirect www -> apex)
- [ ] branch-c: `tools.vantage-ars.co.za`
- [ ] dashboard: `bridge.vantage-ars.co.za`
Pages auto-creates the DNS records; confirm they exist in the zone DNS tab.

## 5. Search Console (10 min)
- [ ] search.google.com/search-console -> Add property -> Domain -> vantage-ars.co.za
- [ ] Copy the TXT record -> add in Cloudflare DNS -> Verify
  (domain property verifies every subdomain at once)
- [ ] Create a GSC service account + JSON key (RUNBOOK has the steps)
- [ ] Add GitHub secrets: `GSC_JSON_KEY` (the whole JSON), `GSC_SITE_BRANCH_A`
- [ ] Invite the service account email in GSC (verified owner, read-only)

## 6. Email (5 min)
- [ ] Cloudflare zone -> Email Routing -> enable, add `hello@vantage-ars.co.za`
      -> forward to your mailbox (this is what the contact pages publish)
- [ ] Send yourself a test email

## 7. Light the weekly loop (0 min)
- [ ] Done automatically: weekly.yml runs Mondays 06:00 UTC - verify, lint,
      link-check, ledger, analytics, score, allocate, autonomy gate, sitemaps,
      dashboard, backup artifact, commit
- [ ] Monday after: check the Actions run + open the dashboard

## When it is live
- [ ] Book: first practitioner notes into sites/branch-a/notes/ (Branch A fuel)
- [ ] Decision queue: `node scripts/decide.mjs` - clear affiliate-signup,
      product-pick
- [ ] Affiliate applications (human-only, per agents/affiliate-ops.md shortlist)

## Restore drill (do this once before you need it)
- [ ] `node scripts/backup.mjs` then `node scripts/backup.mjs --restore backup/backup-<date>.json --into /tmp/restore-check`
- [ ] Confirm data/data.json, data/ledger/*.json and the report are present
      in the restore target. A backup you have never restored is a guess.

## Deferred on purpose (do NOT do yet)
- Paddle KYC: only when a Pro product is picked AND live-ready (dq-002)
- Any paid tier: see RUNBOOK scaling triggers first