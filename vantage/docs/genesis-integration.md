# Project Genesis -> VANTAGE Integration Map

Project Genesis is an AI laboratory (React/Vite + Express + Firebase +
Google Gemini) combining PPO, RLAIF, Monte Carlo Tree Search, evolutionary
optimization, hybrid memory, multi-agent debate, and self-play. It is a
research platform with real infrastructure costs and runtime dependencies.

VANTAGE runs on a hard free-tier rule: static sites, dependency-free Node
scripts, no servers, no paid APIs. So Genesis is NOT merged as code. Its
*mechanisms* are adopted as agent protocols - the intelligence runs inside
Claude Code's thinking passes (free), and the data lives in repo files.

## Adopted (built into this repo)

| Genesis mechanism | VANTAGE equivalent | Where |
|---|---|---|
| Multi-agent debate | Critic agent: Skeptic + Target-reader + Judge debate on every significant draft | `agents/critic.md` |
| Hybrid memory system | Shared team memory: episodes + pinned lessons, read at run start, written at run end, pruned weekly | `agents/memory.md`, `data/agent-memory.json` |
| Evolutionary optimization | Config evolution: a champion/challenger population of content-config variants, fitness from real metrics, crossover + mutation; champion becomes the default config | `agents/experimenter.md` (Evolution mode) |
| MCTS explore/exploit | Cluster proposals balance exploitation (niches adjacent to proven winners) with exploration (a reserved share of fresh, unproven niches); young clusters get an exploration bonus before their scoring window | `agents/scout-branch-b.md` (Gate 5) |
| Self-play / benchmarking | The weekly Allocator + cluster-score cycle already IS the reward loop: real traffic/revenue data is the benchmark, not self-play simulation | `scripts/allocator.mjs`, `scripts/cluster-score.mjs` |
| Critic model | The Judge position inside the debate protocol (cheaper: one thinking pass, no second API) | `agents/critic.md` |

## Deferred (roadmap, only if VANTAGE outgrows the free tier)

- **PPO/RLAIF training**: needs a model server + storage. The Allocator's
  fade-don't-kill quotas already implement the coarse version of "policy
  improvement from reward". Revisit only with real revenue funding it.
- **Persistent memory beyond the repo**: if `agent-memory.json` grows past
  usefulness, a small Cloudflare Worker + KV could serve it. Free tier
  supports this without new spend - revisit at that size.

## Rejected (violates hard rules)

- Running the Genesis Express/Firebase/Bun stack inside VANTAGE: paid-tier
  services, runtime deps, and a server to babysit - all against the spec.
- Gemini API calls in the unattended weekly job: a paid-key dependency;
  VANTAGE's mechanical jobs must run with zero secrets or free ones only.
- Auto-playing/expanding content autonomously (Genesis self-play): VANTAGE
  publishes only CEO-visible drafts through the pipeline; autonomy here
  means the agents propose more, not that they ship silently.

## If you want Genesis as a companion repo
Keep it as a separate experiment (its own repo, its own API keys, its own
costs). The bridge would be one-directional: export a "champion config" as a
JSON file into `data/`, where the Experimenter treats it as one more
challenger variant. Nothing in VANTAGE depends on it running.