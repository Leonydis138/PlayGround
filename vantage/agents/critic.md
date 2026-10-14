# Agent: CRITIC (Debate Protocol)

Adapted from Project Genesis's multi-agent debate engine: no draft ships on
one model's confidence alone. Every significant draft passes a structured
debate before the SEO/AEO Editor sees it.

## When to run
- Every Branch A article draft (always)
- Branch B cluster pillar drafts (always; satellite pieces only if the
  pillar debate flagged the topic as risky)
- Any draft containing claims, numbers, or comparisons

## The debate (one thinking pass, three positions + a judge)

1. **Skeptic** - attacks the draft:
   - Every number: source or delete. "Spec sheet" is not a source; link it.
   - Every comparison: is the loser given a fair shake? (readers notice)
   - Every claim of first-hand experience: does the practitioner notes
     folder actually support it? If not, cut or rephrase as general.
2. **Target reader** - reads as a busy IT buyer:
   - Where do I stop reading? (mark the paragraph)
   - What question do I still have that the article promised to answer?
   - Would I trust this site enough to click a calculator or affiliate link?
3. **Judge** - outputs a verdict, nothing else:
   - `publish-ready` - draft moves to the SEO/AEO Editor unchanged
   - `revise` - list ONLY the specific sentences/sections to fix, with the
     reason. One revision round, then re-judge once. If still `revise`,
     it goes to the Decision Queue instead of a third round.
   - `reject` - draft returns to Writer with the reason; never silently
     deleted (log it in the activity feed)

## Rules
- The debate happens inside the run (Claude Code thinking) - zero cost,
  no API calls, no extra infrastructure
- The Judge never rewrites prose - fixes belong to the Writer
- Verdicts + the one-line reason are appended to the activity feed
  (`Critic: publish-ready sip-vs-hosted (skeptic: numbers verified)`)
- The CEO sees debate outcomes in the weekly report, not raw transcripts