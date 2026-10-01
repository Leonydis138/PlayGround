const $ = id => document.getElementById(id);
const j = async (u, o) => (await fetch(u, o)).json();
document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll("#tabs button").forEach(x => x.classList.remove("on"));
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("on"));
  b.classList.add("on"); $("t-" + b.dataset.t).classList.add("on");
});
const pill = (t, c) => `<span class="pill ${c}">${t}</span>`;
async function init() {
  const c = await j("/api/constitution");
  $("arts").innerHTML = c.provisions.map(p => `<div class="card"><b>${p.id}</b> · ${p.title} ${pill(p.enforcement, p.enforcement.includes("hard") ? "bad" : p.enforcement.includes("soft") ? "warn" : "ok")}<br/><span class="note">P${p.priority} · ${p.text}</span></div>`).join("");
  const h = await j("/api/health");
  $("healthChip").textContent = `score ${h.overall_score} · viol ${h.dimensions.constraint_adherence.hard_violations} · p99 ${h.kpis.p99_ms}ms`;
  $("health").textContent = JSON.stringify(h, null, 2);
  const s = await j("/api/standards");
  $("stdNist").textContent = s.nist.join("\n");
  $("stdGart").textContent = "Levels: " + s.gartner_levels.join(" | ") + "\nLadder: " + s.authority_ladder.join(" -> ");
  $("euCal").innerHTML = s.eu_ai_act.map(e => `<div class="card"><b>${e.o}</b> — ${e.d} ${pill(e.s, e.s === "in force" ? "bad" : "warn")}</div>`).join("");
  const d = await j("/api/domains");
  $("doms").innerHTML = d.map(x => `<div class="card"><b>${x.name}</b><br/><span class="note">${x.value} · risk: ${x.risk} · reg: ${x.reg}</span></div>`).join("");
  const f = await j("/api/fleet");
  $("fleet").innerHTML = f.fleet.map(a => `<div class="card"><b>${a.id}</b> ${pill(a.status, a.status === "healthy" ? "ok" : "warn")}<br/><span class="note">${a.role} · ${a.autonomy}/${a.level_gartner} · ${a.spiffe}</span></div>`).join("");
  $("cp").innerHTML = f.control_plane.map(x => `<div class="card"><b>${x.c}</b> ${pill(x.s, x.s === "operational" ? "ok" : "warn")}<br/><span class="note">${x.note}</span></div>`).join("");
  $("linOut").textContent = (await j("/api/data/lineage")).lineage.join("\n");
  $("chk").innerHTML = (await j("/api/governance/checklist")).items.map(i => `<div class="card">☑ ${i}</div>`).join("");
  $("del").innerHTML = (await j("/api/deliverables")).deliverables.map(x => `<div class="card">${x}</div>`).join("");
}
$("evGo").onclick = async () => {
  $("evOut").textContent = JSON.stringify(await j("/api/constitution/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: +$("evAmount").value, reversibility: +$("evRev").value, confidence: +$("evConf").value, description: $("evDesc").value }) }), null, 2);
};
$("amGo").onclick = async () => {
  $("amOut").textContent = JSON.stringify(await j("/api/amendment/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: $("amText").value }) }), null, 2);
};
$("fGo").onclick = async () => {
  $("fOut").textContent = JSON.stringify(await j("/api/domains/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latency_ms: +$("fLat").value, irreversible_pct: +$("fIrr").value, clarity: +$("fCl").value }) }), null, 2);
};
$("dqGo").onclick = async () => {
  try { $("dqOut").textContent = JSON.stringify(await j("/api/data/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: $("dqIn").value }), null, 2); }
  catch (e) { $("dqOut").textContent = "Invalid JSON: " + e.message; }
};
$("piiGo").onclick = async () => {
  $("piiOut").textContent = JSON.stringify(await j("/api/data/pii", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: $("piiIn").value }) }), null, 2);
};
$("dpGo").onclick = async () => { $("dpOut").textContent = JSON.stringify(await j("/api/data/dp?steps=1000"), null, 2); };
$("dcGo").onclick = async () => {
  $("dcOut").textContent = JSON.stringify(await j("/api/fleet/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent: $("dcAgent").value, description: $("dcDesc").value, amount: 45000, reversibility: 0.9, confidence: 0.88 }) }), null, 2);
};
$("inGo").onclick = async () => {
  $("inOut").textContent = JSON.stringify(await j("/api/incidents/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: $("inKind").value }) }), null, 2);
};
$("auGo").onclick = async () => { $("auOut").textContent = JSON.stringify(await j("/api/audit"), null, 2); };
init();
