/* Empower v3.0 expanded — marketplace + deals + services + learn + community + inbox. Vanilla JS + localStorage. */
const KEY = 'empower_state_v3';
const CATS = ['All','Fashion','Tech','Digital','Art','Wellness','Home','Courses'];
const COUPONS = { EMPOWER10: 0.10, WELCOME15: 0.15, COACH20: 0.20, PLUS25: 0.25 };
const FX = { USD: { r: 1, s: '$' }, EUR: { r: 0.92, s: '€' }, GBP: { r: 0.79, s: '£' } };
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function cur() { try { return (S && S.user && S.user.currency) || 'USD'; } catch (e) { return 'USD'; } }
const money = n => { const c = FX[cur()] || FX.USD; const v = Number(n || 0) * c.r; return c.s + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const ec = n => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' EC';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = p => p + '-' + Math.floor(1000 + Math.random() * 9000);
const today = () => 'Today';

function seed() {
  return {
    v: 3,
    onboarded: false,
    theme: 'dark',
    user: { name: 'Jordan Doe', email: 'jordan@empower.app', balance: 1250, memberSince: '2025', avatar: 'JD', address: '123 Market St, Austin TX', emoji: '🧑‍🚀', currency: 'USD', plus: false, referral: 'JORDAN-2026', invites: 0 },
    dealsEndsAt: Date.now() + 14 * 3600 * 1000,
    deals: [
      { pid: 'p2', pct: 25 }, { pid: 'p5', pct: 30 }, { pid: 'p8', pct: 20 }, { pid: 'p12', pct: 22 },
      { pid: 'p1', pct: 15 }, { pid: 'p6', pct: 35 }
    ],
    gigs: [
      { id: 'g1', title: 'Design a logo + brand kit in 48h', seller: 'Diego Ruiz', price: 120, rating: 4.9, orders: 340, img: '🎨', cat: 'Design', delivery: '2 days', desc: '3 concepts, unlimited revisions, source files + mini brand guide.' },
      { id: 'g2', title: 'Build a 1-page store that converts', seller: 'Aisha Bello', price: 250, rating: 5.0, orders: 190, img: '🚀', cat: 'Marketing', delivery: '5 days', desc: 'Copy, design + checkout setup. Includes analytics + 7-day support.' },
      { id: 'g3', title: '30-min bookkeeping cleanup call', seller: 'Marcus Lee', price: 60, rating: 4.9, orders: 420, img: '📊', cat: 'Finance', delivery: '1 day', desc: 'Fix your books, set up categories, tax-ready checklist included.' },
      { id: 'g4', title: 'Product photos from your phone pics', seller: 'Studio Kline', price: 45, rating: 4.8, orders: 510, img: '📸', cat: 'Design', delivery: '3 days', desc: '10 retouched marketplace-ready photos + 2 lifestyle mockups.' },
      { id: 'g5', title: 'Resume + LinkedIn overhaul', seller: 'Sofia Chen', price: 90, rating: 5.0, orders: 280, img: '💼', cat: 'Career', delivery: '3 days', desc: 'ATS-proof resume, headline + about rewrite, 2 mock questions.' },
      { id: 'g6', title: 'Custom workout + meal plan', seller: 'Priya Nair', price: 55, rating: 5.0, orders: 610, img: '💪', cat: 'Fitness', delivery: '2 days', desc: 'Personalized 4-week plan + video demos + chat check-ins.' }
    ],
    gigRequests: [
      { id: 'r1', title: 'Need wedding invites (50 pcs)', budget: 80, by: 'Lena K.', bids: 4, cat: 'Design' },
      { id: 'r2', title: 'Fix my Shopify checkout drop-off', budget: 200, by: 'Tom R.', bids: 7, cat: 'Marketing' }
    ],
    courses: [
      { id: 'k1', title: 'Store Launch Sprint (7 days)', coach: 'Alex Morgan', price: 149, lessons: ['Pick a winning product', 'Build the page', 'Launch ads', 'Scale to $10k'], progress: 0, enrolled: false, duration: '4h', img: '🤖', rating: 4.9 },
      { id: 'k2', title: 'Content → Clients Engine', coach: 'Aisha Bello', price: 99, lessons: ['Hooks', 'Offers', 'DM scripts', '30-day calendar'], progress: 0, enrolled: true, duration: '3h', img: '📣', rating: 5.0 },
      { id: 'k3', title: 'Money Systems for Sellers', coach: 'Marcus Lee', price: 79, lessons: ['Pricing', 'Bookkeeping', 'Tax setup'], progress: 33, enrolled: true, duration: '2.5h', img: '📈', rating: 4.8 },
      { id: 'k4', title: 'Design Portfolios That Hire', coach: 'Diego Ruiz', price: 119, lessons: ['Case studies', 'Critiques', 'Outreach'], progress: 0, enrolled: false, duration: '3.5h', img: '🎨', rating: 4.9 }
    ],
    posts: [
      { id: 'f1', author: 'Maya Atelier', role: 'Top seller • Fashion', av: '👜', topic: 'Wins', title: 'First $10k month selling totes!', text: '3 things that moved the needle: real photos, replying in <2h, and EMPOWER10 for first buyers. Happy to critique shops below 👇', likes: 214, liked: false, time: '2h', comments: [{ n: 'Jordan', t: 'Congrats! What camera do you use?' }] },
      { id: 'f2', author: 'Tom R.', role: 'New seller', av: '🧑‍💻', topic: 'Questions', title: 'Physical vs digital first product?', text: 'I can build Notion packs fast but physical feels more premium. What would you start with in 2026?', likes: 48, liked: false, time: '5h', comments: [{ n: 'Sofia', t: 'Digital — instant cash, then fund physical.' }] },
      { id: 'f3', author: 'Coach Priya', role: 'Verified coach', av: '🏋️', topic: 'Collabs', title: 'Free form-check Friday (10 slots)', text: 'Drop a video of your squat/deadlift — I will review the first 10 live. Bring a friend, both get 15% off plans 💪', likes: 96, liked: false, time: '1d', comments: [] },
      { id: 'f4', author: 'Kiln & Co', role: 'Home • 560 sold', av: '☕', topic: 'Restocks', title: 'Mug Duo restocked + new glaze', text: '40 sets back in stock after selling out twice. Community gets early access before the flash deal goes live.', likes: 61, liked: false, time: '1d', comments: [] }
    ],
    threads: [
      { id: 't1', from: 'Priya Nair', kind: 'coaches', title: 'Your Oct 5 session', preview: 'Here is your prep checklist…', time: 'Today', unread: 1, msgs: [{ me: false, t: 'Hi Jordan! For Oct 5, bring your food log + 2 goal photos. Excited! 💪' }] },
      { id: 't2', from: 'Empower Support', kind: 'orders', title: 'ORD-1039 shipped', preview: 'Arriving Oct 3 — track here…', time: 'Today', unread: 1, msgs: [{ me: false, t: 'Good news — ORD-1039 left the warehouse. Track it in Orders > Track. Reply here for help.' }] },
      { id: 't3', from: 'Maya Atelier', kind: 'orders', title: 'Thanks for your interest!', preview: 'Tote restock next week…', time: 'Sep 29', unread: 0, msgs: [{ me: false, t: 'Thanks for viewing the Leather Tote! New colors drop next week — want early access?' }] }
    ],
    disputes: [],
    giftCodes: [],
    following: [],
    cart: [{ id: 'p3', qty: 1 }],
    coupon: null,
    wishlist: ['p1'],
    notifs: [
      { t: 'Welcome to Empower! Use code EMPOWER10 for 10% off.', d: 'Today', read: false },
      { t: 'Your order ORD-1039 shipped — arriving Oct 3.', d: 'Today', read: false }
    ],
    products: [
      { id: 'p1', title: 'Handmade Leather Tote', category: 'Fashion', price: 129, seller: 'Maya Atelier', rating: 4.9, reviews: 212, sold: 840, img: '👜', type: 'Physical', stock: 14, mine: false, paused: false, created: 1, desc: 'Full-grain leather, hand-stitched. Fits 14" laptop. Ships in 2 days with dust bag.' },
      { id: 'p2', title: 'Wireless Focus Headphones', category: 'Tech', price: 89, seller: 'SoundLab', rating: 4.8, reviews: 531, sold: 2100, img: '🎧', type: 'Physical', stock: 32, mine: false, paused: false, created: 2, desc: '40h battery, ANC, multipoint. 1-year Empower warranty included.' },
      { id: 'p3', title: 'Notion Business OS Pack', category: 'Digital', price: 39, seller: 'Systemized', rating: 5.0, reviews: 98, sold: 3400, img: '📦', type: 'Digital', stock: 999, mine: false, paused: false, created: 3, desc: '120+ templates: CRM, finance, hiring, launches. Instant download + free updates.' },
      { id: 'p4', title: 'Abstract Energy Print Set', category: 'Art', price: 59, seller: 'Studio Kline', rating: 4.7, reviews: 64, sold: 210, img: '🎨', type: 'Physical', stock: 5, mine: false, paused: false, created: 4, desc: 'Set of 3 museum-grade giclee prints, signed. A2 + A3 sizes.' },
      { id: 'p5', title: 'AI Side-Hustle Course', category: 'Courses', price: 149, seller: 'Coach Alex', rating: 4.9, reviews: 410, sold: 1900, img: '🤖', type: 'Digital', stock: 999, mine: false, paused: false, created: 5, desc: '6h video + prompts + community. Go from 0 to first $1k/mo offer.' },
      { id: 'p6', title: 'Ceramic Morning Mug Duo', category: 'Home', price: 34, seller: 'Kiln & Co', rating: 4.8, reviews: 120, sold: 560, img: '☕', type: 'Physical', stock: 40, mine: false, paused: false, created: 6, desc: 'Hand-thrown stoneware, dishwasher safe. Gift box included.' },
      { id: 'p7', title: 'Procreate Brush Empire', category: 'Digital', price: 24, seller: 'Inkwell', rating: 4.9, reviews: 300, sold: 5200, img: '🖌️', type: 'Digital', stock: 999, mine: false, paused: false, created: 7, desc: '80 textured brushes + paper pack + 3 tutorials.' },
      { id: 'p8', title: 'Smart Desk Lamp', category: 'Tech', price: 69, seller: 'Lumen', rating: 4.6, reviews: 88, sold: 340, img: '💡', type: 'Physical', stock: 25, mine: false, paused: false, created: 8, desc: 'Auto-dim, circadian mode, wireless charger base.' },
      { id: 'p9', title: '30-Day Fitness Reset', category: 'Wellness', price: 49, seller: 'Coach Priya', rating: 5.0, reviews: 150, sold: 980, img: '💪', type: 'Service', stock: 50, mine: false, paused: false, created: 9, desc: 'Daily 20-min workouts + meal plan + chat support.' },
      { id: 'p10', title: 'Linen Summer Set', category: 'Fashion', price: 98, seller: 'Maya Atelier', rating: 4.7, reviews: 77, sold: 310, img: '👗', type: 'Physical', stock: 0, mine: false, paused: false, created: 10, desc: 'Breathable European flax, sizes XS-XXL, free exchanges.' },
      { id: 'p11', title: 'Freelance Contract Kit', category: 'Digital', price: 29, seller: 'LegalEase', rating: 4.9, reviews: 210, sold: 4100, img: '📄', type: 'Digital', stock: 999, mine: false, paused: false, created: 11, desc: '12 lawyer-drafted templates: MSA, SOW, late-fee, IP.' },
      { id: 'p12', title: 'Bonsai Starter Trio', category: 'Home', price: 45, seller: 'Verde', rating: 4.8, reviews: 92, sold: 420, img: '🌱', type: 'Physical', stock: 22, mine: false, paused: false, created: 12, desc: '3 live bonsai + tools + care course access.' }
    ],
    reviews: {
      p1: [{ n: 'Sofia', r: 5, t: 'Quality is unreal for the price. Got compliments day one.', d: 'Sep 20' }],
      p3: [{ n: 'Marcus', r: 5, t: 'Replaced 6 tools. Worth 10x the price.', d: 'Sep 22' }]
    },
    coaches: [
      { id: 'c1', name: 'Alex Morgan', specialty: 'Business', headline: '0 to $10k/mo store playbook', rate: 80, years: 8, rating: 5.0, sessions: 320, img: '🧑‍💼', bio: 'Ex-DTC founder. I audit your offer, funnel and ads, then give you a 30-day action plan.' },
      { id: 'c2', name: 'Priya Nair', specialty: 'Fitness', headline: 'Strength for busy people', rate: 55, years: 6, rating: 5.0, sessions: 410, img: '🏋️', bio: 'Certified coach. 20-min programs, habit design, nutrition without restriction.' },
      { id: 'c3', name: 'Diego Ruiz', specialty: 'Design', headline: 'Portfolio that gets hired', rate: 70, years: 7, rating: 4.9, sessions: 190, img: '🎨', bio: 'Product designer from fintech unicorns. Weekly critiques + job pipeline.' },
      { id: 'c4', name: 'Sofia Chen', specialty: 'Career', headline: 'Land $150k+ remote roles', rate: 90, years: 9, rating: 4.9, sessions: 260, img: '💼', bio: 'Hiring manager turned coach. Resume, LinkedIn, mock interviews that work.' },
      { id: 'c5', name: 'Marcus Lee', specialty: 'Finance', headline: 'Keep more of what you earn', rate: 75, years: 10, rating: 4.8, sessions: 150, img: '📈', bio: 'CFA. Pricing, bookkeeping, tax setup for sellers and freelancers.' },
      { id: 'c6', name: 'Aisha Bello', specialty: 'Marketing', headline: 'Content to clients engine', rate: 65, years: 5, rating: 5.0, sessions: 230, img: '📣', bio: 'Built 200k audience. Hooks, offers, DM scripts + 30-day calendar.' }
    ],
    coachReviews: { c2: [{ n: 'Jordan', r: 5, t: 'Down 8lbs and stronger than ever. Best coaching purchase.', d: 'Sep 25' }] },
    messages: {},
    myCoach: null,
    orders: [
      { id: 'ORD-1042', title: 'Notion Business OS Pack', img: '📦', qty: 1, total: 39, status: 'Delivered', kind: 'bought', date: 'Sep 28', step: 3 },
      { id: 'ORD-1039', title: 'Ceramic Morning Mug Duo', img: '☕', qty: 2, total: 68, status: 'Shipped', kind: 'bought', date: 'Sep 30', step: 2 }
    ],
    sold: [{ id: 'SOLD-881', title: 'AI Side-Hustle Course (affiliate)', img: '🤖', qty: 1, total: 44.7, status: 'Paid out', kind: 'sold', date: 'Sep 29', step: 3 }],
    bookings: [{ id: 'BK-201', coach: 'Priya Nair', coachId: 'c2', when: 'Oct 5 • 9:00 AM', dur: '60 min', total: 55, status: 'Confirmed', kind: 'bookings', meet: 'https://meet.empower.app/bk-201' }],
    txs: [
      { t: 'Sale payout — Mug Duo', a: 64.6, d: 'Sep 30', k: 'in' },
      { t: 'Coaching booking — Priya', a: -55, d: 'Sep 29', k: 'out' },
      { t: 'Added funds — Visa ••4242', a: 500, d: 'Sep 27', k: 'in' }
    ],
    rev7: [180, 240, 190, 320, 280, 410, 390],
    rev30: [120, 140, 160, 150, 180, 200, 190, 220, 240, 210, 260, 280, 250, 300, 320, 290, 310, 330, 300, 340, 280, 360, 390, 350, 380, 400, 370, 410, 390, 420],
    feed: ['🔥 Maya just sold a Leather Tote for $129', '★ New 5-star review for Coach Priya: "life-changing"', '⚡ 340 buyers joined Empower today'],
    cat: 'All', type: 'All', maxPrice: 0, sort: 'featured', inStock: false, q: '', orderTab: 'bought', coachSpec: 'All', coachSort: 'rating', txFilter: 'All', revRange: 7, editingId: null
  };
}

let S;
try {
  const raw = localStorage.getItem(KEY);
  S = raw ? JSON.parse(raw) : seed();
  if (!S || S.v !== 3 || !Array.isArray(S.products)) {
    // migrate v2 -> v3: keep user goods, add new modules
    const fresh = seed();
    if (S && Array.isArray(S.products)) {
      ['products', 'coaches', 'orders', 'sold', 'bookings', 'txs', 'cart', 'wishlist', 'notifs', 'reviews', 'coachReviews', 'messages', 'myCoach'].forEach(k => { if (S[k] !== undefined) fresh[k] = S[k]; });
      if (S.user) fresh.user = Object.assign(fresh.user, S.user);
      fresh.onboarded = S.onboarded !== false;
    }
    S = fresh;
  }
} catch (e) { S = seed(); }
S.user.currency = S.user.currency || 'USD';
S.user.referral = S.user.referral || 'JORDAN-2026';
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
function applyTheme() { document.documentElement.dataset.theme = S.theme === 'light' ? 'light' : ''; const b = $('#themeBtn'); if (b) b.textContent = S.theme === 'light' ? '☀️' : '🌙'; }

/* ---------- helpers ---------- */
function toast(msg, type) {
  const root = $('#toastRoot'); if (!root) return;
  const d = document.createElement('div');
  d.className = 'toast' + (type ? ' ' + type : '');
  d.textContent = msg;
  root.appendChild(d);
  setTimeout(() => d.remove(), 2800);
}
function notify(text) {
  S.notifs.unshift({ t: text, d: today(), read: false });
  save(); renderNotifBadge();
}
function openModal(html, wide) {
  const r = $('#modalRoot'); if (!r) return;
  r.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '"><button class="icon-btn close" id="modalClose">✕</button>' + html + '</div>';
  r.classList.add('show'); $('#overlay').classList.add('show');
  const c = $('#modalClose'); if (c) c.onclick = closeModal;
  r.onclick = e => { if (e.target === r) closeModal(); };
}
function closeModal() {
  const r = $('#modalRoot'); if (!r) return;
  r.classList.remove('show'); r.innerHTML = '';
  if (!$('#cartDrawer').classList.contains('open') && !$('#notifDrawer').classList.contains('open')) $('#overlay').classList.remove('show');
}
window.closeModal = closeModal;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeCart(); closeNotif(); hideSearch(); }
  if (e.key === '/' && document.activeElement !== $('#globalSearch') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#globalSearch').focus(); }
});
function imgHTML(p, cls) {
  const v = p.img || '📦';
  if (/^https?:\/\//.test(v)) return '<img src="' + esc(v) + '" alt="' + esc(p.title || '') + '" loading="lazy" onerror="this.outerHTML=\'' + esc(p.category || '📦') + '\'" />';
  return esc(v);
}
function stars(r) { const f = Math.round(Number(r) || 0); return '★'.repeat(f) + '☆'.repeat(Math.max(0, 5 - f)); }

/* ---------- navigation (hash routing) ---------- */
const VIEWS = ['marketplace', 'deals', 'services', 'learn', 'coaches', 'community', 'sell', 'become-coach', 'dashboard', 'orders', 'inbox', 'wishlist', 'wallet'];
function nav(name) {
  if (VIEWS.indexOf(name) < 0) name = 'marketplace';
  $$('#mainNav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  const navEl = $('#mainNav'); if (navEl) navEl.classList.remove('open');
  try { if (location.hash !== '#/' + name) history.replaceState(null, '', '#/' + name); } catch (e) {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'dashboard') renderDashboard();
  if (name === 'wallet') renderWallet();
  if (name === 'orders') renderOrders();
  if (name === 'sell') renderSell();
  if (name === 'wishlist') renderWishlist();
  if (name === 'coaches') renderCoaches();
  if (name === 'marketplace') renderMarket();
  if (name === 'deals') renderDeals();
  if (name === 'services') renderServices();
  if (name === 'learn') renderLearn();
  if (name === 'community') renderCommunity();
  if (name === 'inbox') renderInbox();
}
window.nav = nav;
document.addEventListener('click', e => {
  const n = e.target.closest('[data-nav]');
  if (n) { e.preventDefault(); nav(n.dataset.nav); }
});
window.addEventListener('hashchange', () => {
  const h = (location.hash || '').replace('#/', '');
  if (h && VIEWS.indexOf(h) >= 0) nav(h);
});

/* ---------- marketplace ---------- */
function filtered() {
  let list = S.products.filter(p => !p.paused);
  if (S.cat !== 'All') list = list.filter(p => p.category === S.cat);
  if (S.type !== 'All') list = list.filter(p => p.type === S.type);
  if (S.maxPrice > 0) list = list.filter(p => p.price <= S.maxPrice);
  if (S.inStock) list = list.filter(p => p.stock > 0);
  if (S.q) { const q = S.q.toLowerCase(); list = list.filter(p => (p.title + ' ' + p.seller + ' ' + p.category + ' ' + p.desc).toLowerCase().indexOf(q) >= 0); }
  const m = {
    'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
    'rating': (a, b) => b.rating - a.rating, 'sold': (a, b) => b.sold - a.sold, 'newest': (a, b) => b.created - a.created
  };
  if (m[S.sort]) list = list.slice().sort(m[S.sort]);
  return list;
}
function productCard(p) {
  const wished = S.wishlist.indexOf(p.id) >= 0;
  const out = p.stock <= 0 && p.type !== 'Digital';
  let badge2 = '';
  if (out) badge2 = '<span class="out">SOLD OUT</span>';
  else if (p.stock <= 5 && p.type === 'Physical') badge2 = '<span class="low">Only ' + p.stock + ' left</span>';
  return '<div class="product">' +
    '<div class="p-img"><span class="badge">' + esc(p.category) + ' • ' + esc(p.type) + '</span>' +
    '<button class="heart' + (wished ? ' on' : '') + '" data-fav="' + p.id + '" aria-label="Wishlist">' + (wished ? '♥' : '♡') + '</button>' +
    imgHTML(p) + badge2 + '</div>' +
    '<div class="p-body"><h4>' + esc(p.title) + '</h4>' +
    '<div class="seller">by <a href="#" data-seller="' + esc(p.seller) + '">' + esc(p.seller) + '</a> • ' + Number(p.sold).toLocaleString() + ' sold' + (p.mine ? ' • <b style="color:var(--green)">yours</b>' : '') + '</div>' +
    '<div class="p-meta"><span class="price">' + money(p.price) + ' <small>' + ec(p.price) + '</small></span>' +
    '<span class="rating">★ ' + p.rating + ' (' + p.reviews + ')</span></div>' +
    '<div class="p-actions"><button class="btn" data-add="' + p.id + '"' + (out ? ' disabled' : '') + '>' + (out ? 'Sold out' : 'Add') + '</button>' +
    '<button class="btn ghost" data-offer="' + p.id + '" title="Make an offer">◐</button>' +
    '<button class="btn primary" data-view="' + p.id + '">View</button></div></div></div>';
}
function renderMarket() {
  $('#statProducts').textContent = S.products.filter(p => !p.paused).length;
  $('#statCoaches').textContent = S.coaches.length;
  $('#categoryPills').innerHTML = CATS.map(c => '<button class="' + (S.cat === c ? 'active' : '') + '" data-cat="' + c + '">' + c + '</button>').join('');
  $$('#categoryPills button').forEach(b => b.onclick = () => { S.cat = b.dataset.cat; save(); renderMarket(); });
  const list = filtered();
  $('#resultCount').textContent = list.length + ' result' + (list.length === 1 ? '' : 's') + (S.q ? ' for "' + S.q + '"' : '');
  const grid = $('#productGrid');
  grid.innerHTML = list.map(productCard).join('') || '<div class="card empty"><span class="big">🔍</span><b>No listings found</b><p class="muted">Try another search — or be the first to sell it.</p><button class="btn primary" data-nav="sell">＋ Create listing</button></div>';
  $$('#productGrid [data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
  $$('#productGrid [data-view]').forEach(b => b.onclick = () => viewProduct(b.dataset.view));
  $$('#productGrid [data-fav]').forEach(b => b.onclick = () => toggleWish(b.dataset.fav));
  $$('#productGrid [data-offer]').forEach(b => b.onclick = () => makeOffer(b.dataset.offer));
  $$('#productGrid [data-seller]').forEach(b => b.onclick = e => { e.preventDefault(); sellerStore(b.dataset.seller); });
  $('#activityFeed').innerHTML = S.feed.slice(0, 6).map(f => '<div class="feed-item">' + esc(f) + '</div>').join('');
  const sel = $('#sortSelect'); if (sel) sel.value = S.sort;
  const tf = $('#typeFilter'); if (tf) tf.value = S.type;
  const pf = $('#priceFilter'); if (pf) pf.value = String(S.maxPrice);
  const st = $('#stockToggle'); if (st) st.checked = !!S.inStock;
  updateWalletUI(); updateCartUI(); renderNotifBadge();
}
function toggleWish(id) {
  const i = S.wishlist.indexOf(id);
  if (i >= 0) { S.wishlist.splice(i, 1); toast('Removed from wishlist'); }
  else { S.wishlist.push(id); toast('Saved to wishlist ♥', 'ok'); }
  save(); renderMarket(); renderWishlist(); renderNotifBadge();
}
window.toggleWish = toggleWish;

function viewProduct(id) {
  const p = S.products.find(x => x.id === id); if (!p) return;
  const revs = S.reviews[id] || [];
  const related = S.products.filter(x => x.id !== id && x.category === p.category && !x.paused).slice(0, 3);
  openModal(
    '<div class="p-img" style="border-radius:14px;height:190px;font-size:84px"><span class="badge">' + esc(p.category) + ' • ' + esc(p.type) + '</span>' + imgHTML(p) + '</div>' +
    '<h3 style="margin:12px 0 4px">' + esc(p.title) + '</h3>' +
    '<div class="muted small">by <b>' + esc(p.seller) + '</b> • <span class="stars">★ ' + p.rating + '</span> (' + p.reviews + ' reviews) • ' + Number(p.sold).toLocaleString() + ' sold</div>' +
    '<p>' + esc(p.desc) + '</p>' +
    '<div class="total-row"><span>Price</span><b>' + money(p.price) + ' <span class="muted small">(' + ec(p.price) + ')</span></b></div>' +
    '<div class="muted small" style="margin:6px 0">Stock: ' + (p.type === 'Digital' ? '∞ instant delivery' : p.stock) + ' • ' + (p.type === 'Digital' ? 'Instant download' : 'Ships in 2–3 days') + ' • 14-day returns • Escrow protected</div>' +
    '<div class="row2"><label>Qty<select id="pvQty"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>' +
    '<label>ZIP for delivery estimate<input id="pvZip" placeholder="e.g. 78701" /></label></div>' +
    '<div id="pvShip" class="muted small"></div>' +
    '<div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">' +
    '<button class="btn primary" style="flex:1" id="pvBuy">Buy now — ' + money(p.price) + '</button>' +
    '<button class="btn" id="pvAdd">＋ Cart</button>' +
    '<button class="btn" id="pvWish">' + (S.wishlist.indexOf(p.id) >= 0 ? '♥ Saved' : '♡ Save') + '</button></div>' +
    '<h4>Reviews (' + (revs.length + Math.min(2, p.reviews ? 2 : 0)) + ')</h4><div id="pvRevs">' +
    revs.map(r => '<div class="review"><b>' + esc(r.n) + '</b> <span class="stars">' + stars(r.r) + '</span> <span class="muted small">' + esc(r.d) + '</span><div>' + esc(r.t) + '</div></div>').join('') +
    '<div class="review"><b>Verified buyer</b> <span class="stars">★★★★★</span><div>Exactly as described, fast shipping. Would buy again.</div></div></div>' +
    '<div class="row2" style="margin-top:8px"><select id="pvRate"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option></select>' +
    '<input id="pvText" placeholder="Write a review…" /></div>' +
    '<button class="btn small" id="pvSend" style="margin-top:8px">Post review</button>' +
    (related.length ? '<h4 style="margin-top:14px">Related</h4><div style="display:flex;gap:8px;flex-wrap:wrap">' + related.map(r => '<button class="btn small" data-rel="' + r.id + '">' + esc(r.img) + ' ' + esc(r.title.slice(0, 22)) + '</button>').join('') + '</div>' : ''),
    true
  );
  const zip = $('#pvZip');
  if (zip) zip.oninput = () => { $('#pvShip').textContent = zip.value.length >= 3 ? '✓ Delivery to ' + zip.value + ': ' + (p.type === 'Digital' ? 'instant' : '2–4 days • ' + money(4.95) + ' (free over $75)') : ''; };
  $('#pvAdd').onclick = () => { addToCart(p.id, false, Number($('#pvQty').value || 1)); };
  $('#pvBuy').onclick = () => { addToCart(p.id, true, Number($('#pvQty').value || 1)); closeModal(); openCart(); };
  $('#pvWish').onclick = () => { toggleWish(p.id); closeModal(); viewProduct(p.id); };
  $('#pvSend').onclick = () => {
    const t = $('#pvText').value.trim(); if (!t) return toast('Write a review first', 'err');
    (S.reviews[p.id] = S.reviews[p.id] || []).unshift({ n: S.user.name.split(' ')[0], r: Number($('#pvRate').value), t, d: today() });
    p.reviews++; save(); toast('Review posted — thanks!', 'ok'); closeModal(); viewProduct(p.id); renderMarket();
  };
  $$('#modalRoot [data-rel]').forEach(b => b.onclick = () => viewProduct(b.dataset.rel));
}
window.viewProduct = viewProduct;

/* ---------- search ---------- */
function hideSearch() { const d = $('#searchDrop'); if (d) d.hidden = true; }
function bindSearch() {
  const inp = $('#globalSearch'); if (!inp) return;
  inp.addEventListener('input', () => {
    S.q = inp.value.trim();
    const q = S.q.toLowerCase();
    const drop = $('#searchDrop');
    if (q.length >= 2) {
      const ps = S.products.filter(p => (p.title + ' ' + p.seller).toLowerCase().indexOf(q) >= 0).slice(0, 4);
      const cs = S.coaches.filter(c => (c.name + ' ' + c.specialty).toLowerCase().indexOf(q) >= 0).slice(0, 2);
      const gs = (S.gigs || []).filter(g => (g.title + ' ' + g.seller).toLowerCase().indexOf(q) >= 0).slice(0, 2);
      let h = ps.map(p => '<button data-s-p="' + p.id + '"><span>' + esc(p.img) + '</span><span><b>' + esc(p.title) + '</b><br /><small class="muted">' + money(p.price) + ' • ' + esc(p.category) + '</small></span></button>').join('');
      h += cs.map(c => '<button data-s-c="' + c.id + '"><span>' + c.img + '</span><span><b>' + esc(c.name) + '</b><br /><small class="muted">Coach • ' + esc(c.specialty) + '</small></span></button>').join('');
      h += gs.map(g => '<button data-s-g="' + g.id + '"><span>' + g.img + '</span><span><b>' + esc(g.title) + '</b><br /><small class="muted">Gig • ' + money(g.price) + '</small></span></button>').join('');
      drop.innerHTML = h || '<button disabled>No matches</button>';
      drop.hidden = false;
      $$('#searchDrop [data-s-p]').forEach(b => b.onclick = () => { hideSearch(); viewProduct(b.dataset.sP); });
      $$('#searchDrop [data-s-c]').forEach(b => b.onclick = () => { hideSearch(); nav('coaches'); bookCoach(b.dataset.sC, true); });
      $$('#searchDrop [data-s-g]').forEach(b => b.onclick = () => { hideSearch(); nav('services'); hireGig(b.dataset.sG); });
    } else drop.hidden = true;
    if (!$('#view-marketplace').classList.contains('active')) nav('marketplace');
    renderMarket();
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') hideSearch(); });
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) hideSearch(); });
}

/* ---------- wishlist ---------- */
function renderWishlist() {
  const g = $('#wishGrid'); if (!g) return;
  const list = S.wishlist.map(id => S.products.find(p => p.id === id)).filter(Boolean);
  $('#wishCount').hidden = !list.length;
  $('#wishCount').textContent = list.length;
  g.innerHTML = list.map(p =>
    '<div class="product"><div class="p-img">' + imgHTML(p) + '</div><div class="p-body"><h4>' + esc(p.title) + '</h4>' +
    '<div class="p-meta"><span class="price">' + money(p.price) + '</span><span class="rating">★ ' + p.rating + '</span></div>' +
    '<div class="p-actions"><button class="btn primary" data-w-add="' + p.id + '">Add to cart</button><button class="btn" data-w-del="' + p.id + '">✕</button></div></div></div>'
  ).join('') || '<div class="card empty"><span class="big">♥</span><b>Wishlist is empty</b><p class="muted">Tap ♡ on any listing to save it here.</p><button class="btn primary" data-nav="marketplace">Browse marketplace</button></div>';
  $$('#wishGrid [data-w-add]').forEach(b => b.onclick = () => addToCart(b.dataset.wAdd));
  $$('#wishGrid [data-w-del]').forEach(b => b.onclick = () => toggleWish(b.dataset.wDel));
}

/* ---------- cart + checkout (bug-fixed) ---------- */
function cartDetailed() {
  return S.cart
    .map(c => { const p = S.products.find(x => x.id === c.id); return p ? Object.assign({}, p, { qty: c.qty }) : null; })
    .filter(x => x && x.title);
}
function cartSubtotal() { return cartDetailed().reduce((s, x) => s + x.price * x.qty, 0); }
function cartDiscount(sub) {
  let d = 0;
  if (S.coupon && COUPONS[S.coupon]) d += sub * COUPONS[S.coupon];
  if (S.user.plus) d += sub * 0.05;
  return Math.min(d, sub * 0.6);
}
function cartShipping(sub) {
  if (S.user.plus) return 0;
  const lines = cartDetailed();
  if (!lines.length) return 0;
  if (lines.every(l => l.type !== 'Physical')) return 0;
  return sub - cartDiscount(sub) >= 75 ? 0 : 4.95;
}
function cartTotal() { const sub = cartSubtotal(); return Math.max(0, sub - cartDiscount(sub) + cartShipping(sub)); }
window.addToCart = (id, silent, qty) => {
  qty = qty || 1;
  const p = S.products.find(x => x.id === id); if (!p) return;
  if (p.type !== 'Digital' && p.stock <= 0) { toast('Sorry — sold out', 'err'); return; }
  const line = S.cart.find(c => c.id === id);
  if (line) line.qty = Math.min(99, line.qty + qty); else S.cart.push({ id, qty });
  save(); updateCartUI();
  if (!silent) toast('Added to cart 🛒', 'ok');
};
window.chQty = (id, d) => {
  const l = S.cart.find(c => c.id === id); if (!l) return;
  l.qty += d; if (l.qty <= 0) S.cart = S.cart.filter(c => c.id !== id);
  save(); updateCartUI();
};
window.removeLine = id => { S.cart = S.cart.filter(c => c.id !== id); save(); updateCartUI(); };
function updateCartUI() {
  const n = S.cart.reduce((s, c) => s + c.qty, 0);
  const cc = $('#cartCount'); if (cc) cc.textContent = n;
  const cc2 = $('#cartCount2'); if (cc2) cc2.textContent = n ? '(' + n + ')' : '';
  const sub = cartSubtotal(), disc = cartDiscount(sub), ship = cartShipping(sub);
  if ($('#cartSub')) $('#cartSub').textContent = money(sub);
  if ($('#cartDisc')) $('#cartDisc').textContent = '−' + money(disc);
  if ($('#cartDiscLabel')) $('#cartDiscLabel').textContent = S.coupon ? '(' + S.coupon + ')' : '';
  if ($('#cartShip')) $('#cartShip').textContent = ship === 0 ? 'FREE' : money(ship);
  if ($('#cartTotal')) $('#cartTotal').textContent = money(sub - disc + ship);
  if ($('#shipNote')) $('#shipNote').textContent = ship === 0 ? 'you unlocked FREE shipping' : 'free shipping over $75';
  const box = $('#cartItems'); if (!box) return;
  box.innerHTML = cartDetailed().map(x =>
    '<div class="cart-line"><div class="thumb">' + imgHTML(x) + '</div>' +
    '<div class="grow"><b>' + esc(x.title) + '</b><span>' + money(x.price) + ' each • ' + esc(x.type) + '</span></div>' +
    '<div class="qty"><button onclick="chQty(\'' + x.id + '\',-1)">−</button>' + x.qty + '<button onclick="chQty(\'' + x.id + '\',1)">＋</button></div>' +
    '<button class="icon-btn" onclick="removeLine(\'' + x.id + '\')" aria-label="Remove">✕</button></div>'
  ).join('') || '<div class="empty"><span class="big">🛒</span><b>Cart is empty</b><p class="muted">Go find something great.</p></div>';
  const ci = $('#couponInput'); if (ci && S.coupon) ci.value = S.coupon;
}
function openCart() { $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('show'); }
function closeCart() { const d = $('#cartDrawer'); if (d) d.classList.remove('open'); if (!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show'); }
window.openCart = openCart;
function applyCoupon(code) {
  code = (code || '').trim().toUpperCase();
  if (!code) return;
  if (!COUPONS[code]) { toast('Invalid coupon. Try EMPOWER10', 'err'); return; }
  S.coupon = code; save(); updateCartUI(); toast('Coupon ' + code + ' applied — ' + Math.round(COUPONS[code] * 100) + '% off', 'ok');
}
let checkout = { step: 1, name: '', address: '', zip: '', pay: 'balance' };
function startCheckout() {
  if (!S.cart.length) { toast('Cart is empty', 'err'); return; }
  checkout = { step: 1, name: S.user.name, address: S.user.address, zip: '', pay: 'balance' };
  drawCheckout();
}
function drawCheckout() {
  const sub = cartSubtotal(), disc = cartDiscount(sub), ship = cartShipping(sub), total = sub - disc + ship;
  let body = '<div class="steps"><span class="' + (checkout.step === 1 ? 'on' : '') + '">1 Details</span><span class="' + (checkout.step === 2 ? 'on' : '') + '">2 Payment</span><span class="' + (checkout.step === 3 ? 'on' : '') + '">3 Review</span></div>';
  if (checkout.step === 1) {
    body += '<h3>Where is it going?</h3><label>Full name<input id="coName" value="' + esc(checkout.name) + '" /></label>' +
      '<label>Street address<input id="coAddr" value="' + esc(checkout.address) + '" /></label>' +
      '<div class="row2"><label>ZIP<input id="coZip" placeholder="78701" value="' + esc(checkout.zip) + '" /></label>' +
      '<label>Speed<select id="coSpeed"><option>Standard (2–4d) — ' + (ship === 0 ? 'FREE' : money(ship)) + '</option><option>Express (1–2d) — $12.90</option></select></label></div>' +
      '<button class="btn primary block" id="coNext">Continue to payment →</button>';
  } else if (checkout.step === 2) {
    body += '<h3>How do you pay?</h3><label><input type="radio" name="pay" value="balance" style="width:auto" ' + (checkout.pay === 'balance' ? 'checked' : '') + ' /> ◉ Empower Balance (' + ec(S.user.balance) + ')</label>' +
      '<label><input type="radio" name="pay" value="card" style="width:auto" ' + (checkout.pay === 'card' ? 'checked' : '') + ' /> 💳 Visa •• 4242</label>' +
      '<div class="escrow-mini" style="margin:10px 0"><div class="escrow-steps"><span class="done">Pay</span><i>→</i><span class="done">Escrow held</span><i>→</i><span>Released on delivery</span></div></div>' +
      '<div style="display:flex;gap:8px"><button class="btn" id="coBack">← Back</button><button class="btn primary" style="flex:1" id="coNext">Review order →</button></div>';
  } else {
    body += '<h3>Review & confirm</h3>' + cartDetailed().map(x => '<div class="list-row"><div class="thumb">' + imgHTML(x) + '</div><div class="grow"><b>' + esc(x.title) + '</b><span>×' + x.qty + ' • ' + esc(checkout.address) + '</span></div><b>' + money(x.price * x.qty) + '</b></div>').join('') +
      '<div class="total-row small"><span>Subtotal</span><b>' + money(sub) + '</b></div>' +
      '<div class="total-row small"><span>Discount</span><b>−' + money(disc) + '</b></div>' +
      '<div class="total-row small"><span>Shipping</span><b>' + (ship === 0 ? 'FREE' : money(ship)) + '</b></div>' +
      '<div class="total-row"><span>Total</span><b>' + money(total) + '</b></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="coBack">← Back</button><button class="btn primary" style="flex:1" id="coPay">Pay ' + money(total) + ' →</button></div>';
  }
  openModal(body);
  const next = $('#coNext');
  if (next) next.onclick = () => {
    if (checkout.step === 1) {
      checkout.name = $('#coName').value.trim(); checkout.address = $('#coAddr').value.trim(); checkout.zip = $('#coZip').value.trim();
      if (!checkout.name || !checkout.address) { toast('Add name + address', 'err'); return; }
      const sp = $('#coSpeed'); if (sp && sp.selectedIndex === 1) checkout.express = true;
    }
    if (checkout.step === 2) { const r = document.querySelector('input[name="pay"]:checked'); checkout.pay = r ? r.value : 'balance'; }
    checkout.step++; drawCheckout();
  };
  const back = $('#coBack'); if (back) back.onclick = () => { checkout.step--; drawCheckout(); };
  const pay = $('#coPay'); if (pay) pay.onclick = placeOrder;
}
function placeOrder() {
  const sub = cartSubtotal(), disc = cartDiscount(sub);
  let ship = cartShipping(sub); if (checkout.express) ship += 12.9;
  const total = Math.max(0, sub - disc + ship);
  if (checkout.pay === 'balance' && S.user.balance < total) { toast('Insufficient balance — add funds or pay by card', 'err'); closeModal(); nav('wallet'); return; }
  if (checkout.pay === 'balance') S.user.balance -= total;
  const lines = cartDetailed();
  lines.forEach(x => {
    S.orders.unshift({ id: uid('ORD'), title: x.title, img: x.img, qty: x.qty, total: x.price * x.qty, status: x.type === 'Digital' ? 'Delivered' : 'Processing', kind: 'bought', date: today(), step: x.type === 'Digital' ? 3 : 0, addr: checkout.address });
    const p = S.products.find(pp => pp.id === x.id);
    if (p) { p.sold += x.qty; if (p.type !== 'Digital') p.stock = Math.max(0, p.stock - x.qty); }
  });
  S.txs.unshift({ t: 'Marketplace purchase (' + lines.length + ' items)', a: checkout.pay === 'balance' ? -total : 0, d: today(), k: 'out', note: checkout.pay === 'card' ? 'Visa ••4242 ' + money(total) : '' });
  S.feed.unshift('🛍️ ' + S.user.name.split(' ')[0] + ' just checked out ' + lines.length + ' item(s) for ' + money(total));
  notify('Order confirmed — ' + lines.length + ' item(s), ' + money(total) + '. Track it in Orders.');
  S.cart = []; S.coupon = null; save();
  closeModal(); closeCart(); renderMarket(); renderWallet();
  openModal('<div class="empty"><span class="big">🎉</span><h3>Order confirmed!</h3><p class="muted">Paid ' + money(total) + ' via ' + (checkout.pay === 'balance' ? 'Empower Balance' : 'Visa ••4242') + '. Funds are in escrow until delivery.</p><button class="btn primary block" onclick="closeModal();nav(\'orders\')">Track my order →</button></div>');
  S.orderTab = 'bought'; renderOrders(); updateWalletUI();
}
window.placeOrder = placeOrder;
window.buyNow = id => { addToCart(id, true); closeModal(); openCart(); };

/* ---------- orders ---------- */
const STEPS = ['Processing', 'Shipped', 'Out for delivery', 'Delivered'];
function renderOrders() {
  $$('#orderTabs button').forEach(b => { b.classList.toggle('active', b.dataset.tab === S.orderTab); b.onclick = () => { S.orderTab = b.dataset.tab; save(); renderOrders(); }; });
  const map = { bought: S.orders, sold: S.sold, bookings: S.bookings };
  const list = map[S.orderTab] || [];
  $('#ordersList').innerHTML = list.map((o, i) => {
    const tag = o.status === 'Delivered' || o.status === 'Paid out' || o.status === 'Confirmed' ? 'ok' : (o.status === 'Cancelled' ? 'bad' : 'warn');
    let actions = '';
    if (S.orderTab === 'bought') actions = '<button class="btn small" data-tr="' + i + '">Track</button><button class="btn small" data-inv="' + i + '">Invoice</button>' + (o.status !== 'Delivered' && o.status !== 'Cancelled' ? '<button class="btn small" data-rec="' + i + '">Mark received</button><button class="btn small danger" data-cancel="' + i + '">Cancel</button>' : '<button class="btn small" data-reo="' + i + '">Reorder</button><button class="btn small" data-rate="' + i + '">★ Rate</button>') + '<button class="btn small" data-disp="' + i + '">Dispute</button>';
    if (S.orderTab === 'bookings') actions = '<button class="btn small" data-join="' + i + '">Join call</button><button class="btn small" data-msg="' + i + '">Message</button><button class="btn small danger" data-bcan="' + i + '">Reschedule</button>';
    if (S.orderTab === 'sold') actions = '<button class="btn small" data-ship="' + i + '">Advance status</button>';
    return '<div class="list-row"><div class="thumb">' + (o.kind === 'bookings' ? '📅' : esc(o.img || '📦')) + '</div>' +
      '<div class="grow"><b>' + esc(o.title || o.coach) + '</b><span>' + o.id + ' • ' + esc(o.date || o.when || '') + (o.qty ? ' • ×' + o.qty : '') + (o.dur ? ' • ' + esc(o.dur) : '') + '</span></div>' +
      '<b>' + money(o.total) + '</b><span class="tag ' + tag + '">' + esc(o.status) + '</span></div>' +
      (actions ? '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-bottom:10px">' + actions + '</div>' : '');
  }).join('') || '<div class="empty"><span class="big">📦</span><b>Nothing here yet</b><p class="muted">Orders, sales and bookings will appear here.</p></div>';
  $$('#ordersList [data-tr]').forEach(b => b.onclick = () => trackOrder(Number(b.dataset.tr)));
  $$('#ordersList [data-inv]').forEach(b => b.onclick = () => invoice(Number(b.dataset.inv)));
  $$('#ordersList [data-rec]').forEach(b => b.onclick = () => { const o = S.orders[Number(b.dataset.rec)]; o.status = 'Delivered'; o.step = 3; S.txs.unshift({ t: 'Escrow released — ' + o.title, a: 0, d: today(), k: 'out' }); notify('Escrow released for ' + o.id + '. Enjoy!'); save(); renderOrders(); toast('Marked as delivered ✓', 'ok'); });
  $$('#ordersList [data-cancel]').forEach(b => b.onclick = () => { const o = S.orders[Number(b.dataset.cancel)]; o.status = 'Cancelled'; S.user.balance += o.total; S.txs.unshift({ t: 'Refund — ' + o.title, a: o.total, d: today(), k: 'in' }); notify('Order ' + o.id + ' cancelled — refunded ' + money(o.total)); save(); renderOrders(); renderWallet(); });
  $$('#ordersList [data-reo]').forEach(b => b.onclick = () => { const o = S.orders[Number(b.dataset.reo)]; const p = S.products.find(pp => pp.title === o.title); if (p) { addToCart(p.id, true); openCart(); } else toast('Original listing is gone', 'err'); });
  $$('#ordersList [data-rate]').forEach(b => b.onclick = () => rateOrder(Number(b.dataset.rate)));
  $$('#ordersList [data-disp]').forEach(b => b.onclick = () => disputeModal(S.orders[Number(b.dataset.disp)].id));
  $$('#ordersList [data-join]').forEach(b => b.onclick = () => { const bk = S.bookings[Number(b.dataset.join)]; openModal('<h3>Your session</h3><p class="muted">' + esc(bk.coach) + ' • ' + esc(bk.when) + '</p><div class="card-flat">Video link: <b>' + esc(bk.meet || 'https://meet.empower.app/session') + '</b><br /><small class="muted">Recording + action plan arrive after the call.</small></div><button class="btn primary block" style="margin-top:10px" onclick="closeModal()">Got it</button>'); });
  $$('#ordersList [data-msg]').forEach(b => b.onclick = () => messageCoach(S.bookings[Number(b.dataset.msg)].coachId));
  $$('#ordersList [data-bcan]').forEach(b => b.onclick = () => { const bk = S.bookings[Number(b.dataset.bcan)]; bk.status = 'Rescheduled'; save(); renderOrders(); toast('Booking moved — coach will propose new times', 'ok'); });
  $$('#ordersList [data-ship]').forEach(b => b.onclick = () => { const o = S.sold[Number(b.dataset.ship)]; o.status = o.status === 'Processing' ? 'Shipped' : 'Paid out'; save(); renderOrders(); toast('Sale updated: ' + o.status, 'ok'); });
}
function trackOrder(i) {
  const o = S.orders[i]; if (!o) return;
  const step = o.step || 0;
  openModal('<h3>' + o.id + ' — ' + esc(o.status) + '</h3><p class="muted small">' + esc(o.title) + ' • ' + esc(o.addr || S.user.address) + '</p><div class="timeline">' +
    STEPS.map((s, k) => '<div class="t-step' + (k <= step ? ' done' : '') + '"><div class="t-dot">' + (k <= step ? '✓' : '○') + '</div><div><b>' + s + '</b><div class="muted small">' + (k <= step ? 'Completed' : (k === step + 1 ? 'Next up — ETA 2 days' : 'Pending')) + '</div></div></div>').join('') +
    '</div><button class="btn primary block" onclick="closeModal()">Close</button>');
}
function invoice(i) {
  const o = S.orders[i]; if (!o) return;
  openModal('<h3>Invoice ' + o.id + '</h3><div class="card-flat">Empower Inc. • hello@empower.app<br />Billed to: ' + esc(S.user.name) + '<br />' + esc(o.title) + ' ×' + (o.qty || 1) + ' — <b>' + money(o.total) + '</b><br /><small class="muted">Escrow protected • 14-day returns • ' + esc(o.date) + '</small></div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn" onclick="closeModal()">Close</button><button class="btn primary" style="flex:1" onclick="window.print()">Print / Save PDF</button></div>');
}
function rateOrder(i) {
  const o = S.orders[i]; if (!o) return;
  const p = S.products.find(pp => pp.title === o.title);
  openModal('<h3>Rate your purchase</h3><p class="muted">' + esc(o.title) + '</p><select id="rtStars"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option></select><input id="rtText" placeholder="What did you love?" style="margin-top:8px" /><button class="btn primary block" style="margin-top:10px" id="rtGo">Submit ★</button>');
  $('#rtGo').onclick = () => {
    const t = $('#rtText').value.trim() || 'Great experience!';
    if (p) { (S.reviews[p.id] = S.reviews[p.id] || []).unshift({ n: S.user.name.split(' ')[0], r: Number($('#rtStars').value), t, d: today() }); p.reviews++; }
    notify('Thanks for rating ' + o.id + ' ★');
    save(); closeModal(); renderMarket(); toast('Thanks for the review!', 'ok');
  };
}

/* ---------- sell studio ---------- */
function renderSell() {
  const sc = $('#sellCategory'); if (sc && !sc.options.length) sc.innerHTML = CATS.filter(c => c !== 'All').map(c => '<option>' + c + '</option>').join('');
  const mine = S.products.filter(p => p.mine);
  const rev = mine.reduce((s, p) => s + p.price * p.sold * 0.95, 0) + 1240;
  $('#sellerRevenue').textContent = money(rev);
  $('#sellerActive').textContent = mine.filter(p => !p.paused).length;
  $('#sellerOrders').textContent = mine.reduce((s, p) => s + p.sold, 0) + 37;
  const box = $('#myListings');
  const rows = (mine.length ? mine : S.products.slice(0, 4));
  box.innerHTML = rows.map(p =>
    '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div>' +
    '<div class="grow"><b>' + esc(p.title) + (p.paused ? ' <span class="tag warn">paused</span>' : '') + '</b><span>' + esc(p.category) + ' • ' + money(p.price) + ' • stock ' + p.stock + ' • ' + p.sold + ' sold</span></div>' +
    '<span class="tag ' + (p.paused ? 'warn' : 'ok') + '">' + (p.paused ? 'Paused' : 'Live') + '</span></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;padding-bottom:10px">' +
    '<button class="btn small" data-edit="' + p.id + '">Edit</button>' +
    '<button class="btn small" data-dup="' + p.id + '">Duplicate</button>' +
    '<button class="btn small" data-pause="' + p.id + '">' + (p.paused ? 'Resume' : 'Pause') + '</button>' +
    '<button class="btn small" data-stock="' + p.id + '">+10 stock</button>' +
    '<button class="btn small danger" data-del="' + p.id + '">Delete</button></div>'
  ).join('') || '<div class="muted">No listings yet — publish your first one.</div>';
  $$('#myListings [data-edit]').forEach(b => b.onclick = () => editListing(b.dataset.edit));
  $$('#myListings [data-dup]').forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.dup); const c = Object.assign({}, p, { id: 'p' + Date.now(), title: p.title + ' (copy)', sold: 0, reviews: 0, created: 99, mine: true }); S.products.unshift(c); save(); renderSell(); renderMarket(); toast('Duplicated ✓', 'ok'); });
  $$('#myListings [data-pause]').forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.pause); p.paused = !p.paused; save(); renderSell(); renderMarket(); });
  $$('#myListings [data-stock]').forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.stock); p.stock += 10; save(); renderSell(); renderMarket(); toast('Stock +10', 'ok'); });
  $$('#myListings [data-del]').forEach(b => b.onclick = () => { if (!confirm('Delete this listing?')) return; S.products = S.products.filter(x => x.id !== b.dataset.del); S.cart = S.cart.filter(c => c.id !== b.dataset.del); save(); renderSell(); renderMarket(); toast('Listing deleted'); });
  updateFeeBox();
}
function updateFeeBox() {
  const v = Number(($('#sellPrice') || {}).value || 0);
  const rate = S.user.plus ? 0.02 : 0.05;
  const fee = v * rate, net = v - fee;
  const box = $('#feeBox'); if (box) box.innerHTML = v > 0 ? 'You get <b>' + money(net) + '</b> per sale (' + money(fee) + ' fee' + (S.user.plus ? ' • Plus 2%' : '') + ' • buyer pays ' + money(v) + ')' : 'Fee preview: —';
}
function editListing(id) {
  const p = S.products.find(x => x.id === id); if (!p) return;
  S.editingId = id;
  const f = $('#sellForm');
  f.title.value = p.title; f.category.value = p.category; f.price.value = p.price; f.stock.value = p.stock; f.type.value = p.type; f.image.value = /^https?:/.test(p.img) ? p.img : (p.img || '');
  $('#imgPreview').innerHTML = imgHTML(p);
  $('#sellFormTitle').textContent = '✎ Editing listing';
  $('#sellSubmit').textContent = 'Save changes →';
  $('#sellCancelEdit').hidden = false;
  updateFeeBox(); nav('sell');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.delListing = id => { S.products = S.products.filter(x => x.id !== id); save(); renderSell(); renderMarket(); };

/* ---------- coaches ---------- */
function renderCoaches() {
  const specs = ['All'].concat(Array.from(new Set(S.coaches.map(c => c.specialty))));
  const f = $('#coachFilter');
  if (f && !f.dataset.init) { f.innerHTML = specs.map(s => '<option>' + s + '</option>').join(''); f.dataset.init = '1'; }
  if (f) f.value = S.coachSpec;
  let list = S.coaches.filter(c => S.coachSpec === 'All' || c.specialty === S.coachSpec);
  const sm = { 'rating': (a, b) => b.rating - a.rating, 'sessions': (a, b) => b.sessions - a.sessions, 'price-asc': (a, b) => a.rate - b.rate, 'price-desc': (a, b) => b.rate - a.rate };
  list = list.slice().sort(sm[S.coachSort] || sm.rating);
  $('#coachGrid').innerHTML = list.map(c => {
    const revs = S.coachReviews[c.id] || [];
    return '<div class="coach-card"><div class="coach-top"><div class="coach-av">' + c.img + '</div>' +
      '<div style="min-width:0"><b>' + esc(c.name) + '</b> <span class="tag ok">✓ Verified</span>' +
      '<div class="muted small">' + esc(c.specialty) + ' • ' + c.years + 'y exp • ★ ' + c.rating + ' (' + c.sessions + ' sessions)</div>' +
      '<div style="font-size:13px;margin-top:4px">' + esc(c.headline) + '</div></div></div>' +
      '<div style="padding:0 16px 6px" class="muted small">' + esc((c.bio || '').slice(0, 110)) + '…</div>' +
      (revs.length ? '<div style="padding:0 16px 6px;font-size:12.5px">“' + esc(revs[0].t) + '” — <b>' + esc(revs[0].n) + '</b></div>' : '') +
      '<div style="padding:0 16px 16px;display:flex;align-items:center;gap:8px"><b>' + money(c.rate) + '/hr</b><span class="muted small">' + ec(c.rate) + '</span>' +
      '<button class="btn small" data-c-view="' + c.id + '">Profile</button>' +
      '<button class="btn primary small" style="margin-left:auto" data-c-book="' + c.id + '">Book</button></div></div>';
  }).join('') || '<div class="card">No coaches in this specialty yet.</div>';
  $$('#coachGrid [data-c-book]').forEach(b => b.onclick = () => bookCoach(b.dataset.cBook));
  $$('#coachGrid [data-c-view]').forEach(b => b.onclick = () => coachProfile(b.dataset.cView));
  renderMyCoach();
}
function coachProfile(id) {
  const c = S.coaches.find(x => x.id === id); if (!c) return;
  const revs = S.coachReviews[id] || [];
  openModal('<div class="coach-top" style="padding:0 0 10px"><div class="coach-av" style="width:76px;height:76px;font-size:38px">' + c.img + '</div>' +
    '<div><h3 style="margin:0">' + esc(c.name) + ' <span class="tag ok">✓ Verified</span></h3><div class="muted small">' + esc(c.specialty) + ' • ' + c.years + ' yrs • ★ ' + c.rating + ' • ' + c.sessions + ' sessions • ' + money(c.rate) + '/hr</div>' +
    '<div style="margin-top:4px"><i>“' + esc(c.headline) + '”</i></div></div></div>' +
    '<p>' + esc(c.bio) + '</p>' +
    '<h4>What you get</h4><div class="muted small">✓ 1:1 video call ✓ Recording ✓ Written action plan ✓ 7-day chat follow-up</div>' +
    '<h4>Reviews</h4>' + (revs.map(r => '<div class="review"><b>' + esc(r.n) + '</b> <span class="stars">' + stars(r.r) + '</span><div>' + esc(r.t) + '</div></div>').join('') || '<div class="muted small">Be the first to review after a session.</div>') +
    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" id="cpMsg">💬 Message</button><button class="btn primary" style="flex:1" id="cpBook">Book ' + esc(c.name.split(' ')[0]) + ' — ' + money(c.rate) + '/hr →</button></div>', true);
  $('#cpBook').onclick = () => bookCoach(c.id);
  $('#cpMsg').onclick = () => messageCoach(c.id);
}
let booking = { coachId: null, date: '', time: '', dur: 1, pack: 1 };
function bookCoach(id, viewOnly) {
  const c = S.coaches.find(x => x.id === id); if (!c) return;
  booking = { coachId: id, date: '2026-10-05', time: '9:00 AM', dur: 1, pack: 1 };
  const draw = () => {
    const per = booking.dur === 1 ? c.rate : c.rate / 2;
    const total = per * booking.pack * (booking.pack === 4 ? 0.85 : 1);
    openModal('<h3>Book ' + esc(c.name) + '</h3><p class="muted small">' + esc(c.specialty) + ' • ★ ' + c.rating + ' • ' + money(c.rate) + '/hr</p>' +
      '<div class="row2"><label>Date<input type="date" id="bkDate" value="' + booking.date + '" min="2026-10-01" /></label>' +
      '<label>Duration<select id="bkDur"><option value="1"' + (booking.dur === 1 ? ' selected' : '') + '>60 min — ' + money(c.rate) + '</option><option value="0.5"' + (booking.dur === 0.5 ? ' selected' : '') + '>30 min — ' + money(c.rate / 2) + '</option></select></label></div>' +
      '<label>Package<select id="bkPack"><option value="1"' + (booking.pack === 1 ? ' selected' : '') + '>Single session</option><option value="4"' + (booking.pack === 4 ? ' selected' : '') + '>4-pack — save 15%</option></select></label>' +
      '<label>Pick a time</label><div class="slot-grid" id="bkSlots">' + ['9:00 AM', '1:00 PM', '4:00 PM', '7:00 PM'].map(t => '<button class="' + (booking.time === t ? 'sel' : '') + '" data-t="' + t + '">' + t + '</button>').join('') + '</div>' +
      '<label>Goal<textarea id="bkNote" rows="2" placeholder="e.g. Review my store + ad account"></textarea></label>' +
      '<div class="total-row"><span>Total' + (booking.pack === 4 ? ' (15% off)' : '') + '</span><b>' + money(total) + '</b></div>' +
      '<button class="btn primary block" id="bkGo" style="margin-top:10px">Confirm booking →</button>' +
      '<p class="muted small">Free reschedule up to 12h before • Recording + action plan included • Balance: ' + ec(S.user.balance) + '</p>');
    $$('#bkSlots button').forEach(b => b.onclick = () => { booking.time = b.dataset.t; draw(); });
    $('#bkDate').onchange = e => booking.date = e.target.value;
    $('#bkDur').onchange = e => { booking.dur = Number(e.target.value); draw(); };
    $('#bkPack').onchange = e => { booking.pack = Number(e.target.value); draw(); };
    $('#bkGo').onclick = () => confirmBooking(c.id, total);
  };
  if (viewOnly) coachProfile(id); else draw();
}
window.bookCoach = bookCoach;
function confirmBooking(id, forcedTotal) {
  const c = S.coaches.find(x => x.id === id); if (!c) return;
  const per = booking.dur === 1 ? c.rate : c.rate / 2;
  const total = forcedTotal != null ? forcedTotal : per * booking.pack;
  if (S.user.balance < total) { toast('Insufficient balance — add funds', 'err'); closeModal(); nav('wallet'); return; }
  S.user.balance -= total;
  const n = booking.pack === 4 ? 4 : 1;
  for (let k = 0; k < n; k++) {
    S.bookings.unshift({ id: uid('BK'), coach: c.name, coachId: c.id, when: booking.date + ' • ' + booking.time, dur: booking.dur === 1 ? '60 min' : '30 min', total: total / n, status: 'Confirmed', kind: 'bookings', meet: 'https://meet.empower.app/' + Math.random().toString(36).slice(2, 8) });
  }
  c.sessions++;
  S.txs.unshift({ t: 'Coaching — ' + c.name + (n > 1 ? ' ×' + n : ''), a: -total, d: today(), k: 'out' });
  notify('Booked ' + c.name + ' on ' + booking.date + ' at ' + booking.time + '. Video link sent.');
  save(); closeModal(); updateWalletUI(); renderWallet();
  toast('Booked! Video link sent 📅', 'ok');
  nav('orders'); S.orderTab = 'bookings'; renderOrders();
}
window.confirmBooking = confirmBooking;
function messageCoach(id) {
  const c = S.coaches.find(x => x.id === id); if (!c) return;
  const thread = S.messages[id] || [{ me: false, t: 'Hi! I\'m ' + c.name + '. Tell me your goal and I\'ll suggest a plan.' }];
  S.messages[id] = thread;
  const draw = () => openModal('<h3>💬 ' + esc(c.name) + '</h3><p class="muted small">Typically replies within 2h • ' + esc(c.specialty) + '</p><div class="chat" id="chatBox">' + thread.map(m => '<div class="bubble' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</div>').join('') + '</div><div style="display:flex;gap:8px"><input id="chatIn" placeholder="Ask about pricing, results…" /><button class="btn primary" id="chatSend">Send</button></div>');
  draw();
  $('#chatSend').onclick = () => {
    const v = $('#chatIn').value.trim(); if (!v) return;
    thread.push({ me: true, t: v }); save(); draw();
    setTimeout(() => { thread.push({ me: false, t: 'Great question! On our call we\'ll map a 30-day plan. Want the ' + (c.rate > 70 ? '4-pack (save 15%)' : 'single session') + ' to start?' }); save(); if ($('#chatBox')) draw(); }, 900);
  };
}
function renderMyCoach() {
  const box = $('#myCoachBox'); if (!box) return;
  if (!S.myCoach) { box.innerHTML = ''; return; }
  const mine = S.bookings.filter(b => b.coachId === S.myCoach.id);
  const earn = mine.reduce((s, b) => s + b.total * 0.9, 0);
  box.innerHTML = '<div class="coach-preview" style="border-style:solid"><b>Your coach page is live ✓</b><br />' + esc(S.myCoach.name) + ' • ' + esc(S.myCoach.specialty) + ' • ' + money(S.myCoach.rate) + '/hr<br /><span>' + mine.length + ' bookings • ' + money(earn) + ' earned (90%)</span><br /><button class="btn small" style="margin-top:8px" onclick="nav(\'coaches\')">View public profile →</button></div>';
}

/* ---------- dashboard / wallet ---------- */
function renderDashboard() {
  const first = (S.user.name || 'there').split(' ')[0];
  $('#dashGreet').textContent = 'Hey ' + first + ', here\'s your empire';
  const mine = S.products.filter(p => p.mine);
  const salesRev = mine.reduce((s, p) => s + p.price * p.sold * 0.95, 0) + 1240;
  const coachRev = S.myCoach ? S.bookings.filter(b => b.coachId === S.myCoach.id).reduce((s, b) => s + b.total * 0.9, 0) : S.bookings.reduce((s, b) => s + b.total * 0.1, 0);
  const rev = salesRev + coachRev;
  $('#dRevenue').textContent = money(rev);
  $('#dWallet').textContent = ec(S.user.balance);
  $('#dSold').textContent = mine.reduce((s, p) => s + p.sold, 0) + 37;
  $('#dBookings').textContent = S.bookings.length;
  const goal = 3000, pct = Math.min(100, Math.round(rev / goal * 100));
  $('#goalLabel').textContent = 'Monthly goal — ' + money(goal) + ' (' + pct + '%)';
  $('#goalSub').textContent = money(Math.max(0, goal - rev)) + ' to go • on pace ✓';
  $('#goalBar').style.width = pct + '%';
  drawChart();
  const top = S.products.slice().sort((a, b) => b.sold - a.sold).slice(0, 3);
  $('#topProducts').innerHTML = '<h4 style="margin:12px 0 4px">Top products</h4>' + top.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + p.sold + ' sold</span></div><b>' + money(p.price * p.sold * 0.95) + '</b></div>').join('');
  const shipDue = S.orders.filter(o => o.status === 'Processing').length;
  $('#todoList').innerHTML = [
    shipDue ? '📦 Ship ' + shipDue + ' order(s) — due today' : '✓ All caught up on shipping',
    '💬 Reply to buyer questions (avg reply 2h → +22% sales)',
    S.bookings.length ? '📅 Prep for ' + S.bookings[0].coach + ' — ' + S.bookings[0].when : '🎓 Book a coach to grow faster',
    '💸 Available to cash out: ' + ec(S.user.balance)
  ].map(t => '<div class="list-row"><div class="grow"><b>' + esc(t) + '</b></div></div>').join('');
  const ce = $('#coachEarnBox');
  if (ce) ce.innerHTML = S.myCoach ? '<div class="list-row"><div class="thumb">' + S.myCoach.img + '</div><div class="grow"><b>' + esc(S.myCoach.name) + '</b><span>' + S.bookings.filter(b => b.coachId === S.myCoach.id).length + ' sessions • 90% payout</span></div><b>' + money(coachRev) + '</b></div>' : '<div class="muted small">Not a coach yet? <a href="#/become-coach" data-nav="become-coach">Launch your profile</a> and keep 90%.</div>';
  $('#recentActivity').innerHTML = S.txs.slice(0, 6).map(t => '<div class="list-row"><div class="thumb">' + (t.k === 'in' ? '💰' : '💸') + '</div><div class="grow"><b>' + esc(t.t) + '</b><span>' + esc(t.d) + (t.note ? ' • ' + esc(t.note) : '') + '</span></div><b style="color:' + (t.a > 0 ? 'var(--green)' : t.a < 0 ? 'var(--txt)' : 'var(--mut)') + '">' + (t.a === 0 ? '—' : (t.a > 0 ? '+' : '−') + money(Math.abs(t.a))) + '</b></div>').join('');
}
function drawChart() {
  const cv = $('#revChart'); if (!cv) return;
  let active = document.querySelector('#revTabs .active');
  const range = S.revRange || 7;
  const data = range === 30 ? S.rev30 : S.rev7;
  let labels = range === 30 ? data.map((_, i) => 'D' + (i + 1)) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  void active; void labels;
  const ctx = cv.getContext('2d');
  const W = cv.width = (cv.offsetWidth || 600) * 2, H = cv.height = 320;
  ctx.clearRect(0, 0, W, H);
  const max = Math.max.apply(null, data.concat([1]));
  const bw = W / data.length * 0.55;
  data.forEach((v, i) => {
    const x = W / data.length * i + (W / data.length - bw) / 2;
    const h = Math.max(6, v / max * (H - 50));
    const g = ctx.createLinearGradient(0, H - h, 0, H);
    g.addColorStop(0, '#a855f7'); g.addColorStop(1, '#22d3ee');
    ctx.fillStyle = g;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, H - h - 14, bw, h, 12); ctx.fill(); }
    else ctx.fillRect(x, H - h - 14, bw, h);
  });
}
function renderWallet() {
  updateWalletUI();
  $('#walletBig').textContent = ec(S.user.balance);
  $('#walletSub').textContent = '≈ ' + money(S.user.balance) + ' USD • Escrow protected';
  const f = S.txFilter || 'All';
  const list = S.txs.filter(t => f === 'All' || t.k === f);
  $('#txList').innerHTML = list.map(t => '<div class="list-row"><div class="thumb">' + (t.k === 'in' ? '💰' : '💸') + '</div><div class="grow"><b>' + esc(t.t) + '</b><span>' + esc(t.d) + (t.note ? ' • ' + esc(t.note) : '') + '</span></div><b style="color:' + (t.a > 0 ? 'var(--green)' : t.a < 0 ? 'var(--txt)' : 'var(--mut)') + '">' + (t.a === 0 ? '—' : (t.a > 0 ? '+' : '−') + money(Math.abs(t.a))) + '</b></div>').join('') || '<div class="muted">No transactions in this filter.</div>';
  const tf = $('#txFilter'); if (tf) tf.value = f;
}
function updateWalletUI() {
  if ($('#walletBalanceTop')) $('#walletBalanceTop').textContent = ec(S.user.balance);
  if ($('#walletBalanceHero')) $('#walletBalanceHero').textContent = ec(S.user.balance) + ' ≈ ' + money(S.user.balance);
  const ab = $('#userBtn'); if (ab) ab.textContent = initials(S.user.name);
}
function initials(n) { return String(n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function renderNotifBadge() {
  const un = S.notifs.filter(n => !n.read).length;
  const el = $('#notifCount');
  if (el) { el.hidden = !un; el.textContent = un > 9 ? '9+' : un; }
  const w = $('#wishCount');
  if (w) { w.hidden = !S.wishlist.length; w.textContent = S.wishlist.length; }
}
function renderNotifs() {
  const box = $('#notifList'); if (!box) return;
  box.innerHTML = S.notifs.map(n => '<div class="notif' + (n.read ? '' : ' unread') + '">' + esc(n.t) + '<br /><small>' + esc(n.d) + '</small></div>').join('') || '<div class="muted">All clear — no notifications.</div>';
}
function openNotif() { renderNotifs(); $('#notifDrawer').classList.add('open'); $('#overlay').classList.add('show'); }
function closeNotif() { const d = $('#notifDrawer'); if (d) d.classList.remove('open'); if (!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show'); }
function txCSV() {
  const rows = [['date', 'description', 'amount']].concat(S.txs.map(t => [t.d, '"' + String(t.t).replace(/"/g, '') + '"', t.a]));
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'empower-statement.csv'; a.click();
}

/* ---------- onboarding / profile / help ---------- */
function maybeOnboard() {
  if (S.onboarded) return;
  let goal = 'sell';
  openModal('<h3>Welcome to Empower ⚡</h3><p class="muted">The virtual economy where you buy, sell & get coached. What is your main goal?</p>' +
    '<div class="onboard-goals"><button data-g="buy">🛍<br /><b>Buy</b><br /><small>Shop deals</small></button>' +
    '<button data-g="sell" class="sel">📦<br /><b>Sell</b><br /><small>Earn income</small></button>' +
    '<button data-g="coach">🎓<br /><b>Coach</b><br /><small>Monetize skills</small></button></div>' +
    '<label>Your name<input id="obName" value="Jordan Doe" /></label>' +
    '<button class="btn primary block" id="obGo">Enter Empower → +50 EC welcome gift</button>');
  $$('#modalRoot [data-g]').forEach(b => b.onclick = () => { goal = b.dataset.g; $$('#modalRoot [data-g]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
  $('#obGo').onclick = () => {
    S.user.name = $('#obName').value.trim() || 'Jordan Doe';
    S.user.balance += 50;
    S.txs.unshift({ t: 'Welcome gift', a: 50, d: today(), k: 'in' });
    S.onboarded = true;
    notify('Welcome gift: +50 EC. ' + (goal === 'sell' ? 'Publish your first listing to start earning.' : goal === 'coach' ? 'Launch your coach profile to get booked.' : 'Use EMPOWER10 for 10% off your first order.'));
    save(); closeModal(); renderAll(); updateWalletUI();
    toast('Welcome! +50 EC gift 🎉', 'ok');
    nav(goal === 'buy' ? 'marketplace' : goal === 'sell' ? 'sell' : 'become-coach');
  };
}
function profileModal() {
  openModal('<h3>' + esc(S.user.emoji) + ' ' + esc(S.user.name) + '</h3><p class="muted small">' + esc(S.user.email) + ' • Member since ' + esc(S.user.memberSince) + ' • <span class="tag ok">Gold seller • 4.9★</span></p>' +
    '<div class="row2"><label>Name<input id="pfName" value="' + esc(S.user.name) + '" /></label><label>Avatar emoji<input id="pfEmoji" value="' + esc(S.user.emoji) + '" maxlength="4" /></label></div>' +
    '<label>Default address<input id="pfAddr" value="' + esc(S.user.address) + '" /></label>' +
    '<div class="list-row"><div class="grow"><b>Stats</b><span>' + S.orders.length + ' bought • ' + S.products.filter(p => p.mine).length + ' listings • ' + S.bookings.length + ' sessions</span></div><b>' + ec(S.user.balance) + '</b></div>' +
    '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" style="flex:1" id="pfSave">Save</button><button class="btn" onclick="closeModal()">Close</button></div>');
  $('#pfSave').onclick = () => {
    S.user.name = $('#pfName').value.trim() || S.user.name;
    S.user.emoji = $('#pfEmoji').value.trim() || '🧑‍🚀';
    S.user.address = $('#pfAddr').value.trim() || S.user.address;
    S.user.avatar = initials(S.user.name);
    save(); closeModal(); updateWalletUI(); renderDashboard(); toast('Profile saved ✓', 'ok');
  };
}

/* ---------- v3 modules: deals / services / learn / community / inbox / plus / gifts / offers / disputes / storefronts ---------- */
function dealPrice(p, pct) { return Math.round(p.price * (1 - pct / 100) * 100) / 100; }
function renderDeals() {
  if (Date.now() > S.dealsEndsAt) S.dealsEndsAt = Date.now() + 14 * 3600 * 1000;
  const g = $('#dealsGrid'); if (!g) return;
  g.innerHTML = S.deals.map(d => {
    const p = S.products.find(x => x.id === d.pid); if (!p) return '';
    const dp = dealPrice(p, d.pct);
    const claimed = 60 + (p.sold % 35);
    return '<div class="product"><div class="p-img"><span class="deal-badge">−' + d.pct + '%</span>' +
      '<button class="heart' + (S.wishlist.indexOf(p.id) >= 0 ? ' on' : '') + '" data-d-fav="' + p.id + '">' + (S.wishlist.indexOf(p.id) >= 0 ? '♥' : '♡') + '</button>' + imgHTML(p) + '</div>' +
      '<div class="p-body"><h4>' + esc(p.title) + '</h4><div class="seller">by ' + esc(p.seller) + ' • ' + Number(p.sold).toLocaleString() + ' sold</div>' +
      '<div class="deal-price"><b>' + money(dp) + '</b><s>' + money(p.price) + '</s><span class="tag ok">save ' + money(p.price - dp) + '</span></div>' +
      '<div class="deal-bar"><i style="width:' + claimed + '%"></i></div><small class="muted">' + claimed + '% claimed</small>' +
      '<div class="p-actions"><button class="btn" data-d-add="' + p.id + '|' + d.pct + '">Add deal</button><button class="btn primary" data-d-view="' + p.id + '">View</button></div></div></div>';
  }).join('');
  $$('#dealsGrid [data-d-add]').forEach(b => b.onclick = () => {
    const parts = b.dataset.dAdd.split('|'); const pid = parts[0]; const pct = Number(parts[1]);
    const p = S.products.find(x => x.id === pid); if (!p) return;
    const dp = dealPrice(p, pct);
    const line = S.cart.find(c => c.id === pid);
    if (line) line.qty++; else S.cart.push({ id: pid, qty: 1, dealPrice: dp });
    // store deal override: encode via coupon-free path — adjust by adding a pseudo discount tx at checkout? simpler: temporarily set price override map
    S.dealOverride = S.dealOverride || {}; S.dealOverride[pid] = dp;
    save(); updateCartUI(); toast('Deal locked in 🛒 −' + pct + '%', 'ok');
  });
  $$('#dealsGrid [data-d-view]').forEach(b => b.onclick = () => viewProduct(b.dataset.dView));
  $$('#dealsGrid [data-d-fav]').forEach(b => b.onclick = () => toggleWish(b.dataset.dFav));
  const cs = $('#currencySel'); if (cs) cs.value = cur();
  tickDeals();
}
function tickDeals() {
  const el = $('#dealTimer'); if (!el) return;
  let ms = Math.max(0, S.dealsEndsAt - Date.now());
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  el.textContent = '⏳ ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' left';
}
// deal-aware subtotal: override unit price when deal locked
const _cartSubtotal = cartSubtotal;
cartSubtotal = function () {
  return cartDetailed().reduce((sum, x) => {
    const ov = (S.dealOverride && S.dealOverride[x.id]) || null;
    const unit = (ov && ov < x.price) ? ov : x.price;
    return sum + unit * x.qty;
  }, 0);
};
function renderServices() {
  const cats = ['All', 'Design', 'Marketing', 'Finance', 'Career', 'Fitness'];
  const gp = $('#gigPills'); if (gp && !gp.dataset.init) { gp.innerHTML = cats.map(c => '<button data-gc="' + c + '">' + c + '</button>').join(''); gp.dataset.init = '1'; }
  const active = S.gigCat || 'All';
  $$('#gigPills button').forEach(b => { b.classList.toggle('active', b.dataset.gc === active); b.onclick = () => { S.gigCat = b.dataset.gc; save(); renderServices(); }; });
  let list = S.gigs.filter(g => active === 'All' || g.cat === active);
  const sm = { 'rating': (a, b) => b.rating - a.rating, 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, 'orders': (a, b) => b.orders - a.orders };
  const sort = ($('#gigSort') || {}).value || 'rating';
  list = list.slice().sort(sm[sort] || sm.rating);
  $('#gigGrid').innerHTML = list.map(g =>
    '<div class="gig-card"><div class="p-img" style="height:130px;font-size:54px">' + g.img + '</div>' +
    '<div class="p-body"><h4>' + esc(g.title) + '</h4><div class="seller">by ' + esc(g.seller) + ' • ★ ' + g.rating + ' • ' + g.orders + ' orders • ' + esc(g.delivery) + '</div>' +
    '<p class="muted small">' + esc(g.desc) + '</p>' +
    '<div class="p-meta"><b>' + money(g.price) + '</b><span class="tag info">' + esc(g.cat) + '</span></div>' +
    '<div class="p-actions"><button class="btn primary" data-hire="' + g.id + '">Hire — ' + money(g.price) + '</button><button class="btn" data-gmsg="' + g.id + '">💬</button></div></div></div>'
  ).join('') || '<div class="card">No gigs here yet.</div>';
  $$('#gigGrid [data-hire]').forEach(b => b.onclick = () => hireGig(b.dataset.hire));
  $$('#gigGrid [data-gmsg]').forEach(b => b.onclick = () => {
    const g = S.gigs.find(x => x.id === b.dataset.gmsg);
    S.threads.unshift({ id: uid('T'), from: g.seller, kind: 'orders', title: g.title, preview: 'Hi about your gig…', time: today(), unread: 0, msgs: [{ me: false, t: 'Hi! Thanks for asking about "' + g.title + '". Tell me your deadline and I will confirm a plan + quote.' }] });
    save(); nav('inbox'); renderInbox(); toast('Chat opened with ' + g.seller, 'ok');
  });
  $('#gigRequests').innerHTML = S.gigRequests.map(r =>
    '<div class="list-row"><div class="thumb">📝</div><div class="grow"><b>' + esc(r.title) + '</b><span>' + esc(r.by) + ' • budget ' + money(r.budget) + ' • ' + r.bids + ' bids • ' + esc(r.cat) + '</span></div><button class="btn small" data-bid="' + r.id + '">Bid</button></div>'
  ).join('');
  $$('#gigRequests [data-bid]').forEach(b => b.onclick = () => {
    const r = S.gigRequests.find(x => x.id === b.dataset.bid);
    r.bids++; save(); renderServices(); toast('Bid sent! Buyer usually replies in ~3h', 'ok'); notify('Bid sent on "' + r.title + '".');
  });
}
function hireGig(id) {
  const g = S.gigs.find(x => x.id === id); if (!g) return;
  openModal('<h3>Hire: ' + esc(g.title) + '</h3><p class="muted small">by ' + esc(g.seller) + ' • ★ ' + g.rating + ' • delivery ' + esc(g.delivery) + '</p>' +
    '<label>Project details<textarea id="gigBrief" rows="3" placeholder="Goals, links, deadline…"></textarea></label>' +
    '<div class="total-row"><span>Total (escrow)</span><b>' + money(g.price) + '</b></div>' +
    '<button class="btn primary block" id="gigGo" style="margin-top:10px">Pay ' + money(g.price) + ' → start gig</button>');
  $('#gigGo').onclick = () => {
    if (S.user.balance < g.price) { toast('Insufficient balance — add funds', 'err'); closeModal(); nav('wallet'); return; }
    S.user.balance -= g.price; g.orders++;
    S.orders.unshift({ id: uid('ORD'), title: 'Gig: ' + g.title, img: g.img, qty: 1, total: g.price, status: 'Processing', kind: 'bought', date: today(), step: 0 });
    S.txs.unshift({ t: 'Gig hire — ' + g.seller, a: -g.price, d: today(), k: 'out' });
    S.threads.unshift({ id: uid('T'), from: g.seller, kind: 'orders', title: g.title, preview: 'Kickoff — brief received', time: today(), unread: 1, msgs: [{ me: false, t: 'Locked in! I got your brief and will deliver in ' + g.delivery + '. I will post drafts here.' }] });
    notify('Gig started with ' + g.seller + ' — escrowed ' + money(g.price) + '.');
    save(); closeModal(); renderServices(); updateWalletUI(); toast('Gig started! 🎉', 'ok'); nav('orders'); S.orderTab = 'bought'; renderOrders();
  };
}
function renderLearn() {
  const g = $('#courseGrid'); if (!g) return;
  $('#learnStats').textContent = S.courses.filter(k => k.enrolled).length + ' enrolled';
  g.innerHTML = S.courses.map(k =>
    '<div class="coach-card"><div class="coach-top"><div class="coach-av">' + k.img + '</div><div><b>' + esc(k.title) + '</b><div class="muted small">by ' + esc(k.coach) + ' • ' + esc(k.duration) + ' • ★ ' + k.rating + '</div></div></div>' +
    '<div style="padding:0 16px 16px"><div class="progress"><i style="width:' + (k.progress || 0) + '%"></i></div>' +
    '<small class="muted">' + (k.enrolled ? (k.progress || 0) + '% complete' : money(k.price) + ' • ' + k.lessons.length + ' lessons') + '</small>' +
    '<div class="p-actions" style="display:flex;gap:8px;margin-top:8px"><button class="btn primary" style="flex:1" data-k="' + k.id + '">' + (k.enrolled ? 'Continue' : 'Enroll — ' + money(k.price)) + '</button></div></div></div>'
  ).join('');
  $$('#courseGrid [data-k]').forEach(b => b.onclick = () => openCourse(b.dataset.k));
  $('#myLearning').innerHTML = S.courses.filter(k => k.enrolled).map(k =>
    '<div class="list-row"><div class="thumb">' + k.img + '</div><div class="grow"><b>' + esc(k.title) + '</b><span>' + esc(k.coach) + ' • ' + (k.progress || 0) + '%</span></div><button class="btn small" data-k2="' + k.id + '">Open</button></div>'
  ).join('') || '<div class="muted">No enrollments yet — pick a course above.</div>';
  $$('#myLearning [data-k2]').forEach(b => b.onclick = () => openCourse(b.dataset.k2));
}
function openCourse(id) {
  const k = S.courses.find(x => x.id === id); if (!k) return;
  if (!k.enrolled) {
    openModal('<h3>' + esc(k.title) + '</h3><p class="muted small">by ' + esc(k.coach) + ' • ' + k.lessons.length + ' lessons • ' + esc(k.duration) + '</p>' +
      k.lessons.map((l, i) => '<div class="lesson"><span class="t-dot">' + (i + 1) + '</span><span>' + esc(l) + '</span></div>').join('') +
      '<div class="total-row"><span>Enroll</span><b>' + money(k.price) + '</b></div>' +
      '<button class="btn primary block" id="kGo" style="margin-top:10px">Enroll now →</button>');
    $('#kGo').onclick = () => {
      if (S.user.balance < k.price) { toast('Insufficient balance', 'err'); closeModal(); nav('wallet'); return; }
      S.user.balance -= k.price; k.enrolled = true; k.progress = 5;
      S.txs.unshift({ t: 'Course enroll — ' + k.title, a: -k.price, d: today(), k: 'out' });
      notify('Enrolled in "' + k.title + '".');
      save(); closeModal(); renderLearn(); updateWalletUI(); toast('Enrolled! 🎬', 'ok'); openCourse(id);
    };
    return;
  }
  openModal('<h3>' + esc(k.title) + '</h3><p class="muted small">' + (k.progress || 0) + '% complete • keep going 👇</p>' +
    k.lessons.map((l, i) => {
      const done = (k.progress || 0) >= Math.round((i + 1) / k.lessons.length * 100);
      return '<div class="lesson"><button class="btn small" data-les="' + i + '">' + (done ? '✓' : (i + 1)) + '</button><span>' + esc(l) + '</span></div>';
    }).join('') +
    '<div class="progress"><i style="width:' + (k.progress || 0) + '%"></i></div>' +
    ((k.progress || 0) >= 100 ? '<div class="tag ok">🎓 Certificate unlocked — congrats!</div>' : '<p class="muted small">Tap a lesson number to mark it done.</p>'), true);
  $$('#modalRoot [data-les]').forEach(b => b.onclick = () => {
    const i = Number(b.dataset.les);
    k.progress = Math.round((i + 1) / k.lessons.length * 100);
    if (k.progress >= 100) { S.user.balance += 10; S.txs.unshift({ t: 'Course completion bonus', a: 10, d: today(), k: 'in' }); notify('Course complete! +10 EC bonus.'); }
    save(); closeModal(); renderLearn(); openCourse(id);
  });
}
function renderCommunity() {
  const topic = ($('#feedFilter') || {}).value || 'All';
  const list = S.posts.filter(p => topic === 'All' || p.topic === topic);
  $('#feedList').innerHTML = list.map(p =>
    '<div class="post"><div class="post-head"><div class="post-av">' + p.av + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + esc(p.author) + ' • ' + esc(p.role) + ' • ' + esc(p.time) + ' • ' + esc(p.topic) + '</span></div><button class="btn small" data-fol="' + esc(p.author) + '">' + (S.following.indexOf(p.author) >= 0 ? 'Following ✓' : 'Follow') + '</button></div>' +
    '<div>' + esc(p.text) + '</div>' +
    '<div class="post-actions"><button class="btn small" data-like="' + p.id + '">' + (p.liked ? '♥' : '♡') + ' ' + p.likes + '</button><button class="btn small" data-cview="' + p.id + '">💬 ' + p.comments.length + ' comments</button><button class="btn small" data-shop="' + esc(p.author) + '">Visit shop →</button></div>' +
    '<div id="c-' + p.id + '">' + p.comments.slice(0, 3).map(c => '<div class="comment"><b>' + esc(c.n) + '</b> ' + esc(c.t) + '</div>').join('') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><input id="ci-' + p.id + '" placeholder="Add a comment…" /><button class="btn small primary" data-send="' + p.id + '">Post</button></div></div>'
  ).join('') || '<div class="card empty">No posts in this topic yet — be the first.</div>';
  $$('#feedList [data-like]').forEach(b => b.onclick = () => { const p = S.posts.find(x => x.id === b.dataset.like); p.liked = !p.liked; p.likes += p.liked ? 1 : -1; save(); renderCommunity(); });
  $$('#feedList [data-fol]').forEach(b => b.onclick = () => { const a = b.dataset.fol; const i = S.following.indexOf(a); if (i >= 0) S.following.splice(i, 1); else S.following.push(a); save(); renderCommunity(); toast(i >= 0 ? 'Unfollowed' : 'Following ' + a + ' ✓', 'ok'); });
  $$('#feedList [data-shop]').forEach(b => b.onclick = () => sellerStore(b.dataset.shop));
  $$('#feedList [data-send]').forEach(b => b.onclick = () => {
    const p = S.posts.find(x => x.id === b.dataset.send); const inp = $('#ci-' + p.id); const v = (inp.value || '').trim(); if (!v) return;
    p.comments.push({ n: S.user.name.split(' ')[0], t: v }); save(); renderCommunity();
  });
  const counts = {};
  S.posts.forEach(p => { counts[p.author] = (counts[p.author] || 0) + p.likes; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  $('#topContrib').innerHTML = top.map(t => '<div class="list-row"><div class="thumb">🏆</div><div class="grow"><b>' + esc(t[0]) + '</b><span>' + t[1] + ' likes</span></div><button class="btn small" data-shop2="' + esc(t[0]) + '">Shop</button></div>').join('');
  $$('#topContrib [data-shop2]').forEach(b => b.onclick = () => sellerStore(b.dataset.shop2));
  const rc = $('#refCode'); if (rc) rc.textContent = S.user.referral;
}
function renderInbox() {
  const tab = S.inboxTab || 'all';
  $$('#inboxTabs button').forEach(b => { b.classList.toggle('active', b.dataset.it === tab); b.onclick = () => { S.inboxTab = b.dataset.it; save(); renderInbox(); }; });
  const list = S.threads.filter(t => tab === 'all' || t.kind === tab || (tab === 'disputes' && t.kind === 'dispute'));
  $('#threadList').innerHTML = list.map(t =>
    '<div class="thread' + (S.activeThread === t.id ? ' sel' : '') + (t.unread ? ' unread' : '') + '" data-th="' + t.id + '"><b>' + esc(t.from) + '</b><div class="muted small">' + esc(t.title) + '</div><div class="muted small">' + esc(t.preview) + ' • ' + esc(t.time) + '</div></div>'
  ).join('') || '<div class="muted">No conversations here.</div>';
  $$('#threadList [data-th]').forEach(b => b.onclick = () => { S.activeThread = b.dataset.th; save(); renderInbox(); });
  const t = S.threads.find(x => x.id === S.activeThread) || list[0];
  if (!t) { $('#threadView').innerHTML = '<div class="empty"><span class="big">✉️</span><b>Pick a conversation</b></div>'; renderInboxBadge(); return; }
  S.activeThread = t.id; t.unread = 0; save();
  $('#threadView').innerHTML = '<h3 style="margin-top:0">' + esc(t.title) + '</h3><p class="muted small">' + esc(t.from) + '</p>' +
    '<div class="chat" style="max-height:300px">' + t.msgs.map(m => '<div class="msg' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</div>').join('') + '</div>' +
    '<div style="display:flex;gap:8px"><input id="thIn" placeholder="Reply…" /><button class="btn primary" id="thSend">Send</button></div>';
  $('#thSend').onclick = () => {
    const v = $('#thIn').value.trim(); if (!v) return;
    t.msgs.push({ me: true, t: v }); t.preview = v.slice(0, 40); save(); renderInbox();
    setTimeout(() => { t.msgs.push({ me: false, t: 'Got it — I will follow up within a few hours. Anything else I can prep?' }); t.unread = 1; save(); if ($('#view-inbox').classList.contains('active')) renderInbox(); renderInboxBadge(); }, 1200);
  };
  renderDisputes(); renderInboxBadge();
}
function renderInboxBadge() {
  const n = S.threads.reduce((s, t) => s + (t.unread || 0), 0);
  const el = $('#inboxCount'); if (el) { el.hidden = !n; el.textContent = n > 9 ? '9+' : n; }
}
function renderDisputes() {
  const box = $('#disputeList'); if (!box) return;
  box.innerHTML = S.disputes.map(d =>
    '<div class="list-row"><div class="thumb">🛡️</div><div class="grow"><b>' + esc(d.order) + ' — ' + esc(d.reason) + '</b><span>' + esc(d.status) + ' • ' + esc(d.date) + '</span></div><span class="tag ' + (d.status === 'Resolved' ? 'ok' : 'warn') + '">' + esc(d.status) + '</span></div>'
  ).join('') || '<div class="muted small">No disputes. Escrow covers every order — open one if delivery fails.</div>';
}
function makeOffer(pid) {
  const p = S.products.find(x => x.id === pid); if (!p) return;
  if (p.type === 'Digital') { toast('Digital items are fixed price', 'err'); return; }
  openModal('<h3>Make an offer — ' + esc(p.title) + '</h3><p class="muted small">Listed at <b>' + money(p.price) + '</b> • seller usually responds in ~2h</p>' +
    '<label>Your offer (' + cur() + ')<input id="offAmt" type="number" value="' + Math.round(p.price * 0.85) + '" min="1" /></label>' +
    '<label>Message (optional)<input id="offMsg" placeholder="e.g. Can pick up this weekend" /></label>' +
    '<button class="btn primary block" id="offGo">Send offer →</button><p class="muted small">Binding for 24h if accepted. Escrow still applies.</p>');
  $('#offGo').onclick = () => {
    const amt = Number($('#offAmt').value);
    if (!amt || amt <= 0) { toast('Enter an offer', 'err'); return; }
    const ratio = amt / p.price;
    if (ratio >= 0.8) {
      S.dealOverride = S.dealOverride || {}; S.dealOverride[p.id] = amt;
      const line = S.cart.find(c => c.id === p.id);
      if (line) line.qty++; else S.cart.push({ id: p.id, qty: 1 });
      S.threads.unshift({ id: uid('T'), from: p.seller, kind: 'orders', title: 'Offer accepted: ' + p.title, preview: money(amt) + ' accepted!', time: today(), unread: 1, msgs: [{ me: false, t: 'Accepted! Your offer of ' + money(amt) + ' for "' + p.title + '" is locked for 24h. It is in your cart.' }] });
      notify('Offer accepted by ' + p.seller + ' — ' + money(amt) + '.');
      save(); closeModal(); updateCartUI(); renderInboxBadge(); openCart(); toast('Offer accepted! 🎉', 'ok');
    } else {
      const counter = Math.round(p.price * 0.9);
      S.threads.unshift({ id: uid('T'), from: p.seller, kind: 'orders', title: 'Counter-offer: ' + p.title, preview: 'How about ' + money(counter) + '?', time: today(), unread: 1, msgs: [{ me: false, t: 'Thanks for the offer! I can do ' + money(counter) + ' (lowest I can go). Want me to lock that in?' }] });
      save(); closeModal(); renderInboxBadge(); toast('Counter-offer: ' + money(counter) + ' — see Inbox', 'ok'); nav('inbox');
    }
  };
}
window.makeOffer = makeOffer;
function sellerStore(name) {
  const items = S.products.filter(p => p.seller === name && !p.paused);
  const gigs = S.gigs.filter(g => g.seller === name);
  const totalSold = items.reduce((s, p) => s + p.sold, 0);
  const following = S.following.indexOf(name) >= 0;
  openModal('<div class="store-hero"><div class="store-av">' + (items[0] ? imgHTML(items[0]) : '🏪') + '</div>' +
    '<div><h3 style="margin:0">' + esc(name) + ' <span class="tag ok">✓ Verified</span></h3><div class="muted small">' + items.length + ' listings • ' + totalSold.toLocaleString() + ' sold • ★ 4.9 • ships in 2 days</div></div></div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn" style="flex:1" id="stFol">' + (following ? 'Following ✓' : 'Follow store') + '</button><button class="btn" style="flex:1" id="stChat">💬 Message</button></div>' +
    '<h4>Listings (' + items.length + ')</h4>' +
    (items.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + money(p.price) + ' • stock ' + p.stock + '</span></div><button class="btn small primary" data-st-add="' + p.id + '">Add</button><button class="btn small" data-st-view="' + p.id + '">View</button></div>').join('') || '<div class="muted">No live listings.</div>') +
    (gigs.length ? '<h4>Services</h4>' + gigs.map(g => '<div class="list-row"><div class="thumb">' + g.img + '</div><div class="grow"><b>' + esc(g.title) + '</b><span>' + money(g.price) + '</span></div></div>').join('') : ''), true);
  $('#stFol').onclick = () => { const i = S.following.indexOf(name); if (i >= 0) S.following.splice(i, 1); else S.following.push(name); save(); closeModal(); sellerStore(name); };
  $('#stChat').onclick = () => { S.threads.unshift({ id: uid('T'), from: name, kind: 'orders', title: 'Question about your shop', preview: 'Hi!', time: today(), unread: 0, msgs: [{ me: true, t: 'Hi! I love your shop — quick question…' }, { me: false, t: 'Hey, thanks for reaching out! Ask away, I reply within ~2h. 🙌' }] }); save(); closeModal(); nav('inbox'); renderInbox(); };
  $$('#modalRoot [data-st-add]').forEach(b => b.onclick = () => addToCart(b.dataset.stAdd));
  $$('#modalRoot [data-st-view]').forEach(b => b.onclick = () => { closeModal(); viewProduct(b.dataset.stView); });
}
window.sellerStore = sellerStore;
function plusModal() {
  if (S.user.plus) {
    openModal('<h3>★ Empower Plus — active</h3><div class="list-row"><div class="grow"><b>Free shipping</b><span>on every physical order</span></div><span class="tag ok">ON</span></div>' +
      '<div class="list-row"><div class="grow"><b>Extra 5% off</b><span>stacks with coupons</span></div><span class="tag ok">ON</span></div>' +
      '<div class="list-row"><div class="grow"><b>2% selling fees</b><span>instead of 5%</span></div><span class="tag ok">ON</span></div>' +
      '<button class="btn block" id="plusOff">Cancel Plus (keep perks till month end)</button>');
    $('#plusOff').onclick = () => { S.user.plus = false; save(); syncPlus(); closeModal(); renderMarket(); updateCartUI(); toast('Plus cancelled'); };
    return;
  }
  openModal('<h3>★ Empower Plus — $9/mo</h3><p class="muted small">Pays for itself in ~2 orders.</p>' +
    '<div class="list-row"><div class="grow"><b>Free shipping</b><span>save ~$4.95/order</span></div><span class="tag info">incl</span></div>' +
    '<div class="list-row"><div class="grow"><b>Extra 5% off everything</b><span>stacks with EMPOWER10</span></div><span class="tag info">incl</span></div>' +
    '<div class="list-row"><div class="grow"><b>2% selling fees</b><span>vs 5% standard</span></div><span class="tag info">incl</span></div>' +
    '<div class="list-row"><div class="grow"><b>PLUS25 coupon</b><span>25% off, monthly</span></div><span class="tag info">incl</span></div>' +
    '<button class="btn primary block" id="plusGo">Start Plus — first month 50 EC back →</button><p class="muted small">Cancel anytime. EC-back lands instantly.</p>');
  $('#plusGo').onclick = () => {
    S.user.plus = true; S.user.balance += 50; S.coupon = 'PLUS25';
    S.txs.unshift({ t: 'Empower Plus bonus', a: 50, d: today(), k: 'in' });
    notify('Welcome to Plus! Free shipping + 5% off active.');
    save(); syncPlus(); closeModal(); renderMarket(); updateCartUI(); toast('Welcome to Plus ★ +50 EC', 'ok');
  };
}
function syncPlus() { const el = $('#plusPill'); if (el) { el.textContent = S.user.plus ? '★ Plus ON' : '★ Plus'; el.classList.toggle('on', !!S.user.plus); } }
function giftModal() {
  openModal('<h3>🎁 Gift cards</h3><p class="muted small">Buy with EC, share the code. Redeeming adds EC instantly.</p>' +
    '<div class="row2"><label>Amount<input id="gcAmt" type="number" value="25" min="5" /></label><label>To (optional)<input id="gcTo" placeholder="@friend" /></label></div>' +
    '<button class="btn primary block" id="gcBuy">Buy gift card →</button>' +
    '<h4 style="margin-top:12px">Redeem a code</h4><div style="display:flex;gap:8px"><input id="gcCode" placeholder="EMP-XXXX" /><button class="btn" id="gcGo">Redeem</button></div>' +
    '<div style="margin-top:8px">' + (S.giftCodes.filter(g => !g.used).map(g => '<div class="list-row"><div class="grow"><b>' + g.code + '</b><span>' + ec(g.amt) + ' • ' + esc(g.to || 'open') + '</span></div><span class="tag ok">unused</span></div>').join('') || '<div class="muted small">No unused codes.</div>') + '</div>');
  $('#gcBuy').onclick = () => {
    const amt = Number($('#gcAmt').value);
    if (!amt || amt < 5 || amt > S.user.balance) { toast('Invalid amount', 'err'); return; }
    S.user.balance -= amt;
    const code = 'EMP-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    S.giftCodes.unshift({ code, amt, to: $('#gcTo').value.trim(), used: false });
    S.txs.unshift({ t: 'Gift card bought (' + code + ')', a: -amt, d: today(), k: 'out' });
    save(); closeModal(); renderWallet(); giftModal(); toast('Gift card ' + code + ' ready 🎁', 'ok');
  };
  $('#gcGo').onclick = () => {
    const code = ($('#gcCode').value || '').trim().toUpperCase();
    const g = S.giftCodes.find(x => x.code === code && !x.used);
    if (code === 'WELCOME10') { S.user.balance += 10; S.txs.unshift({ t: 'Gift code WELCOME10', a: 10, d: today(), k: 'in' }); save(); closeModal(); renderWallet(); toast('+10 EC redeemed!', 'ok'); return; }
    if (!g) { toast('Unknown or used code (try WELCOME10)', 'err'); return; }
    g.used = true; S.user.balance += g.amt;
    S.txs.unshift({ t: 'Gift card redeemed (' + code + ')', a: g.amt, d: today(), k: 'in' });
    save(); closeModal(); renderWallet(); toast('+' + ec(g.amt) + ' redeemed!', 'ok');
  };
}
function disputeModal(orderId) {
  openModal('<h3>🛡️ Open a dispute' + (orderId ? ' — ' + esc(orderId) : '') + '</h3>' +
    '<label>Order<select id="dpOrder">' + S.orders.map(o => '<option' + (o.id === orderId ? ' selected' : '') + '>' + o.id + ' — ' + esc(o.title) + '</option>').join('') + '</select></label>' +
    '<label>Reason<select id="dpReason"><option>Not delivered</option><option>Wrong / damaged item</option><option>Digital file broken</option><option>Charged twice</option><option>Other</option></select></label>' +
    '<label>Details<textarea id="dpText" rows="3" placeholder="What happened? What resolution do you want?"></textarea></label>' +
    '<button class="btn primary block" id="dpGo">Submit — escrow frozen ❄</button>');
  $('#dpGo').onclick = () => {
    const o = $('#dpOrder').value.split(' — ')[0];
    S.disputes.unshift({ order: o, reason: $('#dpReason').value, status: 'Under review', date: today() });
    S.threads.unshift({ id: uid('T'), from: 'Resolution team', kind: 'dispute', title: 'Dispute: ' + o, preview: $('#dpReason').value, time: today(), unread: 1, msgs: [{ me: false, t: 'Thanks — escrow on ' + o + ' is frozen. A specialist replies within 24h. Most cases resolve in 2 days.' }] });
    notify('Dispute opened on ' + o + ' — escrow frozen.');
    save(); closeModal(); renderInbox(); renderDisputes(); renderInboxBadge(); toast('Dispute opened — we have got you 🛡️', 'ok'); nav('inbox'); S.inboxTab = 'disputes'; renderInbox();
  };
}

/* ---------- events wiring ---------- */
function wire() {
  $('#mobileMenuBtn').onclick = () => $('#mainNav').classList.toggle('open');
  $('#cartBtn').onclick = openCart;
  $('#closeCart').onclick = closeCart;
  $('#notifBtn').onclick = openNotif;
  $('#closeNotif').onclick = closeNotif;
  $('#clearNotif').onclick = () => { S.notifs.forEach(n => n.read = true); save(); renderNotifs(); renderNotifBadge(); };
  $('#overlay').onclick = () => { closeCart(); closeNotif(); closeModal(); };
  $('#userBtn').onclick = profileModal;
  $('#checkoutBtn').onclick = startCheckout;
  $('#couponBtn').onclick = () => applyCoupon($('#couponInput').value);
  const hint = $('#couponApplyHint'); if (hint) hint.onclick = () => { $('#couponInput').value = 'EMPOWER10'; applyCoupon('EMPOWER10'); openCart(); };
  $('#sortSelect').onchange = e => { S.sort = e.target.value; save(); renderMarket(); };
  $('#typeFilter').onchange = e => { S.type = e.target.value; save(); renderMarket(); };
  $('#priceFilter').onchange = e => { S.maxPrice = Number(e.target.value); save(); renderMarket(); };
  $('#stockToggle').onchange = e => { S.inStock = e.target.checked; save(); renderMarket(); };
  $('#coachFilter').onchange = e => { S.coachSpec = e.target.value; save(); renderCoaches(); };
  $('#coachSort').onchange = e => { S.coachSort = e.target.value; save(); renderCoaches(); };
  $('#txFilter').onchange = e => { S.txFilter = e.target.value; save(); renderWallet(); };
  $$('#revTabs button').forEach(b => b.onclick = () => { S.revRange = Number(b.dataset.r); $$('#revTabs button').forEach(x => x.classList.toggle('active', x === b)); drawChart(); });
  $$('#orderTabs button').forEach(b => b.onclick = () => { S.orderTab = b.dataset.tab; save(); renderOrders(); });
  bindSearch();
  // v3 wiring
  const cs = $('#currencySel'); if (cs) { cs.value = cur(); cs.onchange = e => { S.user.currency = e.target.value; save(); renderAll(); toast('Prices in ' + cur(), 'ok'); }; }
  $('#themeBtn').onclick = () => { S.theme = S.theme === 'light' ? 'dark' : 'light'; save(); applyTheme(); };
  $('#plusPill').onclick = plusModal;
  $('#giftBtn').onclick = giftModal;
  const nd = $('#newDisputeBtn'); if (nd) nd.onclick = () => disputeModal();
  const pg = $('#postGigBtn'); if (pg) pg.onclick = () => {
    openModal('<h3>Post a request</h3><label>What do you need?<input id="grTitle" placeholder="e.g. Edit 10 product videos" /></label><div class="row2"><label>Budget<input id="grBudget" type="number" value="100" min="5" /></label><label>Category<select id="grCat"><option>Design</option><option>Marketing</option><option>Finance</option><option>Career</option><option>Fitness</option></select></label></div><button class="btn primary block" id="grGo">Post — free →</button>');
    $('#grGo').onclick = () => {
      const t = $('#grTitle').value.trim(); if (!t) { toast('Describe the gig', 'err'); return; }
      S.gigRequests.unshift({ id: 'r' + Date.now(), title: t, budget: Number($('#grBudget').value) || 50, by: S.user.name.split(' ')[0] + ' (you)', bids: 0, cat: $('#grCat').value });
      save(); closeModal(); renderServices(); toast('Request posted — sellers will bid 📝', 'ok');
    };
  };
  const og = $('#offerGigBtn'); if (og) og.onclick = () => {
    openModal('<h3>Offer a gig</h3><label>Title<input id="ngTitle" placeholder="e.g. I will audit your store" /></label><div class="row2"><label>Price<input id="ngPrice" type="number" value="80" min="5" /></label><label>Delivery<select id="ngDel"><option>1 day</option><option>2 days</option><option>3 days</option><option>5 days</option></select></label></div><label>Description<textarea id="ngDesc" rows="2"></textarea></label><button class="btn primary block" id="ngGo">Publish gig →</button>');
    $('#ngGo').onclick = () => {
      const t = $('#ngTitle').value.trim(); if (!t) { toast('Add a title', 'err'); return; }
      S.gigs.unshift({ id: 'g' + Date.now(), title: t, seller: S.user.name + ' (you)', price: Number($('#ngPrice').value) || 50, rating: 5.0, orders: 0, img: '🛠️', cat: 'Design', delivery: $('#ngDel').value, desc: $('#ngDesc').value || 'Custom gig by ' + S.user.name });
      save(); closeModal(); renderServices(); toast('Gig live! 🛠️', 'ok');
    };
  };
  const gs = $('#gigSort'); if (gs) gs.onchange = renderServices;
  const ff = $('#feedFilter'); if (ff) ff.onchange = renderCommunity;
  const pb = $('#postBtn'); if (pb) pb.onclick = () => {
    const t = ($('#postTitle').value || '').trim(), b = ($('#postBody').value || '').trim();
    if (!t || !b) { toast('Add a title + story', 'err'); return; }
    S.posts.unshift({ id: 'f' + Date.now(), author: S.user.name, role: 'Member', av: S.user.emoji || '🧑‍🚀', topic: $('#postTopic').value, title: t, text: b, likes: 0, liked: false, time: 'now', comments: [] });
    $('#postTitle').value = ''; $('#postBody').value = '';
    save(); renderCommunity(); toast('Posted! 🎉', 'ok');
  };
  const cr = $('#copyRefBtn'); if (cr) cr.onclick = () => { try { navigator.clipboard.writeText(S.user.referral); } catch (e) {} toast('Code copied: ' + S.user.referral, 'ok'); };
  const iv = $('#inviteBtn'); if (iv) iv.onclick = () => { S.user.invites++; S.user.balance += 20; S.txs.unshift({ t: 'Referral bonus', a: 20, d: today(), k: 'in' }); notify('Invite accepted! +20 EC.'); save(); renderCommunity(); updateWalletUI(); toast('+20 EC referral bonus 🎁', 'ok'); };
  $('#howItWorksBtn').onclick = () => openModal('<h3>How Empower works ▶</h3><div class="timeline"><div class="t-step done"><div class="t-dot">1</div><div><b>Shop or list</b><div class="muted small">Buy verified goods or publish a listing in 60 seconds.</div></div></div><div class="t-step done"><div class="t-dot">2</div><div><b>Pay in EC credits</b><div class="muted small">1 EC = $1. Money sits in escrow — never sent direct.</div></div></div><div class="t-step done"><div class="t-dot">3</div><div><b>Get delivered or coached</b><div class="muted small">Confirm delivery → seller gets paid. Coaching includes recording + plan.</div></div></div></div><button class="btn primary block" onclick="closeModal()">Got it — let\'s earn</button>');
  const hb = $('#matchBtn');
  if (hb) hb.onclick = () => {
    openModal('<h3>✨ Coach match</h3><label>What do you want to improve?<select id="mGoal"><option>Business & income</option><option>Fitness & energy</option><option>Career & interviews</option><option>Design & portfolio</option></select></label><button class="btn primary block" id="mGo">Show my matches →</button>');
    $('#mGo').onclick = () => {
      const g = $('#mGoal').value;
      const map = { 'Business & income': 'Business', 'Fitness & energy': 'Fitness', 'Career & interviews': 'Career', 'Design & portfolio': 'Design' };
      S.coachSpec = map[g] || 'All'; save(); closeModal(); renderCoaches();
      toast('Matched 3 ' + S.coachSpec + ' coaches for you ✨', 'ok');
    };
  };
  /* sell form */
  const sf = $('#sellForm');
  sf.addEventListener('input', () => {
    const im = $('#sellImage').value.trim();
    $('#imgPreview').innerHTML = im ? (/^https?:\/\//.test(im) ? '<img src="' + esc(im) + '" onerror="this.outerHTML=\'📦\'" />' : esc(im)) : '📦';
    updateFeeBox();
  });
  sf.onsubmit = e => {
    e.preventDefault();
    const f = new FormData(sf);
    const title = String(f.get('title') || '').trim();
    const price = Number(f.get('price'));
    if (!title || !(price > 0)) { toast('Add a title + valid price', 'err'); return; }
    if (S.editingId) {
      const p = S.products.find(x => x.id === S.editingId);
      if (p) Object.assign(p, { title, category: f.get('category'), price, stock: Number(f.get('stock')), type: f.get('type'), img: f.get('image') || '📦', desc: f.get('description') });
      S.editingId = null;
      $('#sellFormTitle').textContent = '＋ New listing'; $('#sellSubmit').textContent = 'Publish listing →'; $('#sellCancelEdit').hidden = true;
      toast('Listing updated ✓', 'ok');
    } else {
      S.products.unshift({ id: 'p' + Date.now(), title, category: f.get('category'), price, stock: Number(f.get('stock')), type: f.get('type'), img: f.get('image') || '📦', seller: S.user.name + ' (you)', rating: 5.0, reviews: 0, sold: 0, mine: true, paused: false, created: 99, desc: f.get('description') });
      S.feed.unshift('⚡ New listing: ' + title + ' for ' + money(price));
      notify('Your listing "' + title + '" is live!');
      toast('Listing is live! 🎉', 'ok');
    }
    save(); sf.reset(); $('#imgPreview').textContent = '📦'; updateFeeBox();
    renderMarket(); renderSell(); renderDashboard();
    nav('marketplace');
  };
  $('#sellCancelEdit').onclick = () => { S.editingId = null; sf.reset(); $('#sellFormTitle').textContent = '＋ New listing'; $('#sellSubmit').textContent = 'Publish listing →'; $('#sellCancelEdit').hidden = true; };
  $('#addSampleBtn').onclick = () => {
    S.products.unshift({ id: 'p' + Date.now(), title: 'Sample: Vintage Film Camera', category: 'Tech', price: 199, stock: 3, type: 'Physical', img: '📷', seller: S.user.name + ' (you)', rating: 5.0, reviews: 0, sold: 0, mine: true, paused: false, created: 99, desc: 'Fully tested 35mm camera + strap. Sample listing — edit me!' });
    save(); renderSell(); renderMarket(); toast('Sample listing added', 'ok');
  };
  /* coach form */
  const cf = $('#coachForm');
  cf.addEventListener('input', () => {
    const f = new FormData(cf);
    $('#coachPreview').innerHTML = '<b>' + esc(f.get('name') || 'Your name') + '</b> · ' + esc(f.get('specialty') || 'Business') + '<br />“' + esc(f.get('headline') || 'Your headline…') + '”<br /><span>' + money(Number(f.get('rate')) || 60) + '/hr • ' + (f.get('years') || 5) + 'y exp</span>';
  });
  cf.onsubmit = e => {
    e.preventDefault();
    const f = new FormData(cf);
    const mc = { id: 'c' + Date.now(), name: f.get('name'), specialty: f.get('specialty'), headline: f.get('headline'), rate: Number(f.get('rate')), years: Number(f.get('years')), rating: 5.0, sessions: 0, img: '🧑‍🏫', bio: f.get('bio') };
    S.coaches.unshift(mc); S.myCoach = mc;
    S.txs.unshift({ t: 'Coach welcome bonus', a: 25, d: today(), k: 'in' });
    S.user.balance += 25;
    notify('Coach profile live! You earned a 25 EC bonus.');
    save(); renderCoaches(); updateWalletUI();
    toast('Welcome, Coach! +25 EC 🎓', 'ok'); nav('coaches');
  };
  /* wallet */
  $('#addFundsBtn').onclick = () => openModal('<h3>Add funds</h3><p class="muted small">Instant • No fee • Visa ••4242</p><div class="row2"><button class="btn primary" data-af="50">+$50</button><button class="btn primary" data-af="100">+$100</button></div><div class="row2" style="margin-top:8px"><button class="btn primary" data-af="500">+$500</button><button class="btn" onclick="closeModal()">Cancel</button></div>');
  document.addEventListener('click', e => {
    const af = e.target.closest('[data-af]');
    if (af) { const n = Number(af.dataset.af); S.user.balance += n; S.txs.unshift({ t: 'Added funds — Visa ••4242', a: n, d: today(), k: 'in' }); save(); closeModal(); renderWallet(); toast('+' + ec(n) + ' added ⚡', 'ok'); }
  });
  $('#payoutBtn').onclick = () => openModal('<h3>Cash out to bank ••6789</h3><p class="muted small">Arrives in 2 business days. No fee over $50, else $1 fee.</p><label>Amount (EC)<input id="payoutAmt" type="number" value="200" min="10" max="' + S.user.balance + '" /></label><button class="btn primary block" id="poGo">Withdraw →</button>');
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'poGo') {
      const n = Number($('#payoutAmt').value);
      if (!n || n < 10 || n > S.user.balance) { toast('Invalid amount', 'err'); return; }
      const fee = n < 50 ? 1 : 0;
      S.user.balance -= n; S.txs.unshift({ t: 'Cash out — Bank ••6789' + (fee ? ' (incl $1 fee)' : ''), a: -(n), d: today(), k: 'out' });
      notify('Payout of ' + money(n) + ' on the way to ••6789.');
      save(); closeModal(); renderWallet(); toast('Payout on the way 🏦', 'ok');
    }
  });
  $('#transferBtn').onclick = () => openModal('<h3>Send EC to a friend</h3><label>Recipient<input id="sendTo" placeholder="@username or email" /></label><label>Amount<input id="sendAmt" type="number" value="25" min="1" /></label><button class="btn primary block" id="sendGo">Send →</button>');
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'sendGo') {
      const n = Number($('#sendAmt').value);
      const to = ($('#sendTo') || {}).value || 'friend';
      if (!n || n < 1 || n > S.user.balance) { toast('Invalid amount', 'err'); return; }
      S.user.balance -= n; S.txs.unshift({ t: 'Sent EC to ' + to, a: -n, d: today(), k: 'out' });
      save(); closeModal(); renderWallet(); toast('Sent ' + ec(n) + ' ⚡', 'ok');
    }
  });
  $('#exportTxBtn').onclick = txCSV;
  $('#exportCsvBtn').onclick = txCSV;
  $('#resetDemo').onclick = () => { if (!confirm('Reset all demo data?')) return; localStorage.removeItem(KEY); S = seed(); S.onboarded = true; save(); renderAll(); toast('Demo reset ✓'); };
  const fe = $('#footEscrow'); if (fe) fe.onclick = e => { e.preventDefault(); openModal('<h3>Escrow & returns</h3><p>Every payment is held in escrow and released only on confirmed delivery (or auto-released after 7 days). 14-day returns on physical goods. Digital goods: instant delivery + 48h refund window if broken.</p><button class="btn primary block" onclick="closeModal()">Got it</button>'); };
  const ffee = $('#footFees'); if (ffee) ffee.onclick = e => { e.preventDefault(); openModal('<h3>Fees — simple</h3><div class="list-row"><div class="grow"><b>Buyers</b><span>No fees, ever</span></div><span class="tag ok">$0</span></div><div class="list-row"><div class="grow"><b>Sellers</b><span>5% on sale only</span></div><span class="tag ok">5%</span></div><div class="list-row"><div class="grow"><b>Coaches</b><span>10% on bookings</span></div><span class="tag ok">10%</span></div><button class="btn primary block" style="margin-top:10px" onclick="closeModal()">Close</button>'); };
  const fh = $('#footHelp'); if (fh) fh.onclick = e => { e.preventDefault(); openModal('<h3>Help center</h3><p class="muted">Coupon codes: EMPOWER10 (10%), WELCOME15 (15%). Press <b>/</b> to search. Data is stored locally — Reset demo restores everything.</p><button class="btn primary block" onclick="closeModal()">Close</button>'); };
}

/* ---------- live sim + init ---------- */
function liveSim() {
  const names = ['Lena', 'Tom', 'Ava', 'Kai', 'Mia', 'Leo'];
  const items = ['Leather Tote', 'Brush Pack', 'Mug Duo', 'Desk Lamp', 'Contract Kit'];
  setInterval(() => {
    if (document.hidden) return;
    S.feed.unshift('🔥 ' + names[Math.floor(Math.random() * names.length)] + ' just bought ' + items[Math.floor(Math.random() * items.length)]);
    S.feed = S.feed.slice(0, 12);
    const oc = $('#onlineCount');
    if (oc) oc.textContent = (12000 + Math.floor(Math.random() * 900)).toLocaleString();
    if ($('#view-marketplace').classList.contains('active')) { const f = $('#activityFeed'); if (f) f.innerHTML = S.feed.slice(0, 6).map(x => '<div class="feed-item">' + esc(x) + '</div>').join(''); }
  }, 15000);
}
function renderAll() {
  applyTheme(); syncPlus();
  renderMarket(); renderDeals(); renderServices(); renderLearn(); renderCoaches(); renderCommunity(); renderInbox(); renderSell(); renderWallet(); renderOrders(); renderDashboard(); renderWishlist(); renderNotifBadge(); renderInboxBadge();
  const h = (location.hash || '').replace('#/', '');
  if (h && VIEWS.indexOf(h) >= 0 && h !== 'marketplace') nav(h);
}
wire();
renderAll();
maybeOnboard();
liveSim();
setInterval(tickDeals, 1000);
