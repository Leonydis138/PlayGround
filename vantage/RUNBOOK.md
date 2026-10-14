# VANTAGE RUNBOOK - How to Run This Thing

Plain language. No jargon. This is the only document you need open day-to-day.

---

## The 60-second version

1. Open **the Bridge** (dashboard URL) and look at the **Decision Queue**
2. Do whatever it asks (usually: apply to an affiliate program, approve a reply,
   or pick a direction)
3. Open Claude Code in the repo and type: **"Run the agents"**
4. Done for today. Come back tomorrow (or twice a week once things hum)

Everything else is automatic: publishing, scoring, reallocation, the ledger.

---

## One-time human setup (you, once - no agent can do these)

The full tick-box path from repo to live is DEPLOY-CHECKLIST.md (top level).
What follows is the same material with more context on the why.

| # | What | Where | Why |
|---|---|---|---|
| 1 | ~~Register the domain~~ - DONE: vantage-ars.co.za | registrar | credibility + email deliverability |
| 2 | Create GitHub repo, push this code | github.com | free; the whole machine runs from it |
| 3 | Connect Cloudflare Pages (3 projects: branch-a site, branch-c tools, dashboard) | dash.cloudflare.com -> Pages -> connect git | free hosting, unlimited bandwidth |
| 4 | Verify Google Search Console for the domain | search.google.com/search-console | free traffic data; required for the analytics pull |
| 5 | Create the GSC service account + GitHub secrets (`GSC_JSON_KEY`, `GSC_SITE_BRANCH_A`; optional `CF_API_TOKEN`/`CF_ACCOUNT_ID`/`CF_SITE_TAG`) | cloud.google.com + repo settings -> secrets -> Actions | lets the weekly job pull real numbers |
| 6 | Open the bank account for payouts | your bank | money has to land somewhere |
| 7 | Sign up for Paddle (KYC) | paddle.com | only when Branch C's Pro tier goes live - can wait |
| 8 | Apply to affiliate programs when Scout shortlists them | Awin / Impact / CJ / direct | agents shortlist; you click apply |

After #1: update `sites/branch-a/site.json` (and each cluster's site.json)
with the real domain, and the Pages custom domains.
**Done (this pass): all configs now use vantage-ars.co.za - see the map below.**

---

## Domain map - vantage-ars.co.za (registered)

| Host | Serves | Deployed as |
|---|---|---|
| `vantage-ars.co.za` | Branch A authority site | Cloudflare Pages project "branch-a" |
| `tools.vantage-ars.co.za` | Branch C calculators (VoIP bandwidth, subnet, SLA, ROI, downtime cost) behind a landing page | Cloudflare Pages project "branch-c" |
| `api.vantage-ars.co.za` | Branch C Worker (Paddle webhooks - only when Pro goes live) | Worker "vantage-branch-c" |
| `<cluster>.vantage-ars.co.za` | each Branch B cluster site | Cloudflare Pages, one project per cluster |
| `dash.vantage-ars.co.za` | The Bridge (decision dashboard) | Cloudflare Pages project "dashboard" |

### How sites actually get deployed (pick ONE path)

**Path A - Pages git integration (recommended):** Workers & Pages -> Create
-> Pages -> Connect to Git, once per project (branch-a, branch-c, dashboard,
one per graduated cluster). Each project gets its own build command + output
dir, e.g. branch-a: `node scripts/build-site.mjs branch-a` -> output
`sites/branch-a/dist`. Every push to main builds on Cloudflare's side - zero
GitHub Actions minutes. If you choose this, disable the `publish.yml`
workflow (repo Settings -> Actions) so nothing deploys twice.

**Path B - GitHub Actions deploys directly** (`.github/workflows/publish.yml`):
builds everything, then runs `wrangler pages deploy` per project. Needs two
repo secrets: `CF_API_TOKEN` (permission: Cloudflare Pages - Edit)
and `CF_ACCOUNT_ID` - the same pair the weekly job uses. Without them it
builds and exits cleanly - no
deploy, no failure. Branch B clusters deploy as projects named `b-<name>`.

Do not run both paths - you would pay Actions minutes for builds Cloudflare
is already doing.

### DNS + Cloudflare setup (once, ~15 min)

1. In Cloudflare, add the site `vantage-ars.co.za` on the **Free plan** and
   update the nameservers at your registrar (the registrar's email has them).
2. Wait for "Active" status, then add a **wildcard DNS record**:
   `*` -> CNAME -> `<your-pages-project>.pages.dev` (proxied). This lets every
   future Branch B cluster go live with zero DNS work.
   Branch B clusters each become their own Pages project with a custom
   domain `<name>.vantage-ars.co.za`.
3. Pages -> Create project -> connect the GitHub repo, three times:
   - "branch-a": build command `node scripts/build-site.mjs branch-a`, output `sites/branch-a/dist`
   - "branch-c": build `tools/branch-c`, output `.` (static files; the landing page links all five calculators)
   - "dashboard": build `dashboard`, output `.`
   Then in each project: Custom domains -> add the host from the map above.
   The wildcard DNS makes each add one click (no DNS editing).
4. Free tier check: Pages has unlimited bandwidth on the free plan;
   Workers free = 100k req/day - plenty at this scale.
5. **Email routing (free, 5 min):** Cloudflare dash -> Email -> Email
   Routing -> enable, then add a custom address `hello@` forwarding to your
   personal mailbox. This makes the contact page's address live at zero
   cost - no mail server to run.

### GSC verification

Use the **DNS method** (add the TXT record Cloudflare shows you in
Search Console -> verify -> it auto-verifies the whole domain, every subdomain
included - no per-cluster verification needed). GSC "Domain" property:
`vantage-ars.co.za` -> put that in the `GSC_SITE_BRANCH_A` secret as
`sc-domain:vantage-ars.co.za`.

---

## Scaling triggers - when to level up (and when NOT)

The system tells you when it is ready to grow. Ignore the urge to scale early:

| Trigger | What it means | Your move |
|---|---|---|
| Branch A: 1,000+ visits/month over 2 months | Search trusts the domain | raise Branch A quota in `data/data.json` (max 5/week - quality over volume) |
| A Branch B cluster hits `graduated` | it earns its keep long-term | leave it alone; its quota is protected by the floor |
| Any calculator: 500+ uses/month | Branch C has pull | build the Pro tier (Paddle KYC first - see runbook step 7) |
| Decision Queue consistently empty for 3 weeks | the agents have nothing to ask | that is success, not a problem - check the weekly report instead |
| Revenue > R5,000/month total | free tools may start costing time | consider one paid tool ONLY if it removes a manual step you actually do |

**Anti-triggers (do NOT scale on these):** one good day of traffic; a viral
calculator share; excitement. One week is noise. Two months is signal.

---

## Your daily/weekly rhythm

**Each run (Claude Code):** type "Run the agents". The Ops Manager
(`agents/ops-manager.md`) sequences the session - Receptionist triages
inbound, then Intelligence, Content, Revenue, Product/Support, Finance - and
batch-escalates anything needing you into the Decision Queue. Claude reads
`agents/*.md` (see `agents/org-chart.md` for the department structure),
executes the roles that have work, and appends what it did to the activity
feed. Anything needing you becomes a Decision Queue item - nothing
important happens silently.

**Before anything else:** `node scripts/status.mjs` - terminal one-glance:
revenue, pending decisions, running experiments, ledger flags. No dashboard
needed.

**Before any deploy push:** `node scripts/selftest.mjs` - runs the whole
pipeline (verify, lint, link-check, ledger, score, allocate, build, sitemaps,
dashboard, backup) in a throwaway temp copy of the repo. Nothing real is
touched; a fail means something is broken before it reaches Pages.

**Checking what autonomy would do, without doing it:**
`node scripts/runtime.mjs --dry` - prints every task transition and every
policy decision it would make, then exits without mutating anything. This is
the safe way to read the machine before you let it move.

**Clearing the queue from the terminal:** `node scripts/decide.mjs` lists
pending items; `node scripts/decide.mjs approve dq-001 -m "note"` resolves
them (rejections require a reason - the agent needs it to learn). This only
flips status and logs; nothing is ever sent anywhere.

**Weekly (automatic, Monday 06:00 UTC):** GitHub Actions pulls analytics
(if secrets wired), scores clusters, runs the Allocator, lints content
quality, writes a disaster-recovery backup artifact, commits the data.
The dashboard is current when you open it.

**Weekly (you, 5 minutes):** open the dashboard, read the report
(`data/report-latest.md` or the Export button), clear the Decision Queue.

**Monthly-ish:** paste practitioner notes into `sites/branch-a/notes/` -
even 5 rough bullets per topic. This is Branch A's unfair advantage; without
it, the Writer queues `ceo-input-needed` items instead of writing.

---

## What each dashboard section means

- **Command summary** - money in, this week/month/all-time, plus how many
  decisions are waiting. "Status" line is the honest one-liner (Growing /
  Stable / Needs a decision)
- **Branch cards** - one per business. Badge = mode (ACTIVE = full quota,
  MAINTENANCE = 1 piece/month floor, never zero). Score = the Allocator's
  weekly number (revenue growth 50%, traffic growth 30%, conversion rate 20%)
- **Decision queue** - the ONLY thing that needs you. Each item names the
  one action. Empty queue = good week
- **Activity feed** - what each agent did on the last run, in plain language

## What the agents will never do (by design)

- Send anything customer-facing without your one-tap approval
- Sign you up for anything (affiliate programs, Paddle, domains)
- Kill a branch - they fade it to maintenance and propose; you decide
- File anything with SARS - the Accountant prepares numbers for *your* accountant
- Charge anyone money - Paddle stays sandbox until you flip it to live

## Honest expectations

- Week 1-4: near-zero traffic is normal. Search trust takes weeks to months
- Branch B clusters get judged at week 4-6, not before
- If everything is flat for 6+ weeks, the honest move is the Decision Queue
  says so - the system will not flatter you
- A branch whose analytics have not arrived is scored `unknown`, not `zero`.
  It is excluded from reallocation that week and the dashboard says why.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dashboard shows "NO DATA" | data.json missing next to index.html - rerun `node scripts/build-dashboard.mjs` |
| Analytics feed says "secrets not wired" | do setup step 5 above |
| A draft sits in `drafts/` forever | it's blocked on your practitioner notes - check the Decision Queue |
| Nothing published after a run | check the SEO/AEO Editor checklist failed on what (it says in the activity feed) |
| Weekly job didn't run | GitHub -> Actions -> weekly -> run manually (workflow_dispatch is enabled) |
| Allocator says "no signal" forever | analytics are not arriving; check `data/analytics-snapshot.json` exists and the secrets are set |
| Autonomy gate refuses a promotion | read the refusal reason in the activity feed - it names the exact failed check |
| `node scripts/tests.mjs` fails | a safety test failing blocks autonomy increases and production mutations; fix the code, not the test |

---

## The exact run prompt

`KICKOFF.md` contains the paste-into-Claude-Code prompt that runs the agents.
Daily habit: open the repo, paste it, read the 3-line summary. That's it.