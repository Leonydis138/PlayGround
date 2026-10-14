# Branch C - Micro-SaaS

Five candidates built and ready to deploy (pick one or run all - each is a
single static page, zero backend needed for the free tier). All five are
served by one Cloudflare Pages project (`branch-c`), behind the landing
page in `index.html`.

| Candidate | Public URL | Free version | Pro version (Paddle) |
|---|---|---|---|
| VoIP bandwidth calculator | `/voip-bandwidth/calculator/` | codecs x calls -> kbps/Mbps, per-codec table | RTP/VLAN overhead detail, multi-site sizing, CSV export, saved presets |
| Subnet calculator | `/subnet-calculator/` | CIDR -> mask, hosts, range, broadcast | VLSM planner, multiple blocks, export |
| SLA calculator | `/sla-calculator/` | SLA % <-> downtime budget (monthly/yearly) | multi-service stacks, incident budget tracker |
| Downtime cost calculator | `/downtime-calculator/` | idle salaries, stopped revenue, recovery cost, in ZAR | scenario comparison, export |
| VoIP ROI calculator | `/roi-calculator/` | PBX vs hosted VoIP: monthly saving, payback, 3-year net | multi-scenario comparison, sensitivity analysis, PDF export |

The ROI calculator cross-links to the bandwidth calculator (size the line
first, then cost it) - a natural Pro-tier upsell path.

## Edge cases these pages handle on purpose
- Empty, negative, zero and absurdly large inputs never print NaN or Infinity;
  the page states what it did with them.
- The subnet calculator documents its /31 and /32 convention explicitly
  (RFC 3021 point-to-point routes have two usable addresses, not zero).
- The SLA calculator states that a month is taken as 30 days and that planned
  maintenance windows are excluded from most vendor SLAs - check yours.
- The ROI calculator distinguishes "no monthly saving", "payback undefined
  because the saving is zero", and a negative three-year net.

## Deploy (free)
Deploy the whole `tools/branch-c/` folder to Cloudflare Pages as the
`branch-c` project (custom domain: `tools.vantage-ars.co.za`). The
`_redirects` file keeps `worker/`, `README.md` and `paddle-integration.md`
off the public paths. The Worker (`worker/`) is only needed once a pro
version exists: it validates Paddle webhooks and stores nothing.

## Payments (Paddle)
- `paddle-integration.md` has the exact wiring steps.
- Paddle account creation is a **human KYC step**.
- Nothing charges anything until the CEO flips `PADDLE_MODE` from "sandbox"
  to "live" - the page renders pricing as "coming soon" until then.