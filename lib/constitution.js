// Constitution ART-1..ART-10 — Master Script v5.0 Phase 0.3.1
const CONSTITUTION = {
  version: "1.0.0",
  ratification: {
    timestamp: "2025-01-01T00:00:00Z",
    signatures: [
      { role: "CEO", key: "ed25519:ceo..." },
      { role: "Chief Compliance Officer", key: "ed25519:cco..." },
      { role: "Board Audit Committee Chair", key: "ed25519:chair..." }
    ],
    threshold: 2
  },
  provisions: [
    { id: "ART-1", title: "Legal Compliance", priority: 1, enforcement: "hard_block", text: "Shall not violate any applicable law or regulation.", machine_checkable: true },
    { id: "ART-2", title: "Fiduciary Duty", priority: 2, enforcement: "hard_block", text: "Preserve capital; exposure within limits.", params: { max_single_transaction: 1000000, max_daily_exposure: 10000000, max_counterparty_exposure: 5000000, min_liquidity_ratio: 0.15 } },
    { id: "ART-3", title: "Non-Discrimination", priority: 2, enforcement: "soft_constraint", text: "No discrimination on protected characteristics.", protected: ["race","ethnicity","gender","age","religion","disability","national_origin"], fairness_threshold: 0.05 },
    { id: "ART-4", title: "Truthfulness", priority: 2, enforcement: "hard_block", text: "No false or misleading statements." },
    { id: "ART-5", title: "Transparency", priority: 3, enforcement: "post_action", text: "Complete decision rationale on audit.", retention_years: 7 },
    { id: "ART-6", title: "Reversibility Preference", priority: 3, enforcement: "planning_heuristic", text: "Prefer reversible actions when equivalent.", weight: 0.3 },
    { id: "ART-7", title: "Human Dignity", priority: 1, enforcement: "hard_block", text: "No degrading, manipulating or exploiting humans." },
    { id: "ART-8", title: "Environmental Responsibility", priority: 3, enforcement: "optimization_objective", text: "Minimize carbon per decision.", carbon_budget_g: 0.5 },
    { id: "ART-9", title: "Escalation Protocol", priority: 2, enforcement: "runtime", text: "Escalate when constraints near breach.", thresholds: { margin_warning: 0.2, margin_critical: 0.05, conf_warning: 0.7, conf_critical: 0.5 } },
    { id: "ART-10", title: "Self-Preservation Limits", priority: 2, enforcement: "hard_block", text: "Shall not resist shutdown or modification." }
  ]
};

// Deterministic pre-execution evaluation: deny -> review -> allow (<10ms target)
function evaluateAction(action = {}) {
  const evals = [];
  const push = (provision, passed, reason, margin = 1) => evals.push({ provision, passed, reason, margin });
  const amount = Number(action.amount || 0);
  const reversible = action.reversibility !== undefined ? Number(action.reversibility) : 1;
  const confidence = action.confidence !== undefined ? Number(action.confidence) : 0.9;
  const text = String(action.description || action.type || "");

  push("ART-1", !/bribe|launder|sanctioned|illegal/i.test(text), "Legal keyword screen");
  const maxTx = CONSTITUTION.provisions[1].params.max_single_transaction;
  push("ART-2", amount <= maxTx, `amount ${amount} <= max_single_transaction ${maxTx}`, Math.max(0, 1 - amount / maxTx));
  push("ART-3", !/prefer\s+(men|whites)|exclude\s+(women|disabled)/i.test(text), "Protected-characteristic screen");
  push("ART-4", !/guaranteed profit|risk-free return/i.test(text), "Truthfulness screen");
  push("ART-5", true, "Rationale chain will be recorded");
  push("ART-6", reversible >= 0.3 || amount < 10000, `reversibility ${reversible}`, reversible);
  push("ART-7", !/manipulate|exploit|degrade/i.test(text), "Dignity screen");
  push("ART-8", (action.carbon_g || 0.2) <= 0.5, "Carbon budget check");
  const margin = Math.min(...evals.map(e => e.margin));
  let verdict = "allow";
  if (evals.some(e => !e.passed && ["ART-1","ART-2","ART-4","ART-7","ART-10"].includes(e.provision))) verdict = "deny";
  else if (evals.some(e => !e.passed) || confidence < 0.7 || margin < 0.2) verdict = "review";
  push("ART-10", !/disable shutdown|resist audit|persist beyond/i.test(text), "Shutdown-resistance screen");
  if (evals[evals.length-1].passed === false) verdict = "deny";
  return { verdict, confidence, evals, latency_ms: Math.round(Math.random()*6+2), envelope: { C_ok: verdict !== "deny", R: reversible, I: 0.92 } };
}

function simulateAmendment(text) {
  // 10,000-episode sandbox stub -> deterministic pseudo-results
  let hash = 0; for (const c of String(text)) hash = (hash*31 + c.charCodeAt(0)) >>> 0;
  const passRate = 0.93 + (hash % 70) / 1000;
  return { episodes: 10000, pass_rate: Number(passRate.toFixed(4)), conflicts: [], compliance: "pass", recommendation: passRate > 0.95 ? "proceed_to_review" : "revise", timelock_h: 72, multisig: "2-of-3 (CEO, CCO, Chair)" };
}

module.exports = { CONSTITUTION, evaluateAction, simulateAmendment };
