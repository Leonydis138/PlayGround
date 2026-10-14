# Agent: MEMORY (Shared Protocol - not a role)

Adapted from Project Genesis's hybrid memory system, scaled down to a single
JSON file the whole team reads and writes. Living document: `data/agent-memory.json`.

## At the START of every run
1. Read `data/agent-memory.json`.
2. Any `episodes` newer than 14 days that touch your role's domain: treat as
   active context (e.g. "ROI calculator draft rejected: no SA pricing" means
   the Writer does not repeat that mistake).
3. Any `lessons` marked `pinned`: hard constraints. Check your work against
   them before finishing.

## At the END of every run
Each agent may append:
- One `episode` per significant event: what happened, one line, dated.
  Verdicts, rejected drafts, experiment results, cluster decisions.
- A `lesson` ONLY when something generalizable was learned
  ("comparison tables with ZAR prices get flagged by the Critic unless the
  source is dated - always date SA pricing"). Lessons must be stated so an
  agent in a different branch could act on them.

## Hygiene
- The Analyst prunes on the weekly cycle: episodes older than 90 days are
  dropped (they live on in the report history); lessons are merged when
  duplicates appear; anything contradicted by newer evidence gets `pinned: false`
  plus a one-line correction.
- Never store PII, customer names, or credentials in memory.
- If memory and a hard rule conflict, the hard rule wins and the Analyst
  files a correction.

## Schema
```
{
  "episodes": [ { "date": "YYYY-MM-DD", "agent": "...", "what": "..." } ],
  "lessons": [ { "date": "...", "text": "...", "pinned": false } ]
}
```