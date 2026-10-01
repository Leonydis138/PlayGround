/* Empower v4.0 — auctions, live events, stores, rewards/XP, AI concierge, palette, compare, alerts, settings. */
(function () {
'use strict';
if (window.__empowerV4) return; window.__empowerV4 = true;

var LEVELS = [
  { xp: 0, name: 'Bronze', emoji: '🥉' }, { xp: 200, name: 'Silver', emoji: '🥈' },
  { xp: 500, name: 'Gold', emoji: '🥇' }, { xp: 1000, name: 'Platinum', emoji: '💎' },
  { xp: 2000, name: 'Diamond', emoji: '👑' }
];
var BADGES = [
  { id: 'first-buy', icon: '🛍️', name: 'First order', desc: 'Place your first order' },
  { id: 'seller', icon: '📦', name: 'Seller', desc: 'Publish a listing' },
  { id: 'coach-book', icon: '🎓', name: 'Coached', desc: 'Book a session' },
  { id: 'reviewer', icon: '⭐', name: 'Reviewer', desc: 'Post 3 reviews' },
  { id: 'social', icon: '💬', name: 'Community voice', desc: 'Post in community' },
  { id: 'bidder', icon: '🔨', name: 'Bidder', desc: 'Bid in an auction' },
  { id: 'winner', icon: '🏆', name: 'Auction winner', desc: 'Win an auction' },
  { id: 'learner', icon: '🎬', name: 'Learner', desc: 'Finish a course' },
  { id: 'streak3', icon: '🔥', name: 'On fire', desc: '3-day streak' },
  { id: 'plus', icon: '★', name: 'Plus member', desc: 'Join Empower Plus' }
];
var XP_TABLE = { purchase: 30, listing: 25, booking: 20, review: 10, post: 8, bid: 5, win: 50, enroll: 12, rsvp: 6, referral: 40, dispute: 2 };

function $(s) { return document.querySelector(s); }
function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function uid(p) { return p + '-' + Math.floor(1000 + Math.random() * 9000); }
function dayKey(d) { d = d || new Date(); return d.toISOString().slice(0, 10); }

/* ---------- state ---------- */
function ensureV4() {
  var now = Date.now();
  if (!Array.isArray(S.auctions)) {
    S.auctions = [
      { id: 'a1', pid: 'p1', start: 95, endsAt: now + 2.4 * 3600 * 1000, bids: [{ n: 'Lena', amt: 102, t: '10m' }, { n: 'Tom', amt: 110, t: '4m' }], watched: true },
      { id: 'a2', pid: 'p4', start: 40, endsAt: now + 5.1 * 3600 * 1000, bids: [{ n: 'Ava', amt: 44, t: '1h' }], watched: false },
      { id: 'a3', pid: 'p8', start: 50, endsAt: now + 45 * 60 * 1000, bids: [{ n: 'Kai', amt: 58, t: '12m' }, { n: 'Mia', amt: 64, t: '2m' }], watched: false },
      { id: 'a4', pid: 'p10', start: 70, endsAt: now + 26 * 3600 * 1000, bids: [], watched: false },
      { id: 'a5', pid: 'p12', start: 30, endsAt: now + 9 * 3600 * 1000, bids: [{ n: 'Leo', amt: 33, t: '30m' }], watched: false }
    ];
  }
  if (!Array.isArray(S.events)) {
    S.events = [
      { id: 'e1', title: 'Flash Leather Drop — Maya live', host: 'Maya Atelier', kind: 'shopping', startsAt: now + 35 * 60 * 1000, live: true, viewers: 842, price: 0, img: '👜', desc: 'New tote colors, subscriber-only prices, live Q&A. First 50 buyers get a free charm.' },
      { id: 'e2', title: '0 → $10k Store Workshop', host: 'Alex Morgan', kind: 'workshop', startsAt: now + 3 * 3600 * 1000, live: false, viewers: 0, price: 15, img: '🚀', desc: '90-min build-along: offer, page, ads. Worksheet + replay included.' },
      { id: 'e3', title: 'Ask a CFA anything', host: 'Marcus Lee', kind: 'ama', startsAt: now + 26 * 3600 * 1000, live: false, viewers: 0, price: 0, img: '📈', desc: 'Pricing, taxes, bookkeeping for sellers. Bring your numbers.' },
      { id: 'e4', title: 'Ceramics glaze reveal', host: 'Kiln & Co', kind: 'shopping', startsAt: now + 50 * 3600 * 1000, live: false, viewers: 0, price: 0, img: '☕', desc: 'New glaze line, seconds sale, studio tour.' },
      { id: 'e5', title: 'Portfolio roast (live critiques)', host: 'Diego Ruiz', kind: 'workshop', startsAt: now + 74 * 3600 * 1000, live: false, viewers: 0, price: 10, img: '🎨', desc: '6 portfolios roasted live. Submit yours when you RSVP.' }
    ];
  }
  if (typeof S.xp !== 'number') S.xp = 120;
  if (!Array.isArray(S.badges)) S.badges = [];
  if (!S.streak) S.streak = { days: 1, last: dayKey() };
  if (!S.quests || S.quests.date !== dayKey()) S.quests = { date: dayKey(), done: [] };
  if (!Array.isArray(S.compare)) S.compare = [];
  if (!Array.isArray(S.alerts)) S.alerts = [];
  if (!Array.isArray(S.viewed)) S.viewed = [];
  if (!Array.isArray(S.searchHist)) S.searchHist = [];
  if (!Array.isArray(S.addresses)) S.addresses = [S.user.address, '456 Hill Country Ln, Austin TX'];
  if (!Array.isArray(S.payMethods)) S.payMethods = ['💳 Visa •• 4242', '🏦 Bank •• 6789'];
  if (!S.notifPrefs) S.notifPrefs = { deals: true, auctions: true, priceDrops: true, liveEvents: true, community: false };
  if (!S.rsvps) S.rsvps = [];
  if (!S.spin || S.spin.date !== dayKey()) S.spin = { date: dayKey(), done: false };
  if (typeof S.reviewsGiven !== 'number') {
    var n = 0; Object.keys(S.reviews || {}).forEach(function (k) { n += S.reviews[k].length; }); S.reviewsGiven = n;
  }
  // streak bump
  var tk = dayKey();
  if (S.streak.last !== tk) {
    var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    S.streak.days = (S.streak.last === y) ? S.streak.days + 1 : 1;
    S.streak.last = tk;
    if (S.streak.days >= 3) unlock('streak3');
    setTimeout(function () { toast('🔥 ' + S.streak.days + '-day streak! Keep earning XP', 'ok'); }, 2500);
  }
  try { save(); } catch (e) {}
}
function addXP(kind, n) {
  var amt = (n != null) ? n : (XP_TABLE[kind] || 5);
  S.xp = (S.xp || 0) + amt;
  try { save(); } catch (e) {}
  var bar = $('#xpBar'); if (bar && $('#view-rewards').classList.contains('active')) renderRewards();
  return amt;
}
function level() {
  var lv = LEVELS[0], idx = 0;
  LEVELS.forEach(function (l, i) { if ((S.xp || 0) >= l.xp) { lv = l; idx = i; } });
  var next = LEVELS[idx + 1] || null;
  return { cur: lv, idx: idx, next: next };
}
function unlock(id) {
  if (S.badges.indexOf(id) >= 0) return false;
  S.badges.push(id);
  var b = BADGES.filter(function (x) { return x.id === id; })[0];
  try { save(); } catch (e) {}
  notify('🏅 Badge unlocked: ' + (b ? b.name : id));
  toast('🏅 Badge: ' + (b ? b.name : id) + '!', 'ok');
  addXP('bonus', 15);
  return true;
}

/* ---------- nav extension ---------- */
function extendNav() {
  try {
    ['auctions', 'live', 'stores', 'rewards', 'settings'].forEach(function (v) { if (VIEWS.indexOf(v) < 0) VIEWS.push(v); });
  } catch (e) {}
  var _nav = window.nav;
  window.nav = nav = function (name) {
    if (VIEWS.indexOf(name) < 0) name = 'marketplace';
    $all('#mainNav button').forEach(function (b) { b.classList.toggle('active', b.dataset.nav === name); });
    $all('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
    $all('#bottomNav button').forEach(function (b) { b.classList.toggle('on', b.dataset.nav === name); });
    var navEl = $('#mainNav'); if (navEl) navEl.classList.remove('open');
    try { if (location.hash !== '#/' + name) history.replaceState(null, '', '#/' + name); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      if (name === 'dashboard' && window.renderDashboard) renderDashboard();
      if (name === 'wallet' && window.renderWallet) renderWallet();
      if (name === 'orders' && window.renderOrders) renderOrders();
      if (name === 'sell' && window.renderSell) renderSell();
      if (name === 'wishlist' && window.renderWishlist) renderWishlist();
      if (name === 'coaches' && window.renderCoaches) renderCoaches();
      if (name === 'marketplace' && window.renderMarket) renderMarket();
      if (name === 'deals' && window.renderDeals) renderDeals();
      if (name === 'services' && window.renderServices) renderServices();
      if (name === 'learn' && window.renderLearn) renderLearn();
      if (name === 'community' && window.renderCommunity) renderCommunity();
      if (name === 'inbox' && window.renderInbox) renderInbox();
      if (name === 'auctions') renderAuctions();
      if (name === 'live') renderLive();
      if (name === 'stores') renderStores();
      if (name === 'rewards') renderRewards();
      if (name === 'settings') renderSettings();
    } catch (e) {}
  };
  try {
    var _ra = window.renderAll;
    window.renderAll = renderAll = function () {
      try { _ra(); } catch (e) {}
      try { renderAuctions(); renderLive(); renderStores(); renderRewards(); renderSettings(); syncBottom(); tickAll(); } catch (e) {}
    };
  } catch (e) {}
}
function syncBottom() {
  var h = (location.hash || '').replace('#/', '') || 'marketplace';
  $all('#bottomNav button').forEach(function (b) { b.classList.toggle('on', b.dataset.nav === h); });
}

/* ---------- auctions ---------- */
function topBid(a) { if (!a.bids.length) return a.start; return Math.max.apply(null, a.bids.map(function (b) { return b.amt; })); }
function fmtLeft(ms) {
  if (ms <= 0) return 'ENDED';
  var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + String(s).padStart(2, '0') + 's';
  return s + 's';
}
function renderAuctions() {
  var g = $('#auctionGrid'); if (!g) return;
  var now = Date.now();
  S.auctions.forEach(function (a) { if (a.endsAt < now - 3600000 && !a.settled) settleAuction(a); });
  var onlyW = $('#auctionWatchToggle') && $('#auctionWatchToggle').checked;
  var sort = ($('#auctionSort') || {}).value || 'ending';
  var list = S.auctions.filter(function (a) { return !onlyW || a.watched; });
  var sm = {
    ending: function (a, b) { return a.endsAt - b.endsAt; },
    bids: function (a, b) { return b.bids.length - a.bids.length; },
    'price-asc': function (a, b) { return topBid(a) - topBid(b); },
    'price-desc': function (a, b) { return topBid(b) - topBid(a); }
  };
  list = list.slice().sort(sm[sort] || sm.ending);
  var live = S.auctions.filter(function (a) { return a.endsAt > now; }).length;
  $('#auctionCount').textContent = live + ' live';
  var cats = ['All'].concat(Array.from(new Set(S.auctions.map(function (a) { var p = S.products.find(function (x) { return x.id === a.pid; }); return p ? p.category : null; }).filter(Boolean))));
  $('#auctionPills').innerHTML = cats.map(function (c) { return '<button class="' + ((S.auctionCat || 'All') === c ? 'active' : '') + '" data-ac="' + c + '">' + c + '</button>'; }).join('');
  $all('#auctionPills button').forEach(function (b) { b.onclick = function () { S.auctionCat = b.dataset.ac; save(); renderAuctions(); }; });
  if (S.auctionCat && S.auctionCat !== 'All') list = list.filter(function (a) { var p = S.products.find(function (x) { return x.id === a.pid; }); return p && p.category === S.auctionCat; });
  g.innerHTML = list.map(function (a) {
    var p = S.products.find(function (x) { return x.id === a.pid; }); if (!p) return '';
    var t = topBid(a), left = a.endsAt - now, hot = left < 3600000;
    var lead = a.bids.length && a.bids[a.bids.length - 1].n === S.user.name.split(' ')[0];
    return '<div class="product"><div class="p-img"><span class="badge">🔨 Auction</span>' +
      '<button class="heart' + (a.watched ? ' on' : '') + '" data-aw="' + a.id + '">' + (a.watched ? '♥' : '♡') + '</button><span style="font-size:56px">' + esc(p.img) + '</span></div>' +
      '<div class="p-body"><h4>' + esc(p.title) + '</h4>' +
      '<div class="seller">by ' + esc(p.seller) + ' • ' + a.bids.length + ' bids</div>' +
      '<div class="p-meta"><span class="price">' + money(t) + ' <small>top bid</small></span><span class="auction-timer' + (hot ? ' hot' : '') + '" data-at="' + a.id + '">⏳ ' + fmtLeft(left) + '</span></div>' +
      (lead ? '<span class="tag ok">You lead ✓</span>' : (a.bids.length ? '<span class="tag warn">Outbid — bid again</span>' : '<span class="tag info">Opening at ' + money(a.start) + '</span>')) +
      '<div class="bid-hist">' + a.bids.slice(-3).reverse().map(function (b) { return esc(b.n) + ' • ' + money(b.amt); }).join('<br />') + '</div>' +
      '<div class="p-actions"><button class="btn primary" data-bid="' + a.id + '">Bid ' + money(t + 1) + ' →</button><button class="btn" data-aview="' + a.id + '">View</button></div></div></div>';
  }).join('') || '<div class="card empty"><span class="big">🔨</span><b>No auctions here</b></div>';
  $all('#auctionGrid [data-bid]').forEach(function (b) { b.onclick = function () { bidModal(b.dataset.bid); }; });
  $all('#auctionGrid [data-aw]').forEach(function (b) { b.onclick = function () { var a = S.auctions.find(function (x) { return x.id === b.dataset.aw; }); a.watched = !a.watched; save(); renderAuctions(); }; });
  $all('#auctionGrid [data-aview]').forEach(function (b) { b.onclick = function () { var a = S.auctions.find(function (x) { return x.id === b.dataset.aview; }); if (a) viewProduct(a.pid); }; });
}
function bidModal(aid) {
  var a = S.auctions.find(function (x) { return x.id === aid; }); if (!a) return;
  var p = S.products.find(function (x) { return x.id === a.pid; });
  var t = topBid(a);
  openModal('<h3>🔨 ' + esc(p.title) + '</h3><p class="muted small">Top bid <b>' + money(t) + '</b> • ' + a.bids.length + ' bids • ends in <b class="auction-timer" data-at="' + a.id + '">' + fmtLeft(a.endsAt - Date.now()) + '</b></p>' +
    '<div class="row2"><button class="btn" data-bump="1">+' + money(1) + '</button><button class="btn" data-bump="5">+' + money(5) + '</button></div>' +
    '<label style="margin-top:8px">Your max bid<input id="bidAmt" type="number" value="' + (t + 5) + '" min="' + (t + 1) + '" /></label>' +
    '<button class="btn primary block" id="bidGo">Place bid →</button><p class="muted small">Balance ' + ec(S.user.balance) + ' must cover your bid. Outbid? We notify + refund the hold instantly.</p>');
  $all('#modalRoot [data-bump]').forEach(function (b) { b.onclick = function () { $('#bidAmt').value = Number($('#bidAmt').value) + Number(b.dataset.bump); }; });
  $('#bidGo').onclick = function () { placeBid(aid, Number($('#bidAmt').value)); };
}
function placeBid(aid, amt) {
  var a = S.auctions.find(function (x) { return x.id === aid; }); if (!a) return;
  var t = topBid(a);
  if (!amt || amt < t + 1) { toast('Bid at least ' + money(t + 1), 'err'); return; }
  if (S.user.balance < amt) { toast('Insufficient balance — add funds', 'err'); closeModal(); nav('wallet'); return; }
  var me = S.user.name.split(' ')[0];
  a.bids.push({ n: me, amt: amt, t: 'now' });
  addXP('bid'); unlock('bidder');
  notify('You bid ' + money(amt) + ' — ' + (S.products.find(function (x) { return x.id === a.pid; }) || {}).title + '.');
  save(); closeModal(); renderAuctions(); tickAll();
  toast('Bid placed! You lead 🔨', 'ok');
  // rival outbid simulation
  setTimeout(function () {
    if (Math.random() < 0.55 && a.endsAt > Date.now()) {
      var names = ['Lena', 'Tom', 'Ava', 'Kai'];
      var rb = amt + 1 + Math.floor(Math.random() * 6);
      a.bids.push({ n: names[Math.floor(Math.random() * names.length)], amt: rb, t: 'now' });
      notify('Outbid! Now ' + money(rb) + ' — bid again?');
      save(); if ($('#view-auctions').classList.contains('active')) renderAuctions(); tickAll();
    }
  }, 9000 + Math.random() * 9000);
}
function settleAuction(a) {
  a.settled = true;
  var p = S.products.find(function (x) { return x.id === a.pid; });
  var me = S.user.name.split(' ')[0];
  var last = a.bids[a.bids.length - 1];
  if (last && last.n === me && p) {
    S.user.balance -= last.amt;
    S.orders.unshift({ id: uid('ORD'), title: '🏆 Won: ' + p.title, img: p.img, qty: 1, total: last.amt, status: 'Processing', kind: 'bought', date: 'Today', step: 0 });
    S.txs.unshift({ t: 'Auction win — ' + p.title, a: -last.amt, d: 'Today', k: 'out' });
    unlock('winner'); addXP('win');
    notify('🏆 You won "' + p.title + '" for ' + money(last.amt) + '!');
  }
  save();
}
window.placeBid = placeBid;

/* ---------- live events ---------- */
function renderLive() {
  var tab = S.liveTab || 'all';
  $all('#liveTabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.lv === tab); b.onclick = function () { S.liveTab = b.dataset.lv; save(); renderLive(); }; });
  var now = Date.now();
  var live = S.events.filter(function (e) { return e.live || (e.startsAt < now && e.startsAt > now - 3600000); })[0];
  $('#liveNowBox').innerHTML = live
    ? '<div><span class="live-dot"></span> <b>LIVE NOW — ' + esc(live.title) + '</b><div class="muted small">' + esc(live.host) + ' • ' + live.viewers.toLocaleString() + ' watching • ' + esc(live.desc) + '</div></div><button class="btn primary" data-join="' + live.id + '">Join live →</button>'
    : '<div><b>No one is live right now</b><div class="muted small">RSVP below — we will ping you 10 min before showtime.</div></div><button class="btn" data-nav="deals">Browse deals meanwhile</button>';
  var list = S.events.filter(function (e) { return tab === 'all' || e.kind === tab; });
  $('#liveGrid').innerHTML = list.map(function (e) {
    var rsvp = S.rsvps.indexOf(e.id) >= 0;
    var when = e.live ? 'LIVE NOW' : new Date(e.startsAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return '<div class="coach-card live-card"><div class="coach-top"><div class="coach-av">' + e.img + '</div><div><b>' + esc(e.title) + '</b><div class="muted small">' + esc(e.host) + ' • ' + when + ' • ' + esc(e.kind) + (e.price ? ' • ' + money(e.price) : ' • free') + '</div></div>' +
      (e.live ? '<span class="live-viewers">🔴 ' + e.viewers.toLocaleString() + '</span>' : '') + '</div>' +
      '<div style="padding:0 16px 16px"><p class="muted small">' + esc(e.desc) + '</p>' +
      '<div style="display:flex;gap:8px"><button class="btn primary small" style="flex:1" data-rsvp="' + e.id + '">' + (rsvp ? '✓ RSVP’d — Join' : (e.price ? 'RSVP — ' + money(e.price) : 'RSVP free')) + '</button>' +
      (rsvp ? '<button class="btn small" data-unrsvp="' + e.id + '">Cancel</button>' : '') + '</div></div></div>';
  }).join('');
  $all('#liveNowBox [data-join]').forEach(function (b) { b.onclick = function () { joinLive(b.dataset.join); }; });
  $all('#liveGrid [data-rsvp]').forEach(function (b) { b.onclick = function () { rsvpEvent(b.dataset.rsvp); }; });
  $all('#liveGrid [data-unrsvp]').forEach(function (b) { b.onclick = function () { S.rsvps = S.rsvps.filter(function (x) { return x !== b.dataset.unrsvp; }); save(); renderLive(); }; });
}
function rsvpEvent(id) {
  var e = S.events.find(function (x) { return x.id === id; }); if (!e) return;
  if (S.rsvps.indexOf(id) >= 0) { joinLive(id); return; }
  if (e.price && S.user.balance < e.price) { toast('Insufficient balance', 'err'); nav('wallet'); return; }
  if (e.price) { S.user.balance -= e.price; S.txs.unshift({ t: 'Event RSVP — ' + e.title, a: -e.price, d: 'Today', k: 'out' }); }
  S.rsvps.push(id); addXP('rsvp');
  notify('RSVP confirmed: ' + e.title);
  save(); renderLive(); updateWalletUI(); joinLive(id);
}
function joinLive(id) {
  var e = S.events.find(function (x) { return x.id === id; }); if (!e) return;
  var msgs = [{ n: e.host, t: 'Welcome everyone! Drop where you are watching from 👇' }, { n: 'Lena', t: 'Austin here — show the new colors!' }];
  openModal('<h3><span class="live-dot"></span> ' + esc(e.title) + '</h3><p class="muted small">' + esc(e.host) + ' • ' + (e.viewers || 300).toLocaleString() + ' watching</p>' +
    '<div class="p-img" style="border-radius:14px;height:150px;font-size:64px">' + e.img + '<span class="live-viewers">🔴 LIVE</span></div>' +
    '<div class="chat" id="liveChat">' + msgs.map(function (m) { return '<div class="bubble"><b>' + esc(m.n) + '</b> ' + esc(m.t) + '</div>'; }).join('') + '</div>' +
    '<div style="display:flex;gap:8px"><input id="liveIn" placeholder="Chat…" /><button class="btn primary" id="liveSend">Send</button></div>' +
    '<button class="btn block" style="margin-top:8px" onclick="closeModal()">Leave stream</button>', true);
  $('#liveSend').onclick = function () {
    var v = $('#liveIn').value.trim(); if (!v) return;
    $('#liveChat').insertAdjacentHTML('beforeend', '<div class="bubble me"><b>You</b> ' + esc(v) + '</div>');
    $('#liveIn').value = '';
    setTimeout(function () { var c = $('#liveChat'); if (c) c.insertAdjacentHTML('beforeend', '<div class="bubble"><b>' + esc(e.host) + '</b> Great Q! Answering live now 🙌</div>'); }, 1200);
  };
}

/* ---------- stores directory ---------- */
function storeStats() {
  var map = {};
  S.products.forEach(function (p) {
    if (p.paused) return;
    map[p.seller] = map[p.seller] || { name: p.seller, items: 0, sold: 0, rating: p.rating || 4.8, img: p.img };
    map[p.seller].items++; map[p.seller].sold += p.sold || 0;
  });
  (S.gigs || []).forEach(function (g) {
    map[g.seller] = map[g.seller] || { name: g.seller, items: 0, sold: 0, rating: g.rating || 4.9, img: g.img };
    map[g.seller].sold += g.orders || 0;
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}
function renderStores() {
  var g = $('#storeGrid'); if (!g) return;
  var sort = ($('#storeSort') || {}).value || 'sold';
  var list = storeStats();
  var sm = { sold: function (a, b) { return b.sold - a.sold; }, rating: function (a, b) { return b.rating - a.rating; }, items: function (a, b) { return b.items - a.items; } };
  list = list.sort(sm[sort] || sm.sold);
  g.innerHTML = list.map(function (s) {
    var f = (S.following || []).indexOf(s.name) >= 0;
    return '<div class="card store-card"><div class="store-av">' + esc(s.img) + '</div><b>' + esc(s.name) + '</b> <span class="tag ok">✓</span>' +
      '<div class="muted small">★ ' + s.rating + ' • ' + s.items + ' listings • ' + s.sold.toLocaleString() + ' sold</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn small" style="flex:1" data-st-fol="' + esc(s.name) + '">' + (f ? 'Following ✓' : 'Follow') + '</button>' +
      '<button class="btn small primary" style="flex:1" data-st-visit="' + esc(s.name) + '">Visit →</button></div></div>';
  }).join('');
  $all('#storeGrid [data-st-fol]').forEach(function (b) { b.onclick = function () { var n = b.dataset.stFol; var i = S.following.indexOf(n); if (i >= 0) S.following.splice(i, 1); else S.following.push(n); save(); renderStores(); }; });
  $all('#storeGrid [data-st-visit]').forEach(function (b) { b.onclick = function () { sellerStore(b.dataset.stVisit); }; });
}

/* ---------- rewards ---------- */
function renderRewards() {
  var lv = level();
  $('#levelEmoji').textContent = lv.cur.emoji;
  $('#levelName').textContent = lv.cur.name + ' • Level ' + (lv.idx + 1);
  $('#xpLabel').textContent = (S.xp || 0) + ' XP total';
  var pct = lv.next ? Math.round(((S.xp - lv.cur.xp) / (lv.next.xp - lv.cur.xp)) * 100) : 100;
  $('#xpBar').style.width = Math.min(100, pct) + '%';
  $('#xpNext').textContent = lv.next ? (lv.next.xp - S.xp) + ' XP to ' + lv.next.name : 'Max level — legend status 👑';
  $('#streakChip').textContent = '🔥 ' + (S.streak.days || 1) + '-day streak';
  $('#badgeRow').innerHTML = BADGES.map(function (b) {
    var has = S.badges.indexOf(b.id) >= 0;
    return '<span class="badge' + (has ? '' : ' locked') + '" title="' + esc(b.name + ' — ' + b.desc) + '">' + b.icon + '</span>';
  }).join('');
  var bots = [{ n: 'Maya Atelier', xp: 1840 }, { n: 'Coach Priya', xp: 1420 }, { n: 'SoundLab', xp: 980 }, { n: 'Lena K.', xp: 640 }];
  var rows = bots.concat([{ n: S.user.name + ' (you)', xp: S.xp || 0, me: true }]).sort(function (a, b) { return b.xp - a.xp; });
  $('#leaderList').innerHTML = rows.map(function (r, i) {
    return '<div class="list-row"><div class="thumb">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅') + '</div><div class="grow"><b>' + esc(r.n) + '</b><span>' + r.xp + ' XP</span></div>' + (r.me ? '<span class="tag ok">you</span>' : '') + '</div>';
  }).join('');
  var quests = [
    { id: 'q-buy', icon: '🛍️', t: 'Add anything to cart', xp: 5, done: (S.cart || []).length > 0 },
    { id: 'q-list', icon: '📦', t: 'Publish or edit a listing', xp: 25, done: S.products.some(function (p) { return p.mine; }) },
    { id: 'q-coach', icon: '🎓', t: 'Book or message a coach', xp: 20, done: (S.bookings || []).length > 1 || Object.keys(S.messages || {}).length > 0 },
    { id: 'q-review', icon: '⭐', t: 'Post a review', xp: 10, done: (S.reviewsGiven || 0) >= 3 },
    { id: 'q-post', icon: '💬', t: 'Post in community', xp: 8, done: S.posts.some(function (p) { return p.author === S.user.name; }) },
    { id: 'q-bid', icon: '🔨', t: 'Bid in an auction', xp: 5, done: S.auctions.some(function (a) { return a.bids.some(function (b) { return b.n === S.user.name.split(' ')[0]; }); }) },
    { id: 'q-rsvp', icon: '📡', t: 'RSVP to a live event', xp: 6, done: (S.rsvps || []).length > 0 }
  ];
  $('#questList').innerHTML = quests.map(function (q) {
    var claimed = (S.quests.done || []).indexOf(q.id) >= 0;
    return '<div class="quest"><span style="font-size:22px">' + q.icon + '</span><div class="grow"><b>' + esc(q.t) + '</b><span>+' + q.xp + ' XP' + (q.done ? ' • done ✓' : '') + '</span></div>' +
      (claimed ? '<span class="tag ok">claimed</span>' : (q.done ? '<button class="btn small primary" data-claim="' + q.id + '|' + q.xp + '">Claim</button>' : '<span class="tag">todo</span>')) + '</div>';
  }).join('');
  $all('#questList [data-claim]').forEach(function (b) { b.onclick = function () { var p = b.dataset.claim.split('|'); S.quests.done.push(p[0]); addXP('quest', Number(p[1])); save(); renderRewards(); toast('+' + p[1] + ' XP claimed!', 'ok'); }; });
}

/* ---------- settings ---------- */
function renderSettings() {
  if (!$('#setName')) return;
  if (!renderSettings._fill) {
    $('#setName').value = S.user.name; $('#setEmoji').value = S.user.emoji || '🧑‍🚀';
    $('#setEmail').value = S.user.email; $('#setAddr').value = S.user.address;
    $('#setCurrency').value = S.user.currency || 'USD'; $('#setTheme').value = S.theme || 'dark';
    renderSettings._fill = true;
  }
  $('#payList').innerHTML = S.payMethods.map(function (p, i) { return '<div>' + esc(p) + ' <button class="linklike" data-delpay="' + i + '">remove</button></div>'; }).join('');
  $all('#payList [data-delpay]').forEach(function (b) { b.onclick = function () { S.payMethods.splice(Number(b.dataset.delpay), 1); save(); renderSettings._fill = false; renderSettings(); }; });
  $('#addrList').innerHTML = S.addresses.map(function (a, i) { return '<div class="list-row"><div class="grow"><b>' + esc(a) + '</b>' + (i === 0 ? '<span>default</span>' : '') + '</div><button class="btn small" data-mkdef="' + i + '">Default</button><button class="btn small danger" data-deladdr="' + i + '">✕</button></div>'; }).join('');
  $all('#addrList [data-mkdef]').forEach(function (b) { b.onclick = function () { var a = S.addresses.splice(Number(b.dataset.mkdef), 1)[0]; S.addresses.unshift(a); S.user.address = a; save(); renderSettings._fill = false; renderSettings(); }; });
  $all('#addrList [data-deladdr]').forEach(function (b) { b.onclick = function () { if (S.addresses.length <= 1) { toast('Keep at least one address', 'err'); return; } S.addresses.splice(Number(b.dataset.deladdr), 1); save(); renderSettings._fill = false; renderSettings(); }; });
  var prefs = [['deals', 'Flash deals'], ['auctions', 'Auction outbids'], ['priceDrops', 'Price drops'], ['liveEvents', 'Live events'], ['community', 'Community replies']];
  $('#notifPrefs').innerHTML = prefs.map(function (p) { return '<label class="check" style="margin-bottom:8px"><input type="checkbox" data-pref="' + p[0] + '"' + (S.notifPrefs[p[0]] ? ' checked' : '') + ' /> ' + p[1] + '</label>'; }).join('');
  $all('#notifPrefs [data-pref]').forEach(function (c) { c.onchange = function () { S.notifPrefs[c.dataset.pref] = c.checked; save(); toast('Preferences saved', 'ok'); }; });
}

/* ---------- AI concierge ---------- */
var AI_CHIPS = ['Gift under $50 🎁', 'Grow my store 📈', 'Get fit 💪', 'Find a cheap gig 💸', 'What coupon works? 🏷️'];
function openAi() { renderAiChips(); if (!$('#aiChat').dataset.init) { aiSay('Hey ' + S.user.name.split(' ')[0] + '! I\'m your Empower concierge. Tell me a goal + budget and I\'ll pick the best product, gig, coach or course.'); $('#aiChat').dataset.init = '1'; } $('#aiDrawer').classList.add('open'); $('#overlay').classList.add('show'); setTimeout(function () { $('#aiInput').focus(); }, 200); }
function closeAi() { $('#aiDrawer').classList.remove('open'); if (!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show'); }
function renderAiChips() { $('#aiChips').innerHTML = AI_CHIPS.map(function (c) { return '<button data-chip="' + esc(c) + '">' + esc(c) + '</button>'; }).join(''); $all('#aiChips [data-chip]').forEach(function (b) { b.onclick = function () { $('#aiInput').value = b.dataset.chip; askAi(); }; }); }
function aiSay(t, html) {
  var c = $('#aiChat');
  c.insertAdjacentHTML('beforeend', '<div class="bubble"><b>✨ AI</b><br />' + (html ? t : esc(t)) + '</div>');
  c.scrollTop = c.scrollHeight;
}
function aiUser(t) { var c = $('#aiChat'); c.insertAdjacentHTML('beforeend', '<div class="bubble me">' + esc(t) + '</div>'); c.scrollTop = c.scrollHeight; }
function recCard(kind, title, sub, action, id) {
  return '<div class="ai-rec"><b>' + esc(title) + '</b><br /><small class="muted">' + esc(sub) + '</small><br /><button class="btn small primary" style="margin-top:6px" data-ai-' + kind + '="' + id + '">' + esc(action) + '</button></div>';
}
function askAi() {
  var inp = $('#aiInput'); var q = (inp.value || '').trim(); if (!q) return;
  aiUser(q); inp.value = '';
  S.searchHist.unshift(q); S.searchHist = S.searchHist.slice(0, 10); save();
  var l = q.toLowerCase();
  var budget = null; var m = l.match(/under\s*\$?(\d+)/) || l.match(/\$(\d+)/);
  if (m) budget = Number(m[1]);
  var out = '';
  if (/coupon|promo|discount|code/.test(l)) {
    aiSay('Best codes right now: EMPOWER10 (10% off), WELCOME15 (15%), PLUS25 (Plus members). Plus stacking gets you up to 15% extra. Want me to apply EMPOWER10?', true);
    out += recCard('go', 'Apply EMPOWER10', 'One tap, instant savings', 'Apply code →', 'EMPOWER10');
  } else if (/ship|deliver|return|refund|escrow/.test(l)) {
    aiSay('Shipping is FREE over $75 (always free on Plus). Every order sits in escrow until you confirm delivery — 14-day returns, full refund if it never arrives. Anything specific I can track for you?');
    out += recCard('go', 'Track my latest order', 'Live timeline + invoice', 'Open orders →', 'orders');
  } else if (/sell|store|fee/.test(l)) {
    aiSay('Selling: 0 listing fees, ' + (S.user.plus ? '2% (Plus!)' : '5%') + ' only when you sell, 2-day payouts. Pro tip: real photos sell 3.2× more. Want the 60-second listing flow?');
    out += recCard('go', 'Open Seller Studio', 'Publish in ~60 seconds', 'Start selling →', 'sell');
  } else if (/coach.*(pay|earn|cost)|become.*coach|earn/.test(l) && /coach/.test(l)) {
    aiSay('Coaches keep 90% and average $1,800/mo. Top pick for earning fast: Business + Marketing gigs, then convert buyers into coaching calls.');
    out += recCard('go', 'Launch coach profile (+25 EC)', 'Instant approval in demo', 'Become a coach →', 'become-coach');
  } else {
    var ps = S.products.filter(function (p) { return !p.paused; });
    var gs = S.gigs || [];
    var cs = S.coaches;
    if (budget) { ps = ps.filter(function (p) { return p.price <= budget; }); gs = gs.filter(function (g) { return g.price <= budget; }); }
    var kw = l.replace(/gift|under|for|cheap|best|find|want|need|my|\$\d+|\d+/g, ' ').trim();
    function score(t) { if (!kw) return 1; var s = 0; kw.split(/\s+/).forEach(function (w) { if (w.length > 2 && t.toLowerCase().indexOf(w) >= 0) s += 2; }); return s; }
    var bp = ps.map(function (p) { return { p: p, s: score(p.title + ' ' + p.category + ' ' + p.desc) + p.rating }; }).sort(function (a, b) { return b.s - a.s; })[0];
    var bg = gs.map(function (g) { return { p: g, s: score(g.title + ' ' + g.cat) }; }).sort(function (a, b) { return b.s - a.s; })[0];
    var bc = cs.map(function (c) { return { p: c, s: score(c.name + ' ' + c.specialty + ' ' + c.headline) + c.rating }; }).sort(function (a, b) { return b.s - a.s; })[0];
    aiSay((budget ? 'Under ' + money(budget) + ' — ' : '') + 'here are my top picks for “' + q.slice(0, 60) + '”:');
    if (bp && bp.p) out += recCard('p', bp.p.img + ' ' + bp.p.title, money(bp.p.price) + ' • ★' + bp.p.rating + ' • ' + bp.p.sold + ' sold', 'View product →', bp.p.id);
    if (bg && bg.p) out += recCard('g', bg.p.img + ' ' + bg.p.title, money(bg.p.price) + ' • ★' + bg.p.rating, 'Hire gig →', bg.p.id);
    if (bc && bc.p) out += recCard('c', bc.p.img + ' ' + bc.p.name, bc.p.specialty + ' • ' + money(bc.p.rate) + '/hr', 'Book coach →', bc.p.id);
    if (!out) out = '<div class="muted small">Hmm — try “gift under $50” or “grow my store”.</div>';
  }
  aiSay(out, true);
  $all('#aiChat [data-ai-p]').forEach(function (b) { b.onclick = function () { closeAi(); viewProduct(b.dataset.aiP); }; });
  $all('#aiChat [data-ai-g]').forEach(function (b) { b.onclick = function () { closeAi(); nav('services'); hireGig(b.dataset.aiG); }; });
  $all('#aiChat [data-ai-c]').forEach(function (b) { b.onclick = function () { closeAi(); bookCoach(b.dataset.aiC); }; });
  $all('#aiChat [data-ai-go]').forEach(function (b) {
    b.onclick = function () {
      var v = b.dataset.aiGo; closeAi();
      if (v === 'EMPOWER10') { nav('marketplace'); applyCoupon('EMPOWER10'); openCart(); }
      else nav(v);
    };
  });
}

/* ---------- command palette ---------- */
var palIdx = 0;
function paletteItems(q) {
  q = (q || '').toLowerCase();
  var cmds = [
    { icon: '🛍', t: 'Go to Marketplace', run: function () { nav('marketplace'); } },
    { icon: '🔥', t: 'Go to Flash Deals', run: function () { nav('deals'); } },
    { icon: '🔨', t: 'Go to Auctions', run: function () { nav('auctions'); } },
    { icon: '📡', t: 'Go to Live events', run: function () { nav('live'); } },
    { icon: '🏪', t: 'Go to Stores', run: function () { nav('stores'); } },
    { icon: '🏆', t: 'Go to Rewards', run: function () { nav('rewards'); } },
    { icon: '⚙️', t: 'Go to Settings', run: function () { nav('settings'); } },
    { icon: '◉', t: 'Go to Wallet', run: function () { nav('wallet'); } },
    { icon: '🎁', t: 'Redeem WELCOME10 (+10 EC)', run: function () { nav('wallet'); setTimeout(giftModal, 300); } },
    { icon: '★', t: 'Join Empower Plus', run: function () { plusModal(); } },
    { icon: '🌙', t: 'Toggle light/dark theme', run: function () { $('#themeBtn').click(); } },
    { icon: '✨', t: 'Ask Empower AI', run: function () { openAi(); } }
  ];
  var items = cmds.map(function (c) { return { icon: c.icon, t: c.t, run: c.run }; });
  S.products.filter(function (p) { return !p.paused; }).slice(0, 40).forEach(function (p) {
    items.push({ icon: p.img, t: p.title + ' — ' + money(p.price), run: (function (id) { return function () { viewProduct(id); }; })(p.id) });
  });
  (S.gigs || []).forEach(function (g) { items.push({ icon: g.img, t: 'Gig: ' + g.title, run: (function (id) { return function () { nav('services'); hireGig(id); }; })(g.id) }); });
  S.coaches.forEach(function (c) { items.push({ icon: c.img, t: 'Coach ' + c.name, run: (function (id) { return function () { bookCoach(id); }; })(c.id) }); });
  if (!q) return items.slice(0, 12);
  return items.filter(function (i) { return i.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
}
function openPalette() { $('#paletteRoot').hidden = false; $('#paletteInput').value = ''; drawPalette(''); setTimeout(function () { $('#paletteInput').focus(); }, 50); }
function closePalette() { $('#paletteRoot').hidden = true; }
function drawPalette(q) {
  var items = paletteItems(q); palIdx = 0;
  $('#paletteList').innerHTML = items.map(function (i, k) { return '<button data-pi="' + k + '" class="' + (k === 0 ? 'sel' : '') + '"><span>' + esc(i.icon) + '</span><span>' + esc(i.t) + '</span></button>'; }).join('') || '<div class="muted" style="padding:14px">No matches.</div>';
  $all('#paletteList [data-pi]').forEach(function (b) {
    b.onclick = function () { closePalette(); items[Number(b.dataset.pi)].run(); };
    b.onmousemove = function () { $all('#paletteList button').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); palIdx = Number(b.dataset.pi); };
  });
  $('#paletteList')._items = items;
}

/* ---------- compare + alerts + viewed ---------- */
function injectCompareButtons() {
  if (!$('#productGrid') || $('#productGrid').dataset.cmp) return;
  $('#productGrid').dataset.cmp = '1';
  var obs = new MutationObserver(function () {
    $all('#productGrid .product').forEach(function (card, i) {
      if (card.dataset.cmpDone) return; card.dataset.cmpDone = '1';
      var acts = card.querySelector('.p-actions'); if (!acts) return;
      var b = document.createElement('button');
      b.className = 'btn ghost'; b.title = 'Compare'; b.textContent = '⇄';
      b.style.flex = '0 0 40px';
      b.onclick = function () {
        var id = card.querySelector('[data-view]').dataset.view;
        var k = S.compare.indexOf(id);
        if (k >= 0) S.compare.splice(k, 1); else { if (S.compare.length >= 3) { toast('Compare up to 3 — clear first', 'err'); return; } S.compare.push(id); }
        save(); syncCompare();
      };
      acts.appendChild(b);
    });
  });
  obs.observe($('#productGrid'), { childList: true });
}
function syncCompare() {
  var bar = $('#compareBar'); if (!bar) return;
  bar.hidden = !S.compare.length;
  $('#compareLabel').textContent = S.compare.length + ' selected for compare';
}
function compareModal() {
  var ps = S.compare.map(function (id) { return S.products.find(function (p) { return p.id === id; }); }).filter(Boolean);
  if (!ps.length) return;
  var rows = [['Price', function (p) { return money(p.price); }], ['Rating', function (p) { return '★' + p.rating + ' (' + p.reviews + ')'; }], ['Sold', function (p) { return p.sold.toLocaleString(); }], ['Category', function (p) { return p.category; }], ['Type', function (p) { return p.type; }], ['Stock', function (p) { return p.type === 'Digital' ? '∞' : p.stock; }]];
  openModal('<h3>Compare (' + ps.length + ')</h3><div class="compare-grid"><div></div>' + ps.map(function (p) { return '<div><b>' + esc(p.img) + ' ' + esc(p.title.slice(0, 26)) + '</b></div>'; }).join('') +
    rows.map(function (r) { return '<div class="muted">' + r[0] + '</div>' + ps.map(function (p) { return '<div>' + esc(r[1](p)) + '</div>'; }).join(''); }).join('') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px">' + ps.map(function (p) { return '<button class="btn primary" style="flex:1" data-cmp-add="' + p.id + '">Add to cart</button>'; }).join('') + '</div>', true);
  $all('#modalRoot [data-cmp-add]').forEach(function (b) { b.onclick = function () { addToCart(b.dataset.cmpAdd); }; });
}
function setAlert(pid) {
  var p = S.products.find(function (x) { return x.id === pid; }); if (!p) return;
  openModal('<h3>🔔 Price alert — ' + esc(p.title) + '</h3><p class="muted small">Now ' + money(p.price) + '. We ping you the second it drops.</p>' +
    '<label>Alert me below<input id="alAmt" type="number" value="' + Math.round(p.price * 0.85) + '" /></label>' +
    '<button class="btn primary block" id="alGo">Create alert →</button>');
  $('#alGo').onclick = function () {
    var v = Number($('#alAmt').value);
    if (!v || v <= 0) { toast('Enter a target price', 'err'); return; }
    S.alerts.unshift({ pid: pid, below: v, title: p.title });
    save(); closeModal(); toast('Alert set below ' + money(v) + ' 🔔', 'ok');
  };
}
function checkAlerts() {
  (S.alerts || []).forEach(function (a) {
    var p = S.products.find(function (x) { return x.id === a.pid; });
    if (p && p.price <= a.below && !a.fired && S.notifPrefs.priceDrops) {
      a.fired = true;
      notify('🔔 Price drop: ' + p.title + ' is now ' + money(p.price) + ' (below ' + money(a.below) + ')');
      save();
    }
  });
}
function trackView(pid) {
  S.viewed = [pid].concat(S.viewed.filter(function (x) { return x !== pid; })).slice(0, 8);
  save(); renderViewed();
}
function renderViewed() {
  var anchor = $('#productGrid'); if (!anchor || !S.viewed.length) return;
  if (!$('#viewedStrip')) {
    var d = document.createElement('div');
    d.id = 'viewedStrip'; d.className = 'card-flat'; d.style.marginBottom = '12px';
    anchor.parentNode.insertBefore(d, anchor);
  }
  var el = $('#viewedStrip');
  el.innerHTML = '<b class="small">👁 Recently viewed:</b> ' + S.viewed.map(function (id) { var p = S.products.find(function (x) { return x.id === id; }); return p ? '<button class="btn small" data-vw="' + id + '">' + esc(p.img) + ' ' + esc(p.title.slice(0, 20)) + '</button>' : ''; }).join(' ');
  $all('#viewedStrip [data-vw]').forEach(function (b) { b.onclick = function () { viewProduct(b.dataset.vw); }; });
}

/* ---------- tour ---------- */
var TOUR = [
  { t: 'Welcome to Empower ⚡', x: 'One wallet for shopping, selling, gigs, courses and coaching. 60 seconds — here is the lay of the land.' },
  { t: 'Search + ⌘K', x: 'Press / to search anything, ⌘K for the command palette: jump views, find products, apply coupons.' },
  { t: 'Deals + Auctions', x: 'Flash deals (up to 40% off) and live auctions where the top bid at zero wins. Watch, bid, win.' },
  { t: 'Sell + Coach', x: 'Seller Studio publishes in ~60s with 5% fees. Coaches keep 90%. Both pay out to the same wallet.' },
  { t: 'AI + Rewards', x: 'Hit ✨ for the AI concierge, earn XP + badges for everything, redeem 100 XP = 5 EC. Have fun!' }
];
var tourI = 0;
function startTour() { tourI = 0; $('#tourRoot').hidden = false; drawTour(); }
function drawTour() {
  $('#tourTitle').textContent = (tourI + 1) + '/' + TOUR.length + ' — ' + TOUR[tourI].t;
  $('#tourText').textContent = TOUR[tourI].x;
  $('#tourNext').textContent = tourI === TOUR.length - 1 ? 'Finish 🎉' : 'Next →';
}

/* ---------- tickers ---------- */
function tickAll() {
  var now = Date.now();
  $all('[data-at]').forEach(function (el) {
    var a = S.auctions.find(function (x) { return x.id === el.dataset.at; });
    if (a) el.textContent = '⏳ ' + fmtLeft(a.endsAt - now);
  });
  var ms = Math.max(0, (S.dealsEndsAt || now) - now);
  var str = String(Math.floor(ms / 3600000)).padStart(2, '0') + ':' + String(Math.floor(ms % 3600000 / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms % 60000 / 1000)).padStart(2, '0');
  if ($('#promoTimer')) $('#promoTimer').textContent = str;
  var dt = $('#dealTimer'); if (dt) dt.textContent = '⏳ ' + str + ' left';
}

/* ---------- wiring ---------- */
function wireV4() {
  // promo + bottom + fab + palette + tour
  var pc = $('#promoCoupon'); if (pc) pc.onclick = function () { applyCoupon('EMPOWER10'); openCart(); };
  var pp = $('#promoPlus'); if (pp) pp.onclick = function () { plusModal(); };
  $('#aiFab').onclick = openAi;
  $('#closeAi').onclick = closeAi;
  $('#aiSend').onclick = askAi;
  $('#aiInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') askAi(); });
  $('#paletteInput').addEventListener('input', function (e) { drawPalette(e.target.value); });
  $('#paletteInput').addEventListener('keydown', function (e) {
    var items = $('#paletteList')._items || [];
    if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = Math.min(items.length - 1, palIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palIdx = Math.max(0, palIdx - 1); }
    else if (e.key === 'Enter') { closePalette(); if (items[palIdx]) items[palIdx].run(); return; }
    else return;
    $all('#paletteList button').forEach(function (x, k) { x.classList.toggle('sel', k === palIdx); });
  });
  $('#paletteRoot').addEventListener('click', function (e) { if (e.target.id === 'paletteRoot') closePalette(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#paletteRoot').hidden ? openPalette() : closePalette(); }
    if (e.key === '?' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) shortcutsModal();
  });
  $('#tourNext').onclick = function () { if (tourI >= TOUR.length - 1) { $('#tourRoot').hidden = true; try { localStorage.setItem('empower_tour', '1'); } catch (e) {} } else { tourI++; drawTour(); } };
  $('#tourSkip').onclick = function () { $('#tourRoot').hidden = true; try { localStorage.setItem('empower_tour', '1'); } catch (e) {} };
  var ft = $('#footTour'); if (ft) ft.onclick = function (e) { e.preventDefault(); startTour(); };
  // auctions/live/stores/settings controls
  var aw = $('#auctionWatchToggle'); if (aw) aw.onchange = renderAuctions;
  var as = $('#auctionSort'); if (as) as.onchange = renderAuctions;
  var sab = $('#startAuctionBtn');
  if (sab) sab.onclick = function () {
    var mine = S.products.filter(function (p) { return p.mine && !p.paused; });
    var opts = (mine.length ? mine : S.products.slice(0, 6)).map(function (p) { return '<option value="' + p.id + '">' + esc(p.title) + ' — ' + money(p.price) + '</option>'; }).join('');
    openModal('<h3>List an auction 🔨</h3><label>Product<select id="naPid">' + opts + '</select></label><div class="row2"><label>Starting bid<input id="naStart" type="number" value="20" min="1" /></label><label>Duration<select id="naDur"><option value="1">1 hour</option><option value="6">6 hours</option><option value="24" selected>24 hours</option></select></label></div><button class="btn primary block" id="naGo">Start auction →</button>');
    $('#naGo').onclick = function () {
      S.auctions.unshift({ id: 'a' + Date.now(), pid: $('#naPid').value, start: Number($('#naStart').value) || 10, endsAt: Date.now() + Number($('#naDur').value) * 3600000, bids: [], watched: true });
      addXP('listing'); save(); closeModal(); renderAuctions(); toast('Auction is live! 🔨', 'ok');
    };
  };
  var ss = $('#storeSort'); if (ss) ss.onchange = renderStores;
  // rewards
  var rd = $('#redeemXpBtn');
  if (rd) rd.onclick = function () {
    if ((S.xp || 0) < 100) { toast('Need 100 XP (you have ' + (S.xp || 0) + ')', 'err'); return; }
    S.xp -= 100; S.user.balance += 5;
    S.txs.unshift({ t: 'XP redemption (100 XP)', a: 5, d: 'Today', k: 'in' });
    save(); renderRewards(); updateWalletUI(); toast('+5 EC redeemed! 🎉', 'ok');
  };
  var sp = $('#spinBtn');
  if (sp) sp.onclick = function () {
    if (S.spin.done) { toast('Come back tomorrow for another spin', 'err'); return; }
    S.spin.done = true;
    var win = 1 + Math.floor(Math.random() * 25);
    S.user.balance += win;
    S.txs.unshift({ t: 'Daily spin win', a: win, d: 'Today', k: 'in' });
    addXP('bonus', 5); save(); renderRewards(); updateWalletUI(); toast('🎡 You won ' + win + ' EC!', 'ok');
  };
  // settings
  var sv = $('#setSave');
  if (sv) sv.onclick = function () {
    S.user.name = $('#setName').value.trim() || S.user.name;
    S.user.emoji = $('#setEmoji').value.trim() || S.user.emoji;
    S.user.email = $('#setEmail').value.trim() || S.user.email;
    S.user.address = $('#setAddr').value.trim() || S.user.address;
    S.user.currency = $('#setCurrency').value; S.theme = $('#setTheme').value;
    save(); applyTheme(); try { renderAll(); } catch (e) {}
    renderSettings._fill = false; toast('Settings saved ✓', 'ok');
  };
  var ap = $('#addPayBtn'); if (ap) ap.onclick = function () { var v = $('#newPay').value.trim(); if (!v) return; S.payMethods.push(v); $('#newPay').value = ''; save(); renderSettings._fill = false; renderSettings(); };
  var aa = $('#addAddrBtn'); if (aa) aa.onclick = function () { var v = $('#newAddr').value.trim(); if (!v) return; S.addresses.push(v); $('#newAddr').value = ''; save(); renderSettings._fill = false; renderSettings(); };
  var ej = $('#exportJsonBtn'); if (ej) ej.onclick = function () { var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'empower-backup.json'; a.click(); };
  var ij = $('#importJsonBtn'); if (ij) ij.onclick = function () { $('#importFile').click(); };
  var imf = $('#importFile'); if (imf) imf.onchange = function () {
    var f = imf.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { var d = JSON.parse(r.result); if (!d.products) throw 0; S = d; save(); location.reload(); } catch (e) { toast('Invalid backup file', 'err'); } };
    r.readAsText(f);
  };
  var wp = $('#wipeBtn'); if (wp) wp.onclick = function () { if (!confirm('Wipe ALL local Empower data?')) return; try { localStorage.clear(); } catch (e) {} location.reload(); };
  // compare
  $('#compareGo').onclick = compareModal;
  $('#compareClear').onclick = function () { S.compare = []; save(); syncCompare(); };
  // XP hooks on existing actions
  hookXp();
  injectCompareButtons();
  syncCompare(); syncBottom();
  // PWA
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
  } catch (e) {}
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__pwaEvt = e; toast('📲 Install Empower for the full-screen app', 'ok'); });
  // overlay closes AI too
  var ov = $('#overlay');
  var _ov = ov.onclick;
  ov.onclick = function () { try { if (_ov) _ov(); } catch (e) {} closeAi(); closePalette(); };
  // tour for first-timers
  try { if (!localStorage.getItem('empower_tour') && !location.hash) setTimeout(startTour, 1800); } catch (e) {}
  // live sim v2
  setInterval(liveTick, 22000);
  setInterval(tickAll, 1000);
  // wrap viewProduct for viewed/alerts/compare injection
  wrapProductModal();
}
function shortcutsModal() {
  openModal('<h3>⌨️ Shortcuts</h3><div class="list-row"><div class="grow"><b>/</b><span>Focus search</span></div></div><div class="list-row"><div class="grow"><b>⌘K / Ctrl+K</b><span>Command palette</span></div></div><div class="list-row"><div class="grow"><b>Esc</b><span>Close dialogs</span></div></div><div class="list-row"><div class="grow"><b>?</b><span>This list</span></div></div><button class="btn primary block" onclick="closeModal()">Back to earning →</button>');
}
function hookXp() {
  try {
    var _add = window.addToCart;
    window.addToCart = function (id, silent, qty) { var r = _add(id, silent, qty); try { if (!silent) { addXP('purchase', 2); } } catch (e) {} return r; };
  } catch (e) {}
  try {
    var _bid = document.getElementById('sellForm');
    if (_bid && !_bid.dataset.xp) { _bid.dataset.xp = '1'; _bid.addEventListener('submit', function () { setTimeout(function () { addXP('listing'); unlock('seller'); }, 500); }); }
  } catch (e) {}
  try {
    var cf = document.getElementById('coachForm');
    if (cf && !cf.dataset.xp) { cf.dataset.xp = '1'; cf.addEventListener('submit', function () { setTimeout(function () { addXP('booking'); }, 500); }); }
  } catch (e) {}
}
function wrapProductModal() {
  try {
    var _vp = window.viewProduct;
    window.viewProduct = viewProduct = function (id) {
      _vp(id);
      try { trackView(id); } catch (e) {}
      setTimeout(function () {
        var buy = $('#pvBuy'); if (!buy || $('#pvAlert')) return;
        var row = document.createElement('div');
        row.style.display = 'flex'; row.style.gap = '8px'; row.style.marginBottom = '8px';
        row.innerHTML = '<button class="btn small" id="pvAlert" style="flex:1">🔔 Price alert</button><button class="btn small" id="pvCmp" style="flex:1">⇄ Compare</button>';
        buy.parentNode.insertBefore(row, buy.nextSibling);
        $('#pvAlert').onclick = function () { setAlert(id); };
        $('#pvCmp').onclick = function () { var k = S.compare.indexOf(id); if (k >= 0) S.compare.splice(k, 1); else { if (S.compare.length >= 3) { toast('Max 3 to compare', 'err'); return; } S.compare.push(id); } save(); syncCompare(); toast('Added to compare ⇄', 'ok'); };
      }, 50);
    };
  } catch (e) {}
}
function liveTick() {
  if (document.hidden) return;
  try {
    var roll = Math.random();
    if (roll < 0.3) {
      var live = S.auctions.filter(function (a) { return a.endsAt > Date.now(); });
      if (live.length && S.notifPrefs.auctions) {
        var a = live[Math.floor(Math.random() * live.length)];
        var t = topBid(a) + 1 + Math.floor(Math.random() * 5);
        var names = ['Lena', 'Tom', 'Ava', 'Kai'];
        a.bids.push({ n: names[Math.floor(Math.random() * names.length)], amt: t, t: 'now' });
        notify('🔨 New bid ' + money(t) + ' — ends in ' + fmtLeft(a.endsAt - Date.now()));
        save(); if ($('#view-auctions').classList.contains('active')) renderAuctions(); tickAll();
      }
    } else if (roll < 0.5 && S.notifPrefs.priceDrops) {
      var ps = S.products.filter(function (p) { return !p.paused && p.type === 'Physical' && p.stock > 0; });
      if (ps.length) {
        var p = ps[Math.floor(Math.random() * ps.length)];
        var old = p.price; p.price = Math.max(5, Math.round(p.price * 0.92 * 100) / 100);
        notify('🔔 Price drop: ' + p.title + ' ' + money(old) + ' → ' + money(p.price));
        checkAlerts(); save();
        if ($('#view-marketplace').classList.contains('active')) renderMarket();
      }
    } else if (roll < 0.65) {
      var ev = S.events[Math.floor(Math.random() * S.events.length)];
      if (ev && S.notifPrefs.liveEvents) { notify('📡 Reminder: ' + ev.title + ' is coming up. RSVP to save a seat.'); save(); }
    }
  } catch (e) {}
}

/* ---------- boot ---------- */
ensureV4();
extendNav();
wireV4();
try { renderAuctions(); renderLive(); renderStores(); renderRewards(); renderViewed(); syncCompare(); syncBottom(); tickAll(); } catch (e) {}
try { var h = (location.hash || '').replace('#/', ''); if (h && VIEWS.indexOf(h) >= 0) nav(h); } catch (e) {}
window.EmpowerV4 = { addXP: addXP, unlock: unlock, openAi: openAi, openPalette: openPalette, startTour: startTour };
})();
