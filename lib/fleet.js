// Fleet, health, incidents — Phases 3/4/6/8
const FLEET = [
  { id: "procurement-agent", role: "Auto-negotiate contracts < $500K", autonomy: "A3", level_gartner: "L4", spiffe: "spiffe://prod/procurement", status: "healthy" },
  { id: "treasury-agent", role: "FX hedging within VaR", autonomy: "A3", level_gartner: "L4", spiffe: "spiffe://prod/treasury", status: "healthy" },
  { id: "support-agent", role: "Tier-1 support + retention", autonomy: "A2", level_gartner: "L3", spiffe: "spiffe://prod/support", status: "degraded" },
  { id: "compliance-agent", role: "Tx monitoring + SAR filing", autonomy: "A3", level_gartner: "L4", spiffe: "spiffe://prod/compliance", status: "healthy" },
  { id: "logistics-agent", role: "Reroute on disruption", autonomy: "A3", level_gartner: "L4", spiffe: "spiffe://prod/logistics", status: "healthy" }
];

const CONTROL_PLANE = [
  { c: "Identity (SPIRE)", s: "operational", note: "TTL<=24h, auto-rotate" },
  { c: "Policy engine (OPA/WASM)", s: "operational", note: "p99 <10ms deterministic" },
  { c: "Orchestrator", s: "operational", note: "deadlock-free, backpressure" },
  { c: "Trust assessor", s: "watch", note: "support-agent drift 0.62" },
  { c: "Audit ledger (Merkle)", s: "operational", note: "append-only, 7y retention" },
  { c: "Circuit breaker", s: "armed", note: "auto-trip/reset" }
];

function autonomyHealth() {
  return {
    timestamp: new Date().toISOString(),
    overall_score: 0.94,
    dimensions: {
      decision_quality: { score: 0.96, accuracy: 0.94, calibration: 0.92 },
      constraint_adherence: { score: 1.0, hard_violations: 0, soft_violations: 2 },
      self_healing: { score: 0.91, mttr_s: 180, auto_recovery: 0.995, escalation_rate: 0.00008 },
      adaptability: { score: 0.89, learning_velocity: 1.2, drift_latency_h: 0.8 },
      governance: { score: 0.98, audit: 1.0, compliance: 1.0 }
    },
    kpis: { intervention_per_10k: 0.8, resolution_rate: 0.996, p99_ms: 320, cost_per_decision: 0.0007, energy_J: 0.06, satisfaction: 4.6, drift_h: 0.8 },
    targets: { intervention_per_10k: "<1", resolution_rate: ">=0.995", violations: 0, mttr_min: "<5", audit: "100%", p99_ms: "<500", cost: "<$0.001" },
    alerts: [],
    recommendations: ["Retrain segment B (drift)", "Review 2x ART-3 soft near-misses"]
  };
}

const PLAYBOOKS = {
  model_drift: ["detect KS-test", "shadow deploy", "retrain", "canary 1%", "promote/rollback"],
  api_degradation: ["p99 trip", "circuit break", "fallback provider", "reset"],
  breach: ["isolate workload", "rotate creds (Vault)", "quarantine input", "file SAR"],
  counterparty_default: ["halt exposure", "unwind", "notify auditor"]
};

function runIncident(kind = "model_drift") {
  const steps = PLAYBOOKS[kind] || PLAYBOOKS.model_drift;
  return { kind, severity: kind === "breach" ? "P1" : "P2", started: new Date().toISOString(), steps: steps.map((s, i) => ({ i: i+1, action: s, status: "done", took_s: 12 + i*8 })), mttr_s: 180, escalated: false, audit_ref: "merkle:" + Math.random().toString(16).slice(2, 10) };
}

const STANDARDS = {
  nist: ["CAISI AASI (3 pillars: standards, open protocols, security research)", "NCCoE NHI: OAuth2.1/OIDC/SPIFFE/SCIM/MCP", "COSAiS SP800-53 overlays -> 2027 (gap: AC/AU/CM/RA)"],
  eu_ai_act: [
    { o: "Art.5 prohibitions", d: "2026-02-02", s: "in force" },
    { o: "Art.50 transparency", d: "2026-08-02", s: "in force" },
    { o: "Annex III high-risk", d: "2027-12-02", s: "countdown" },
    { o: "GPAI marking", d: "2026-12-02", s: "countdown" }
  ],
  gartner_levels: ["L1 Observe", "L2 Advise", "L3 Act with Approval", "L4 Act Autonomously"],
  authority_ladder: ["observe", "advise", "act with approval", "act within limits", "act autonomously"]
};

const DOMAINS = [
  { id: "procurement", name: "Autonomous procurement", value: "24/7 sourcing, <$500K auto-negotiate", risk: "fraud/supply poisoning", reg: "Medium" },
  { id: "treasury", name: "Autonomous treasury", value: "real-time hedging", risk: "market manipulation", reg: "Very High" },
  { id: "support", name: "Customer operations", value: "instant resolution", risk: "misrepresentation/bias", reg: "High" },
  { id: "security", name: "Security operations", value: "instant isolation", risk: "collateral damage", reg: "High" },
  { id: "logistics", name: "Supply chain/logistics", value: "self-healing reroute", risk: "physical disruption", reg: "Medium" },
  { id: "compliance", name: "Compliance", value: "continuous audit, SAR", risk: "false negatives", reg: "Very High" }
];

module.exports = { FLEET, CONTROL_PLANE, autonomyHealth, runIncident, PLAYBOOKS, STANDARDS, DOMAINS };
