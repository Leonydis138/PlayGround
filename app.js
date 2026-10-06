const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const LS_KEY = 'vantage-ars-queue-v1';
const STATUS = { new: 'New', 'in-review': 'In review', quoted: 'Quoted', closed: 'Closed' };
const SECRET_PATTERNS = [
  /password\s*[:=]/i, /passwd/i, /api[_-]?key\s*[:=]/i, /access[_-]?key/i,
  /secret\s*[:=]/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /sk-(live|test)-[A-Za-z0-9]{8,}/,
  /xox[bpas]-/, /gh[pousr]_[A-Za-z0-9]{10,}/, /AKIA[0-9A-Z]{16}/
];

const state = { server: [], local: loadLocal(), search: '', filter: 'all', online: null };

function loadLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveLocal() { localStorage.setItem(LS_KEY, JSON.stringify(state.local)); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function allItems() {
  const seen = new Set();
  return [...state.server, ...state.local]
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

async function fetchQueue() {
  try {
    const r = await fetch('/api/enquiries');
    if (!r.ok) throw new Error(String(r.status));
    state.server = await r.json();
    state.online = true;
  } catch { state.online = false; }
  const b = $('#sync-badge');
  b.textContent = state.online ? 'Server queue connected' : 'Offline — local queue only';
  b.className = 'badge ' + (state.online ? 'on' : 'off');
  renderQueue();
}

function visibleItems() {
  const q = state.search.trim().toLowerCase();
  return allItems().filter(e => {
    if (state.filter !== 'all' && e.status !== state.filter) return false;
    if (!q) return true;
    return [e.id, e.name, e.email, e.message].some(v => String(v).toLowerCase().includes(q));
  });
}

function renderQueue() {
  const items = visibleItems();
  const total = allItems().length;
  $('#queue-count').textContent = total ? `${total} enquir${total === 1 ? 'y' : 'ies'} · showing ${items.length}` : 'Queue empty';
  $('#queue-list').innerHTML = items.length ? items.map(e => `
    <article class="qitem" data-id="${esc(e.id)}">
      <header>
        <strong>${esc(e.name)}</strong>
        <span class="meta">${esc(e.email)}</span>
        <span class="st ${esc(e.status || 'new')}">${esc(STATUS[e.status] || 'New')}</span>
        <span class="src">${e.source === 'local' ? 'local' : 'server'}</span>
        <span class="meta">${esc(new Date(e.at).toLocaleString())} · #${esc(e.id)}</span>
      </header>
      <p>${esc(e.message)}</p>
      <div class="q-controls">
        <select data-act="status" aria-label="Status">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(e.status || 'new') === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <input data-act="note" type="text" placeholder="Internal note…" value="${esc(e.note || '')}" maxlength="1000" aria-label="Internal note" />
        <button class="del" data-act="del" type="button" aria-label="Delete enquiry ${esc(e.id)}">Delete</button>
      </div>
      ${e.note ? `<p class="meta">Note: ${esc(e.note)}</p>` : ''}
    </article>`).join('')
    : `<div class="empty">${total ? 'No enquiries match the current search or filter.' : 'No enquiries yet. Submit the form above to test the queue.'}</div>`;
}

function updateItem(id, patch) {
  const sIdx = state.server.findIndex(e => e.id === id);
  if (sIdx > -1) {
    state.server[sIdx] = { ...state.server[sIdx], ...patch };
    fetch(`/api/enquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    }).catch(() => toast('Server unreachable — change kept locally'));
  } else {
    const lIdx = state.local.findIndex(e => e.id === id);
    if (lIdx > -1) { state.local[lIdx] = { ...state.local[lIdx], ...patch }; saveLocal(); }
  }
  renderQueue();
}

async function deleteItem(id) {
  if (state.server.some(e => e.id === id)) {
    try { await fetch(`/api/enquiries/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
    catch { toast('Server unreachable'); }
    state.server = state.server.filter(e => e.id !== id);
  }
  state.local = state.local.filter(e => e.id !== id);
  saveLocal();
  renderQueue();
}

$('#queue-list').addEventListener('change', ev => {
  const t = ev.target;
  const id = t.closest('.qitem')?.dataset.id;
  if (!id) return;
  if (t.dataset.act === 'status') updateItem(id, { status: t.value });
  if (t.dataset.act === 'note') updateItem(id, { note: t.value });
});
$('#queue-list').addEventListener('click', ev => {
  if (ev.target.dataset.act === 'del') deleteItem(ev.target.closest('.qitem').dataset.id);
});
$('#q-search').addEventListener('input', ev => { state.search = ev.target.value; renderQueue(); });
$('#q-filter').addEventListener('change', ev => { state.filter = ev.target.value; renderQueue(); });
$('#refresh-btn').addEventListener('click', fetchQueue);
$('#export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(allItems(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vantage-ars-enquiries.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Queue exported as JSON');
});
$('#clear-btn').addEventListener('click', () => {
  if (confirm('Clear the local queue on this device? Server items are kept.')) {
    state.local = [];
    saveLocal();
    renderQueue();
    toast('Local queue cleared');
  }
});

const form = $('#enquiry-form');
const statusEl = $('#form-status');
const msg = $('#f-message');

msg.addEventListener('input', () => { $('#msg-count').textContent = `${msg.value.length} / 5000`; });
['f-name', 'f-email', 'f-message'].forEach(id => {
  $('#' + id).addEventListener('input', () => {
    $('#' + id).classList.remove('invalid');
    const err = $('#err-' + id.split('-')[1]);
    if (err) err.hidden = true;
  });
});

function fieldError(id, text) {
  const input = $('#' + id);
  input.classList.add('invalid');
  const err = $('#err-' + id.split('-')[1]);
  err.textContent = text;
  err.hidden = false;
  input.focus();
}

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = $('#f-name').value.trim();
  const email = $('#f-email').value.trim();
  const message = msg.value.trim();
  const hp = form.company_website.value.trim();
  if (hp) return;
  if (!name) return fieldError('f-name', 'Please add your name.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fieldError('f-email', 'Please enter a valid email address.');
  if (message.length < 20) return fieldError('f-message', 'Please describe the issue in a little more detail (20+ characters).');
  if (SECRET_PATTERNS.some(rx => rx.test(message) || rx.test(name))) {
    return fieldError('f-message', 'Possible secret detected — remove passwords, keys or tokens and resubmit.');
  }
  const btn = $('#send-btn');
  btn.disabled = true;
  statusEl.textContent = 'Sending…';
  statusEl.className = '';
  try {
    const r = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (r.status === 204) { btn.disabled = false; return; }
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      form.reset();
      $('#msg-count').textContent = '0 / 5000';
      statusEl.textContent = `Received — enquiry ${data.id || ''} entered the review queue. No automated reply is sent. No contract created.`;
      statusEl.className = 'ok';
      toast(`Enquiry ${data.id || ''} queued for review`);
      fetchQueue();
    } else {
      statusEl.textContent = data.error || 'Please check the form and try again.';
      statusEl.className = 'bad';
    }
  } catch {
    state.local.push({ id: 'LOCAL-' + Date.now().toString(36).toUpperCase(), name, email, message, note: '', status: 'new', at: new Date().toISOString(), source: 'local' });
    saveLocal();
    form.reset();
    $('#msg-count').textContent = '0 / 5000';
    statusEl.textContent = 'Server unreachable — enquiry saved to the local queue on this device.';
    statusEl.className = 'bad';
    renderQueue();
  }
  btn.disabled = false;
});

window.addEventListener('scroll', () => {
  $('#to-top').classList.toggle('show', window.scrollY > 600);
  $('.topbar').classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });
$('#to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

$('#year').textContent = new Date().getFullYear();
fetchQueue();
