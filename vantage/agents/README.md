# Agent Role Library

Each file here is one "employee": a prompt + its slice of the pipeline.
Claude Code loads the relevant file(s) when the CEO triggers a run.
See `org-chart.md` for the department structure these roles slot into.

| Role | File | Writes to |
|---|---|---|
| Ops Manager (chief of staff) | `ops-manager.md` | session sequences, verification, batched escalations |
| Receptionist (front desk) | `receptionist.md` | draft acknowledgments, inbound log -> activity feed |
| Scout | `scout.md` (+ `scout-branch-b.md` rubric) | `sites/branch-a/backlog.md`, decision queue items |
| Writer | `writer.md` | `sites/*/content/**/*.md` (drafts) |
| Critic (debate) | `critic.md` | debate verdicts on drafts -> activity feed, Decision Queue |
| SEO/AEO Editor | `seo-editor.md` | drafts + frontmatter/schema |
| Marketing/Social | `marketing.md` | `sites/*/social/queue.md` |
| Sales | `sales.md` | pipeline in `data/data.json` -> sales_pipeline, draft offers |
| Affiliate Ops | `affiliate-ops.md` | link map, `data/ledger`, decision queue |
| Product/Dev | `product-dev.md` | `tools/branch-c/` |
| Support | `support.md` | draft replies in decision queue (NEVER auto-send) |
| Accountant | `accountant.md` | `data/ledger` |
| Allocator | `allocator.md` | `data/data.json` (quotas, modes) |
| Analyst/Reporter | `analyst.md` | `data/report-latest.md` |
| Monitor | `monitor.md` | watchlist in `data/report-latest.md`, decision queue items |
| Experimenter | `experimenter.md` | `data/experiments.json` (one running experiment per branch) |
| Memory (shared protocol) | `memory.md` | `data/agent-memory.json` (read at run start, write at run end) |

## Cross-cutting protocols
- **Autonomy:** every agent reads `autonomy.md` - what executes without the
  CEO (SAFE class, gated by `scripts/autonomy.mjs` and enforced by
  `scripts/lib/policy.mjs`) and the NEVER class that stays human at any level
  (legal, pricing, money, outbound, security).
- **Memory:** every agent reads `data/agent-memory.json` at run start and
  may append an episode or lesson at run end (see `memory.md`).
- **Debate:** significant drafts pass the Critic debate before editing
  (see `critic.md`).

## Ground rules for every agent

1. Follow the hard rules in `../README.md` (human-in-the-loop, fade-don't-kill, SARS caution).
2. Every action gets a plain-language line appended to `data/data.json` -> `activity_feed`.
3. Anything requiring CEO input becomes a `decision_queue` item - never a silent action.
4. Autonomy comes from the autonomy gate (`autonomy.md`), not from an agent
   deciding alone: act freely inside your sandbox, execute only what the
   gate authorizes, queue everything else.
5. Never invent metrics. If data is missing, say so in the feed.