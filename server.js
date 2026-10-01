const express = require("express");
const path = require("path");
const { CONSTITUTION, evaluateAction, simulateAmendment } = require("./lib/constitution");
const { validateRecord, redactPII, dpBudget, LINEAGE } = require("./lib/dataTrust");
const { FLEET, CONTROL_PLANE, autonomyHealth, runIncident, PLAYBOOKS, STANDARDS, DOMAINS } = require("./lib/fleet");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = require("fs").existsSync(path.join(__dirname, "dist", "index.html"))
  ? path.join(__dirname, "dist")
  : path.join(__dirname, "public");
app.use(express.json());
app.use(express.static(STATIC_DIR));

const AUDIT = []; // Merkle-stub: hash-chained in-memory ledger
let prevHash = "genesis";
function appendAudit(entry) {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256").update(prevHash + JSON.stringify(entry)).digest("hex").slice(0, 16);
  const rec = { seq: AUDIT.length + 1, ts: new Date().toISOString(), prev: prevHash, hash, ...entry };
  prevHash = hash; AUDIT.push(rec); return rec;
}

// ---- Constitution ----
app.get("/api/constitution", (req, res) => res.json(CONSTITUTION));
app.post("/api/constitution/evaluate", (req, res) => {
  const r = evaluateAction(req.body || {});
  const rec = appendAudit({ kind: "decision", action: req.body, verdict: r.verdict });
  res.json({ ...r, audit_ref: `${rec.seq}:${rec.hash}` });
});
app.post("/api/amendment/simulate", (req, res) => res.json(simulateAmendment(req.body.text || "")));

// ---- Data trust ----
app.post("/api/data/validate", (req, res) => res.json(validateRecord(req.body || {})));
app.post("/api/data/pii", (req, res) => res.json(redactPII(req.body.text || "")));
app.get("/api/data/dp", (req, res) => res.json(dpBudget(Number(req.query.steps || 1000))));
app.get("/api/data/lineage", (req, res) => res.json({ lineage: LINEAGE }));

// ---- Fleet / decisions ----
app.get("/api/fleet", (req, res) => res.json({ fleet: FLEET, control_plane: CONTROL_PLANE }));
app.post("/api/fleet/decide", (req, res) => {
  // 7-step pipeline stub: perceive->risk->constraint->plan->execute->capture->learn
  const ev = evaluateAction(req.body || {});
  const steps = ["perceive", "risk_assess", "constraint_eval", "plan", "execute", "outcome_capture", "learn"];
  const rec = appendAudit({ kind: "fleet_decision", agent: req.body.agent || "procurement-agent", verdict: ev.verdict });
  res.json({ pipeline: steps, evaluation: ev, decision_record: { id: `dec_${rec.seq}`, audit: `${rec.seq}:${rec.hash}`, confidence: ev.confidence, reversibility: req.body.reversibility ?? 1 }, ddi: 0.82, maturity: "L4-managed" });
});

// ---- Health / ops ----
app.get("/api/health", (req, res) => res.json(autonomyHealth()));
app.post("/api/incidents/run", (req, res) => {
  const r = runIncident(req.body.kind || "model_drift");
  appendAudit({ kind: "incident", ...r });
  res.json(r);
});
app.get("/api/playbooks", (req, res) => res.json(PLAYBOOKS));
app.get("/api/audit", (req, res) => res.json({ count: AUDIT.length, records: AUDIT.slice(-50) }));

// ---- Governance ----
app.get("/api/standards", (req, res) => res.json(STANDARDS));
app.get("/api/domains", (req, res) => res.json(DOMAINS));
app.post("/api/domains/score", (req, res) => {
  const { latency_ms = 200, irreversible_pct = 5, clarity = 0.85 } = req.body || {};
  res.json({
    latency: latency_ms <= 500 ? "pass p99<500ms" : "fail",
    reversibility: irreversible_pct <= 10 ? "pass (<=10% irreversible)" : "needs extra constraints",
    clarity: clarity >= 0.8 ? "A3-ready (>=0.8)" : "not ready",
    verdict: latency_ms <= 500 && irreversible_pct <= 10 && clarity >= 0.8 ? "A3 feasible" : "constrain scope"
  });
});
app.get("/api/governance/checklist", (req, res) => res.json({
  items: [
    "autonomy envelope defined (C<=k, R<=p, I>=i)", "ART-1..10 machine-checkable", "multisig amendment + 72h timelock",
    "NHI SPIFFE + TTL<=24h + rotation", "OPA/WASM pre-exec <10ms", "Merkle audit 7y",
    "EU Art.5/50 now; Annex III by 2027-12-02", "NIST COSAiS gaps mitigated (AC/AU/CM/RA)",
    "Gartner L1-L4 proportional controls", "MTTR<5m, resolution>=99.5%, violations=0"
  ]
}));
app.get("/api/deliverables", (req, res) => res.json({
  deliverables: ["constitution.yaml", "agent_fleet.yaml", "decision_record schema", "autonomy_health dashboard", "playbooks", "governance CI pipeline", "liability contract (30/60/10)", "sunset/succession plan", "audit export", "EU/NIST mapping"]
}));

app.get("/api", (req, res) => res.json({ name: "autonomous-business-console", version: "5.0.0", spec: "Master Script v5.0 Consolidated" }));

app.listen(PORT, () => console.log(`A3 console on :${PORT}`));
