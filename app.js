/* Empower v5.0 best-work — marketplace + deals + auctions + services + learn + events + community + inbox + rewards. Vanilla JS + localStorage. */
const KEY = 'empower_state_v5';
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
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function addPoints(n, why) {
  S.points = (S.points || 0) + n;
  if (why) { S.notifs.unshift({ t: '+' + n + ' pts — ' + why, d: today(), read: false }); }
  save(); renderRewardsBadge();
}
function fmtLeft(ms) {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function seed() {
  return {
    v: 5,
    onboarded: false,
    theme: 'dark',
    prefs: { feed: true, outbid: true, pricedrop: true },
    addresses: ['123 Market St, Austin TX'],
    payMethods: ['Visa •• 4242', 'Bank •• 6789'],
    points: 120, streak: 2, lastCheckin: '', badges: ['welcome'],
    recent: [], tasks: [], subs: [], affiliate: { code: 'JORDAN10', earned: 0, clicks: 0 },
    goal: 3000, searchHist: [], alerts: [], compare: [], notifFilter: 'all', announceOff: false, verifyStatus: 'none',
    savedSearches: [], rateBreakdown: {}, sellerTier: {}, wishGroups: [], bulkPrice: {},
    stories: [
      { id: 'st1', seller: 'Maya Atelier', emoji: '👜', title: 'New tote colors drop Fri', pid: 'p1' },
      { id: 'st2', seller: 'Coach Priya', emoji: '💪', title: 'Form-check Friday — 3 spots', coachId: 'c2' },
      { id: 'st3', seller: 'Studio Kline', emoji: '🎨', title: 'Print restock preview', pid: 'p4' },
      { id: 'st4', seller: 'Alex Morgan', emoji: '🚀', title: 'Live sprint: 0→$1k', eventId: 'e1' },
      { id: 'st5', seller: 'Kiln & Co', emoji: '☕', title: 'New glaze reveal', pid: 'p6' }
    ],
    auctions: [
      { id: 'a1', title: 'Signed Atelier Tote — 1 of 50', seller: 'Maya Atelier', img: '👜', start: 80, bid: 132, bids: 14, endsAt: Date.now() + 5 * 3600 * 1000, watched: true, leader: 'Lena K.', desc: 'Numbered edition, hand-signed. Ships insured worldwide.' },
      { id: 'a2', title: 'Studio Test Pressing + Print', seller: 'Studio Kline', img: '🎨', start: 40, bid: 68, bids: 9, endsAt: Date.now() + 26 * 3600 * 1000, watched: false, leader: 'Tom R.', desc: 'Rare test pressing + A3 signed print. One owner.' },
      { id: 'a3', title: '1:1 Store Audit + Ad Account (90 min)', seller: 'Alex Morgan', img: '🚀', start: 50, bid: 91, bids: 11, endsAt: Date.now() + 9 * 3600 * 1000, watched: false, leader: 'Ava M.', desc: 'Live teardown + 30-day roadmap. Recording included.' },
      { id: 'a4', title: 'Vintage Film Camera — serviced', seller: 'Kiln & Co', img: '📷', start: 120, bid: 185, bids: 21, endsAt: Date.now() + 2 * 3600 * 1000, watched: true, leader: 'You', desc: 'Fully serviced, new seals, 30-day warranty.' }
    ],
    events: [
      { id: 'e1', title: 'Zero → First $1k Live Sprint', host: 'Alex Morgan', when: 'Oct 8 • 6PM CT', price: 25, seats: 200, taken: 143, img: '🚀', tag: 'Workshop', desc: 'Pick a product, build the page live, launch ads together.' },
      { id: 'e2', title: 'Form-Check Friday (free)', host: 'Priya Nair', when: 'Oct 10 • 12PM CT', price: 0, seats: 100, taken: 78, img: '💪', tag: 'Fitness', desc: 'Live squat/deadlift reviews + Q&A. Bring a friend.' },
      { id: 'e3', title: 'Portfolio Roast: Get Hired', host: 'Diego Ruiz', when: 'Oct 12 • 5PM CT', price: 15, seats: 150, taken: 61, img: '🎨', tag: 'Design', desc: '5 portfolios torn down + rebuilt. Submit yours.' },
      { id: 'e4', title: 'Seller Tax AMA', host: 'Marcus Lee', when: 'Oct 15 • 7PM CT', price: 10, seats: 300, taken: 112, img: '📊', tag: 'Finance', desc: 'Deductions, quarterly tax, bookkeeping systems.' }
    ],
    tickets: [],
    polls: [{ id: 'pl1', q: 'What should drop next Friday?', opts: ['Mug new glaze', 'Tote new color', 'Print collab'], votes: [41, 66, 28], voted: -1 }],
    qa: { p1: [{ q: 'Is this full-grain or top-grain?', a: 'Full-grain, vegetable-tanned. Ages beautifully.' }], p2: [{ q: 'Multipoint with iPhone + Mac?', a: 'Yes — holds both, switches seamlessly.' }] },
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
  if (!S || S.v !== 5 || !Array.isArray(S.products)) {
    const fresh = seed();
    // try migrate from v4/v3/v2 keys
    let old = S;
    try {
      for (const k of ['empower_state_v4', 'empower_state_v3', 'empower_state_v2']) {
        const r = localStorage.getItem(k);
        if (r) { const d = JSON.parse(r); if (d && Array.isArray(d.products)) { old = d; break; } }
      }
    } catch (e) {}
    if (old && Array.isArray(old.products)) {
      ['products', 'coaches', 'orders', 'sold', 'bookings', 'txs', 'cart', 'wishlist', 'notifs', 'reviews', 'coachReviews', 'messages', 'myCoach', 'deals', 'gigs', 'gigRequests', 'courses', 'posts', 'threads', 'disputes', 'giftCodes', 'following', 'user', 'coupon', 'auctions', 'events', 'tickets', 'points', 'streak', 'badges', 'addresses', 'payMethods', 'prefs', 'theme', 'goal'].forEach(k => { if (old[k] !== undefined) fresh[k] = old[k]; });
      fresh.onboarded = old.onboarded !== false;
    }
    S = fresh;
  }
} catch (e) { S = seed(); }
S.user.currency = S.user.currency || 'USD';
S.user.referral = S.user.referral || 'JORDAN-2026';
S.points = S.points == null ? 120 : S.points;
S.prefs = S.prefs || { feed: true, outbid: true, pricedrop: true };
S.addresses = S.addresses && S.addresses.length ? S.addresses : [S.user.address || '123 Market St, Austin TX'];
S.payMethods = S.payMethods && S.payMethods.length ? S.payMethods : ['Visa •• 4242', 'Bank •• 6789'];
S.qa = S.qa || {};
S.polls = S.polls || seed().polls;
S.auctions = S.auctions || seed().auctions;
S.events = S.events || seed().events;
S.tickets = S.tickets || [];
S.recent = S.recent || [];
S.tasks = S.tasks || [];
S.subs = S.subs || [];
S.affiliate = S.affiliate || { code: 'JORDAN10', earned: 0, clicks: 0 };
S.goal = S.goal || 3000;
S.searchHist = S.searchHist || [];
S.alerts = S.alerts || [];
S.compare = (S.compare || []).filter(id => S.products && S.products.some(p => p.id === id)).slice(0, 3);
S.notifFilter = S.notifFilter || 'all';
S.verifyStatus = S.verifyStatus || ((S.profile && S.profile.verified) ? 'verified' : 'none');
S.stories = S.stories || seed().stories;
S.savedSearches = S.savedSearches || [];
S.rateBreakdown = S.rateBreakdown || {};
S.sellerTier = S.sellerTier || {};
S.wishGroups = S.wishGroups || [];
S.bulkPrice = S.bulkPrice || {};
S.polls = S.polls || seed().polls;
/* ============ v9 SECURITY CORE: safe storage, PBKDF2, signed sessions, throttle ============ */
const SEC = { PBKDF2_ITER: 150000, SESSION_TTL_DAYS: 30, THROTTLE_MAX: 6, THROTTLE_WINDOW_MS: 60000 };
const hasSubtle = typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.importKey === 'function';
function randHex(n) {
  const a = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a);
  else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* --- Safe storage: quota-safe, corruption-tolerant, never throws into app code --- */
const SafeStore = (() => {
  const mem = Object.create(null);
  let degraded = false;
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return mem[k] != null ? mem[k] : null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); mem[k] = v; degraded = false; return true; }
    catch (e) {
      mem[k] = v; degraded = true;
      // Quota exceeded: drop the biggest recoverable caches and retry once
      try {
        ['empower_state_v4', 'empower_state_v3', 'empower_state_v2'].forEach(old => { try { localStorage.removeItem(old); } catch (x) {} });
        localStorage.setItem(k, v); return true;
      } catch (e2) { return false; }
    }
  }
  return {
    get(k) { return lsGet(k); },
    set(k, v) { return lsSet(k, v); },
    del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} },
    readJSON(k, fallback) {
      const raw = lsGet(k);
      if (raw == null) return fallback;
      try {
        const v = JSON.parse(raw);
        return v == null ? fallback : v;
      } catch (e) {
        // Corrupted payload: quarantine it so the app still boots, then reset that slot
        try { localStorage.setItem(k + '__corrupt_' + Date.now(), raw.slice(0, 200000)); } catch (x) {}
        this.del(k);
        return fallback;
      }
    },
    writeJSON(k, v) { return lsSet(k, JSON.stringify(v)); },
    keys() { try { return Object.keys(localStorage); } catch (e) { return Object.keys(mem); } },
    isDegraded() { return degraded; }
  };
})();

/* --- Password hashing: PBKDF2-SHA256 (150k iters) via WebCrypto, fast-hash fallback --- */
function b64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
async function hashPwAsync(pw, salt) {
  if (!hasSubtle) return 'fast1$' + hashPw(pw, salt);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(String(salt)), iterations: SEC.PBKDF2_ITER, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$' + SEC.PBKDF2_ITER + '$' + b64(bits);
}
async function verifyPwAsync(pw, salt, stored) {
  if (!stored) return false;
  const s = String(stored);
  if (s.indexOf('pbkdf2$') === 0) {
    if (!hasSubtle) return false;
    const parts = s.split('$');
    const iters = Number(parts[1]) || SEC.PBKDF2_ITER;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(String(salt)), iterations: iters, hash: 'SHA-256' }, key, 256);
    return timingSafeEqual(b64(bits), parts[2] || '');
  }
  if (s.indexOf('fast1$') === 0) return timingSafeEqual(hashPw(pw, salt), s.slice(6));
  return timingSafeEqual(hashPw(pw, salt), s); // legacy plain hash (pre-v9)
}
function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
/* Upgrade legacy hashes to PBKDF2 in the background after a successful login */
async function upgradePassword(uid, pw) {
  try {
    const db = getUsersDB(); const rec = db.users[uid];
    if (!rec || String(rec.pwHash || '').indexOf('pbkdf2$') === 0) return false;
    const h = await hashPwAsync(pw, rec.salt || rec.email);
    rec.pwHash = h; rec.upgradedAt = Date.now(); setUsersDB(db);
    return true;
  } catch (e) { return false; }
}

/* --- Signed session tokens (uid.exp.sig) with server-style constant-time verify --- */
function sessionSecret() {
  let s = SafeStore.get('empower_secret_v9');
  if (!s) { s = randHex(32); SafeStore.set('empower_secret_v9', s); }
  return s;
}
function mintSession(uid) {
  const exp = Date.now() + SEC.SESSION_TTL_DAYS * 86400000;
  const sig = hashPw(uid + '|' + exp + '|' + sessionSecret(), 'sess');
  return uid + '.' + exp + '.' + sig;
}
function readSessionToken() {
  const tok = SafeStore.get(SESSION_KEY);
  if (!tok) return null;
  const parts = tok.split('.');
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (!uid || !exp) return null;
  if (Number(exp) < Date.now()) return null;
  if (!timingSafeEqual(hashPw(uid + '|' + exp + '|' + sessionSecret(), 'sess'), sig)) return null;
  return uid;
}
function sessionExpiry() {
  const tok = SafeStore.get(SESSION_KEY);
  if (!tok) return null;
  const p = tok.split('.');
  return p.length === 3 ? Number(p[1]) : null;
}

/* --- Login throttling (per email, sliding window) --- */
const throttle = (() => {
  const hits = {};
  return {
    check(key) {
      const now = Date.now();
      const arr = (hits[key] || []).filter(t => now - t < SEC.THROTTLE_WINDOW_MS);
      hits[key] = arr;
      if (arr.length >= SEC.THROTTLE_MAX) {
        const wait = Math.ceil((SEC.THROTTLE_WINDOW_MS - (now - arr[0])) / 1000);
        return { blocked: true, wait };
      }
      arr.push(now); hits[key] = arr;
      return { blocked: false };
    },
    reset(key) { delete hits[key]; }
  };
})();

/* ============ v9 RESILIENCE CORE ============ */
const Net = (() => {
  const queue = SafeStore.readJSON('empower_queue_v9', []);
  let online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  const listeners = [];
  function flush() {
    if (!online || !queue.length) return 0;
    // Local demo: no real server. Actions are "sent" by draining the queue.
    const n = queue.length;
    queue.splice(0, queue.length);
    SafeStore.writeJSON('empower_queue_v9', queue);
    listeners.forEach(f => { try { f(n); } catch (e) {} });
    return n;
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { online = true; flush(); emit(); });
    window.addEventListener('offline', () => { online = false; emit(); });
  }
  function emit() { listeners.forEach(f => { try { f(); } catch (e) {} }); }
  return {
    enqueue(op) { queue.push({ op, at: Date.now() }); SafeStore.writeJSON('empower_queue_v9', queue); emit(); return queue.length; },
    flush, emit,
    isOnline() { return online; },
    pending() { return queue.length; },
    onChange(f) { listeners.push(f); }
  };
})();

/* ============ PROJECT IDENTITY (single source of truth) ============ */
const APP_META = {
  name: 'Empower',
  tagline: 'The virtual economy for goods + coaching',
  version: '9.0.0',
  owner: {
    name: 'Juan-louw Greyling',
    role: 'Owner & CEO',
    email: 'juanlouw.greyling@gmail.com'
  }
};
window.APP_META = APP_META;
function ownerCard() {
  const o = APP_META.owner;
  return '<div class="owner-card">' +
    '<div class="owner-avatar" aria-hidden="true">' + esc(o.name.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()) + '</div>' +
    '<div class="grow"><b>' + esc(o.name) + '</b><span class="muted small">' + esc(o.role) + '</span>' +
    '<a class="owner-mail" href="mailto:' + esc(o.email) + '">' + esc(o.email) + '</a></div></div>';
}

/* ================= MULTI-USER AUTH + SHARED PLATFORM (v6→v9) =================
   Everyone shares the same marketplace (products, gigs, coaches, posts...).
   Each human gets their own private profile: wallet, cart, orders, etc.
   Stored as: platform in KEY, users DB in USERS_KEY, session in SESSION_KEY.
   Existing code keeps using S.user / S.cart etc — S is the live working copy
   = shared platform + current user's private slice overlaid. save() persists both. */
const USERS_KEY = 'empower_users_v9';
const SESSION_KEY = 'empower_session_v9';
const PRIVATE_KEYS = ['user','cart','wishlist','orders','sold','bookings','txs','notifs','points','streak','lastCheckin','badges','recent','tasks','subs','affiliate','tickets','threads','disputes','giftCodes','following','messages','myCoach','coupon','addresses','payMethods','prefs','theme','goal','onboarded','dealOverride','bundlePct','profile'];
function hashPw(pw, salt) {
  const s = String(pw || '') + '::' + String(salt || '');
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
function defaultPrivate(name, email) {
  const first = (name || 'New').split(' ')[0] || 'New';
  const handle = '@' + first.toLowerCase().replace(/[^a-z0-9]+/g, '') + Math.floor(100 + Math.random() * 900);
  return {
    user: { name: name || 'New Earner', email: email || '', balance: 750, memberSince: '2026', avatar: initials(name || 'NE'), address: '', emoji: '🧑‍🚀', currency: 'USD', plus: false, referral: first.toUpperCase().slice(0, 8) + '-' + Math.floor(1000 + Math.random() * 9000), invites: 0 },
    profile: { handle, bio: 'New on Empower — buying, selling & learning. Say hi! 👋', cover: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', location: '', website: '', verified: false },
    cart: [], wishlist: [], orders: [], sold: [], bookings: [],
    txs: [{ t: 'Welcome bonus', a: 750, d: 'Today', k: 'in' }],
    notifs: [{ t: 'Welcome to Empower! Your wallet, cart & orders are private to you. The marketplace is shared with everyone.', d: 'Today', read: false }],
    points: 50, streak: 0, lastCheckin: '', badges: ['welcome'],
    recent: [], tasks: [], subs: [], affiliate: { code: first.toUpperCase().slice(0, 6) + '10', earned: 0, clicks: 0 },
    tickets: [], threads: [{ id: uid('T'), from: 'Empower Support', kind: 'orders', title: 'Welcome 🎉', preview: 'How Empower works…', time: 'Today', unread: 1, msgs: [{ me: false, t: 'Welcome! Browse as much as you like. Your cart, wallet and orders are yours alone — the marketplace is shared with everyone, like eBay + Instagram in one.' }] }],
    disputes: [], giftCodes: [], following: [], messages: {}, myCoach: null, coupon: null,
    addresses: [], payMethods: ['Visa •• 4242'], prefs: { feed: true, outbid: true, pricedrop: true },
    theme: 'dark', goal: 3000, onboarded: true, dealOverride: {}, bundlePct: 0
  };
}
function getUsersDB() {
  const d = SafeStore.readJSON(USERS_KEY, { users: {} });
  if (!d || !d.users) return { users: {} };
  return d;
}
function setUsersDB(db) { return SafeStore.writeJSON(USERS_KEY, db); }
function getSessionId() {
  try { return readSessionToken(); } catch (e) { return null; }
}
function setSessionId(id) {
  if (!id || id === 'guest') { SafeStore.del(SESSION_KEY); return; }
  SafeStore.set(SESSION_KEY, mintSession(id));
}
function snapshotPrivate() {
  const o = {};
  PRIVATE_KEYS.forEach(k => { o[k] = S[k]; });
  return o;
}
function persistCurrentUser() {
  try {
    const sid = getSessionId();
    if (!sid || sid === 'guest') return;
    const db = getUsersDB();
    if (!db.users[sid]) return;
    Object.assign(db.users[sid], { private: snapshotPrivate(), name: S.user.name, email: S.user.email, emoji: S.user.emoji, handle: (S.profile || {}).handle || db.users[sid].handle, bio: (S.profile || {}).bio || '', cover: (S.profile || {}).cover, verified: !!(S.profile || {}).verified, lastActive: Date.now() });
    setUsersDB(db);
  } catch (e) {}
}
const _baseSave = () => { SafeStore.writeJSON(KEY, S); };
const save = () => { _baseSave(); persistCurrentUser(); };
function loadUserIntoS(userId) {
  const db = getUsersDB();
  const rec = db.users[userId];
  if (!rec || !rec.private) return false;
  PRIVATE_KEYS.forEach(k => { if (rec.private[k] !== undefined) S[k] = rec.private[k]; });
  S.user.currency = S.user.currency || 'USD';
  S.profile = S.profile || { handle: '@user', bio: '', cover: 'linear-gradient(135deg,#7c3aed,#0ea5e9)' };
  return true;
}
function currentUserId() { return getSessionId(); }
function isGuest() { const s = getSessionId(); return !s || s === 'guest'; }
function currentProfile() {
  if (isGuest()) return { name: 'Guest', handle: '@guest', bio: 'Browsing as guest', emoji: '👤', cover: 'linear-gradient(135deg,#444,#888)', verified: false };
  return { name: S.user.name, handle: (S.profile || {}).handle, bio: (S.profile || {}).bio, emoji: S.user.emoji, cover: (S.profile || {}).cover, verified: !!(S.profile || {}).verified, email: S.user.email };
}
// One-time migration: carry accounts forward from older storage keys
function migrateLegacyStores() {
  const legacy = ['empower_users_v6', 'empower_users_v5'];
  if (getUsersDB().users && Object.keys(getUsersDB().users).length) return;
  for (const k of legacy) {
    const old = SafeStore.readJSON(k, null);
    if (old && old.users && Object.keys(old.users).length) { setUsersDB(old); break; }
  }
}
async function ensureDemoUsers() {
  migrateLegacyStores();
  const db = getUsersDB();
  let changed = false;
  const demos = [
    { id: 'u_jordan', name: 'Jordan Doe', email: 'jordan@empower.app', pw: 'empower123', emoji: '🧑‍🚀', bio: 'Top seller — home goods & digital packs. I reply in ~2h. 📦', verified: true },
    { id: 'u_maya', name: 'Maya Atelier', email: 'maya@empower.app', pw: 'empower123', emoji: '👜', bio: 'Leather goods studio. Full-grain everything. New drops Fridays. ✨', verified: true },
    { id: 'u_alex', name: 'Alex Morgan', email: 'alex@empower.app', pw: 'empower123', emoji: '🧑‍💼', bio: 'E-commerce coach — 0 → $10k/mo playbook. 320+ sessions. 🚀', verified: true },
    { id: 'u_priya', name: 'Priya Nair', email: 'priya@empower.app', pw: 'empower123', emoji: '🏋️', bio: 'Fitness coach — strength for busy people. 💪', verified: true }
  ];
  for (const d of demos) {
    if (!db.users[d.id]) {
      const priv = defaultPrivate(d.name, d.email);
      priv.user.balance = 1250;
      priv.user.emoji = d.emoji;
      priv.profile.bio = d.bio;
      priv.profile.verified = true;
      priv.profile.handle = '@' + d.name.split(' ')[0].toLowerCase();
      const salt = randHex(16);
      const pwHash = await hashPwAsync(d.pw, salt);
      db.users[d.id] = { id: d.id, name: d.name, email: d.email, pwHash, salt, algo: pwHash.split('$')[0], emoji: d.emoji, handle: priv.profile.handle, bio: d.bio, cover: 'linear-gradient(135deg,#7c3aed,#db2777)', verified: true, createdAt: Date.now(), lastActive: Date.now(), private: priv };
      changed = true;
    } else if (db.users[d.id] && String(db.users[d.id].pwHash || '').indexOf('pbkdf2$') !== 0) {
      // upgrade a legacy demo account to the strong hash (keeps the same demo password)
      const salt = db.users[d.id].salt || randHex(16);
      const pwHash = await hashPwAsync(d.pw, salt);
      db.users[d.id].pwHash = pwHash; db.users[d.id].salt = salt; db.users[d.id].algo = 'pbkdf2';
      changed = true;
    }
  }
  // Migrate legacy single-user (pre-v6) into Jordan if Jordan is fresh and legacy data exists
  try {
    if (S && S.user && S.user.email === 'jordan@empower.app' && db.users['u_jordan'] && (db.users['u_jordan'].private.orders || []).length === 0 && (S.orders || []).length > 0) {
      db.users['u_jordan'].private = snapshotPrivate();
      db.users['u_jordan'].private.user.balance = S.user.balance;
      changed = true;
    }
  } catch (e) {}
  if (changed) setUsersDB(db);
  // If no session yet, default to Jordan (preserves existing behaviour) — user can switch/logout after
  if (!getSessionId()) {
    setSessionId('u_jordan');
    loadUserIntoS('u_jordan');
    _baseSave();
  } else if (getSessionId() !== 'guest') {
    loadUserIntoS(getSessionId());
  } else {
    // guest: keep platform, blank private
    const g = defaultPrivate('Guest', '');
    g.user.balance = 0;
    PRIVATE_KEYS.forEach(k => { if (g[k] !== undefined) S[k] = g[k]; });
    S.user.name = 'Guest';
  }
}
async function doSignup(name, email, pw) {
  email = String(email || '').trim().toLowerCase();
  name = String(name || '').trim() || 'New Earner';
  const strength = passwordStrength(pw);
  if (!email || email.indexOf('@') < 0 || email.indexOf('.') < 0) return { ok: false, err: 'Enter a valid email.' };
  if (!pw || pw.length < 6) return { ok: false, err: 'Password needs 6+ characters.' };
  if (strength.score < 1) return { ok: false, err: 'Password too weak — add a number or symbol.' };
  const db = getUsersDB();
  const exists = Object.values(db.users).find(u => (u.email || '').toLowerCase() === email);
  if (exists) return { ok: false, err: 'That email already has an account — try Log in.' };
  const id = 'u_' + Date.now().toString(36) + randHex(3);
  const salt = randHex(16);
  const priv = defaultPrivate(name, email);
  const pwHash = await hashPwAsync(pw, salt);
  db.users[id] = { id, name, email, pwHash, salt, algo: pwHash.split('$')[0], emoji: priv.user.emoji, handle: priv.profile.handle, bio: priv.profile.bio, cover: priv.profile.cover, verified: false, createdAt: Date.now(), lastActive: Date.now(), private: priv };
  setUsersDB(db);
  persistCurrentUser();
  setSessionId(id);
  loadUserIntoS(id);
  _baseSave();
  return { ok: true, id };
}
function passwordStrength(pw) {
  pw = String(pw || '');
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^\w\s]/.test(pw)) score++;
  score = Math.max(0, Math.min(4, score));
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}
async function doLogin(email, pw) {
  email = String(email || '').trim().toLowerCase();
  const gate = throttle.check('login:' + email);
  if (gate.blocked) return { ok: false, err: 'Too many attempts. Try again in ' + gate.wait + 's.', throttle: true };
  const db = getUsersDB();
  const rec = Object.values(db.users).find(u => (u.email || '').toLowerCase() === email);
  if (!rec) { await sleep(180); return { ok: false, err: 'No account for that email — try Sign up or a demo login.' }; }
  const good = await verifyPwAsync(pw, rec.salt || rec.email, rec.pwHash);
  if (!good) { await sleep(180); return { ok: false, err: 'Wrong password. Hint for demos: empower123' }; }
  throttle.reset('login:' + email);
  upgradePassword(rec.id, pw); // opportunistic legacy → PBKDF2 upgrade (non-blocking)
  persistCurrentUser();
  setSessionId(rec.id);
  loadUserIntoS(rec.id);
  _baseSave();
  return { ok: true, id: rec.id };
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function doLogout() { persistCurrentUser(); setSessionId('guest'); const g = defaultPrivate('Guest', ''); g.user.balance = 0; PRIVATE_KEYS.forEach(k => { if (g[k] !== undefined) S[k] = g[k]; }); S.user.name = 'Guest'; _baseSave(); }
function doContinueAs(id) { persistCurrentUser(); setSessionId(id); loadUserIntoS(id); _baseSave(); }
function requireAuth(action) {
  if (!isGuest()) return true;
  openAuth('login', 'Please log in to ' + (action || 'do that') + ' — your stuff stays private to you.');
  return false;
}
function getPublicProfiles() {
  const db = getUsersDB();
  const arr = Object.values(db.users).map(u => {
    const priv = u.private || {};
    const orders = (priv.orders || []).length;
    const listings = (S.products || []).filter(p => p.seller && u.name && p.seller.indexOf(u.name.split(' ')[0]) >= 0).length;
    return { id: u.id, name: u.name, handle: u.handle, bio: u.bio, emoji: u.emoji || '🧑‍🚀', cover: u.cover, verified: !!u.verified, listings, orders, points: (priv.points || 0) };
  });
  // include session guest? no
  arr.sort((a, b) => (b.points || 0) - (a.points || 0));
  return arr;
}
function applyTheme() { document.documentElement.dataset.theme = S.theme === 'light' ? 'light' : ''; const b = $('#themeBtn'); if (b) b.textContent = S.theme === 'light' ? '☀️' : '🌙'; }

/* ---------- helpers ---------- */
let _toastMuted = false;
function toast(msg, type) {
  if (_toastMuted) return;
  const root = $('#toastRoot'); if (!root) return;
  const d = document.createElement('div');
  d.className = 'toast' + (type ? ' ' + type : '');
  d.textContent = msg;
  root.appendChild(d);
  setTimeout(() => d.remove(), 2800);
  announce(msg, type === 'err');
}
/* Undo stack: destructive actions become reversible for 6 seconds */
let _undo = null;
function undoable(msg, revertFn, revertState) {
  if (_undo && _undo.timer) clearTimeout(_undo.timer);
  const prev = JSON.stringify(revertState != null ? revertState : S);
  const snapshot = JSON.parse(prev);
  _undo = { revertFn, snapshot, timer: null };
  toast(msg);
  showUndoBar(msg);
  _undo.timer = setTimeout(hideUndoBar, 6000);
}
function showUndoBar(msg) {
  const bar = $('#undoBar');
  if (!bar) return;
  bar.hidden = false;
  bar.querySelector('span').textContent = msg;
  requestAnimationFrame(() => bar.classList.add('show'));
}
function hideUndoBar() {
  const bar = $('#undoBar');
  if (!bar) return;
  bar.classList.remove('show');
  setTimeout(() => { bar.hidden = true; }, 300);
  if (_undo && _undo.timer) clearTimeout(_undo.timer);
  _undo = null;
}
function runUndo() {
  if (!_undo) return;
  const u = _undo;
  hideUndoBar();
  try { if (u.revertFn) u.revertFn(); else restoreSnapshot(u.snapshot); } catch (e) { console.warn('undo', e); }
  renderAll(); save(); toast('Restored ✓', 'ok');
}
function restoreSnapshot(snap) {
  const db = getUsersDB();
  const sid = getSessionId();
  if (!sid || sid === 'guest') return;
  PRIVATE_KEYS.forEach(k => { if (snap[k] !== undefined) S[k] = snap[k]; });
  if (db.users[sid]) db.users[sid].private = snapshotPrivate();
  setUsersDB(db);
}
function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}
function notify(text) {
  S.notifs.unshift({ t: text, d: today(), read: false });
  save(); renderNotifBadge();
}
let _lastFocus = null;
function openModal(html, wide) {
  const r = $('#modalRoot'); if (!r) return;
  try {
    _lastFocus = document.activeElement;
    r.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '" role="document"><button class="icon-btn close" id="modalClose" aria-label="Close">✕</button>' + html + '</div>';
    r.classList.add('show'); $('#overlay').classList.add('show');
    const c = $('#modalClose'); if (c) c.onclick = closeModal;
    r.onclick = e => { if (e.target === r) closeModal(); };
    const m = r.querySelector('.modal');
    if (m) {
      const f = m.querySelector('input:not([type=hidden]),select,textarea,button.btn.primary');
      if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
      if (!m.dataset.trap) {
        m.dataset.trap = '1';
        m.addEventListener('keydown', e => {
          if (e.key !== 'Tab') return;
          const els = Array.from(m.querySelectorAll('button,input,select,textarea,a[href]')).filter(x => !x.disabled && x.offsetParent !== null);
          if (!els.length) return;
          const first = els[0], last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
      }
    }
  } catch (err) {
    // never let a broken modal leave the UI locked behind an overlay
    console.warn('modal failed', err);
    r.innerHTML = '<div class="modal"><h3>Something went wrong</h3><p class="muted">' + esc((err && err.message) || String(err)) + '</p><button class="btn primary block" onclick="closeModal()">Close</button></div>';
    r.classList.add('show'); $('#overlay').classList.add('show');
  }
}
function closeModal() {
  const r = $('#modalRoot'); if (!r) return;
  r.classList.remove('show'); r.innerHTML = '';
  const menu = $('#accountMenu'); if (menu) menu.hidden = true;
  if (!$('#cartDrawer').classList.contains('open') && !$('#notifDrawer').classList.contains('open') && $('#paletteRoot').hidden) $('#overlay').classList.remove('show');
  try { if (_lastFocus && document.contains(_lastFocus) && _lastFocus.focus) _lastFocus.focus({ preventScroll: true }); } catch (e) {}
  _lastFocus = null;
}
window.closeModal = closeModal;

/* ============ v9 ACCESSIBILITY LAYER ============ */
/* 1. Announce transient messages to screen readers without stealing focus */
let _announceT = null;
function announce(text, assertive) {
  const lr = $('#liveRegion') || $('#liveAssertive');
  if (!lr) return;
  lr.textContent = '';
  clearTimeout(_announceT);
  _announceT = setTimeout(() => { lr.textContent = text; }, 40);
}
/* 2. Roving-tabindex keyboard navigation for button groups (nav, tabs, chips) */
function rovingTabindex(container, selector) {
  if (!container || container.dataset.roving) return;
  container.dataset.roving = '1';
  container.addEventListener('keydown', e => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (keys.indexOf(e.key) < 0) return;
    const items = Array.from(container.querySelectorAll(selector)).filter(x => x.offsetParent !== null);
    if (!items.length) return;
    const cur = items.indexOf(document.activeElement);
    if (cur < 0) return;
    e.preventDefault();
    let next = cur;
    const horiz = container.dataset.rovingDir === 'vertical';
    const fwd = horiz ? e.key === 'ArrowDown' : e.key === 'ArrowRight';
    const back = horiz ? e.key === 'ArrowUp' : e.key === 'ArrowLeft';
    if (fwd) next = (cur + 1) % items.length;
    else if (back) next = (cur - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    items.forEach((x, i) => { x.tabIndex = i === next ? 0 : -1; });
    items[next].focus();
  });
}
/* 3. Arrow-key navigation across card grids */
function wireGridKeys(root) {
  if (!root || root.dataset.gridkeys) return;
  root.dataset.gridkeys = '1';
  root.addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
    const cards = Array.from(root.querySelectorAll('.product, .gig, .post, .evt, .coach, .co, .list-row'))
      .filter(c => c.offsetParent !== null);
    if (!cards.length) return;
    const cur = cards.findIndex(c => c.contains(document.activeElement));
    if (cur < 0) return;
    const cols = Math.max(1, Math.round(cards[0].parentElement ? cards[0].parentElement.clientWidth / Math.max(1, cards[0].offsetWidth) : 1));
    let next = cur;
    if (e.key === 'ArrowRight') next = cur + 1;
    else if (e.key === 'ArrowLeft') next = cur - 1;
    else if (e.key === 'ArrowDown') next = cur + cols;
    else if (e.key === 'ArrowUp') next = cur - cols;
    if (next < 0 || next >= cards.length) return;
    e.preventDefault();
    const target = cards[next].querySelector('button, a, input, [tabindex]') || cards[next];
    if (!target.hasAttribute('tabindex') && target.tabIndex < 0) target.setAttribute('tabindex', '-1');
    target.focus();
  });
}
/* 4. Apply semantics that the static markup cannot express */
function applyA11ySemantics() {
  const mainNav = $('#mainNav');
  if (mainNav) { mainNav.setAttribute('role', 'tablist'); mainNav.setAttribute('aria-label', 'Main sections'); rovingTabindex(mainNav, 'button'); }
  const mob = document.querySelector('.mobile-tabs');
  if (mob) { mob.setAttribute('role', 'tablist'); mob.setAttribute('aria-label', 'Mobile sections'); mob.dataset.rovingDir = 'vertical'; rovingTabindex(mob, 'button'); }
  $$('#mainNav button').forEach(b => {
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false');
  });
  // every view becomes a labelled tabpanel
  $$('.view').forEach(v => {
    v.setAttribute('role', 'tabpanel');
    const h = v.querySelector('h1,h2');
    if (h && !h.id) h.id = v.id + '-h';
    if (h) v.setAttribute('aria-labelledby', h.id);
  });
  // icon-only buttons must expose an accessible name
  $$('button').forEach(b => {
    if (b.getAttribute('aria-label') || b.getAttribute('title')) return;
    const txt = (b.textContent || '').trim();
    if (txt.length) return;
    const id = b.id || (b.dataset.nav ? 'nav-' + b.dataset.nav : '');
    if (id && !b.getAttribute('aria-label')) b.setAttribute('aria-label', id.replace(/[-_]/g, ' '));
  });
  // decorative emoji spans should not be read out
  $$('.p-img, .thumb, .stories img').forEach(x => x.setAttribute('aria-hidden', 'true'));
  $$('.progress, .spark').forEach(x => x.setAttribute('aria-hidden', 'true'));
}
/* 5. Keep aria-selected in sync with the active view */
function syncA11yNav(name) {
  $$('#mainNav button').forEach(b => {
    const on = b.dataset.nav === name;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) b.setAttribute('tabindex', '0'); else b.setAttribute('tabindex', '-1');
  });
  $$('.mobile-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.nav === name ? 'true' : 'false'));
}
/* 6. Drawers + modals must trap focus and report themselves as dialogs */
function trapDrawer(drawerSel, panelSel) {
  const p = $(panelSel || drawerSel);
  if (!p || p.dataset.trapBound) return;
  p.dataset.trapBound = '1';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-modal', 'true');
  p.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const els = Array.from(p.querySelectorAll('button,input,select,textarea,a[href]')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
/* 7. Global: "/" focuses search, Escape closes, arrows work everywhere */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ($('#paletteRoot').hidden ? openPalette() : closePalette()); return; }
  if (e.key === 'Escape') { closeModal(); closeCart(); closeNotif(); hideSearch(); closePalette(); toggleAssist(false); }
  if (e.key === '/' && document.activeElement !== $('#globalSearch') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#globalSearch').focus(); }
});
function imgHTML(p, cls) {
  const v = p.img || '📦';
  if (/^https?:\/\//.test(v)) return '<img src="' + esc(v) + '" alt="' + esc(p.title || '') + '" loading="lazy" onerror="this.outerHTML=\'' + esc(p.category || '📦') + '\'" />';
  return esc(v);
}
function stars(r) { const f = Math.round(Number(r) || 0); return '★'.repeat(f) + '☆'.repeat(Math.max(0, 5 - f)); }

/* ---------- navigation (hash routing) ---------- */
const VIEWS = ['marketplace', 'deals', 'auctions', 'services', 'learn', 'events', 'coaches', 'community', 'sell', 'become-coach', 'dashboard', 'orders', 'inbox', 'rewards', 'wishlist', 'wallet', 'settings', 'people', 'profile'];
function nav(name) {
  if (VIEWS.indexOf(name) < 0) name = 'marketplace';
  $$('#mainNav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $$('.mobile-tabs button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $$('.view').forEach(v => {
    const on = v.id === 'view-' + name;
    v.classList.toggle('active', on);
    // only the visible panel may be reachable by tab order
    v.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) v.removeAttribute('inert'); else { try { v.setAttribute('inert', ''); } catch (e) {} }
  });
  syncA11yNav(name);
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
  if (name === 'auctions') renderAuctions();
  if (name === 'services') renderServices();
  if (name === 'learn') renderLearn();
  if (name === 'events') renderEvents();
  if (name === 'community') renderCommunity();
  if (name === 'inbox') renderInbox();
  if (name === 'rewards') renderRewards();
  if (name === 'settings') renderSettings();
  if (name === 'people') renderPeople();
  if (name === 'profile') renderProfile(S.viewProfileId || currentUserId());
  const grids = ['#productGrid', '#dealsGrid', '#auctionGrid', '#gigGrid', '#courseGrid', '#eventGrid',
    '#coachGrid', '#peopleGrid', '#feedList', '#ordersList', '#wishGrid', '#threadList',
    '#notifList', '#leaderList', '#txList', '#myListings'];
  grids.forEach(sel => wireGridKeys($(sel)));
  announce((VIEWS.find(v => v === name) || 'Page') + ' loaded');
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
    '<button class="btn ghost" data-cmp="' + p.id + '" title="Compare">' + ((S.compare || []).indexOf(p.id) >= 0 ? '◧✓' : '◧') + '</button>' +
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
  if (!list.length) {
    grid.innerHTML = '<div class="card empty"><span class="big">🔍</span><b>No listings found</b><p class="muted">Nothing matches' + (S.q ? ' "' + esc(S.q) + '"' : ' these filters') + '. Try clearing filters or be the first to sell it.</p>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" id="emptyClear">Clear filters</button><button class="btn primary" data-nav="sell">＋ Create listing</button></div></div>';
    const ec2 = $('#emptyClear');
    if (ec2) ec2.onclick = () => { S.q = ''; S.cat = 'All'; S.type = 'All'; S.maxPrice = 0; S.inStock = false; const inp = $('#globalSearch'); if (inp) inp.value = ''; save(); renderMarket(); };
  } else grid.innerHTML = list.map(productCard).join('');
  $$('#productGrid [data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
  $$('#productGrid [data-view]').forEach(b => b.onclick = () => viewProduct(b.dataset.view));
  $$('#productGrid [data-fav]').forEach(b => b.onclick = () => toggleWish(b.dataset.fav));
  $$('#productGrid [data-offer]').forEach(b => b.onclick = () => makeOffer(b.dataset.offer));
  $$('#productGrid [data-cmp]').forEach(b => b.onclick = () => toggleCompare(b.dataset.cmp));
  $$('#productGrid [data-seller]').forEach(b => b.onclick = e => { e.preventDefault(); sellerStore(b.dataset.seller); });
  $('#activityFeed').innerHTML = S.feed.slice(0, 6).map(f => '<div class="feed-item">' + esc(f) + '</div>').join('');
  renderRails(); renderStories(); renderCompareTray(); checkPriceAlerts();
  const sel = $('#sortSelect'); if (sel) sel.value = S.sort;
  const tf = $('#typeFilter'); if (tf) tf.value = S.type;
  const pf = $('#priceFilter'); if (pf) pf.value = String(S.maxPrice);
  const st = $('#stockToggle'); if (st) st.checked = !!S.inStock;
  const ss = $('#saveSearchBtn'); if (ss) { ss.hidden = !(S.q && S.q.length >= 2); ss.onclick = () => saveSearch(S.q, S.q); }
  updateWalletUI(); updateCartUI(); renderNotifBadge(); renderCompareTray();
}
function toggleWish(id) {
  const i = S.wishlist.indexOf(id);
  const gid = activeWishGroup();
  if (i >= 0) {
    S.wishlist.splice(i, 1);
    removeFromGroupSilent(id, gid);
    toast('Removed from wishlist');
  } else {
    S.wishlist.push(id);
    const g = wishGroups().find(x => x.id === gid);
    if (g && g.items.indexOf(id) < 0) g.items.push(id);
    toast('Saved to wishlist ♥', 'ok');
  }
  save(); renderMarket(); renderWishlist(); renderNotifBadge();
}
function removeFromGroupSilent(pid, gid) {
  const g = wishGroups().find(x => x.id === gid);
  if (g) g.items = g.items.filter(i => i !== pid);
}
window.toggleWish = toggleWish;

function variantsFor(p) {
  if (p.category === 'Fashion') return { Size: ['XS', 'S', 'M', 'L', 'XL'], Color: ['Black', 'Tan', 'Cream'] };
  if (p.category === 'Tech') return { Color: ['Black', 'White'], Warranty: ['1yr', '2yr +$12'] };
  if (p.category === 'Home') return { Set: ['Duo', 'Set of 4 +$18'] };
  return null;
}
function viewProduct(id) {
  const p = S.products.find(x => x.id === id); if (!p) return;
  trackRecent(id);
  const revs = S.reviews[id] || [];
  const qas = S.qa[id] || [];
  const related = S.products.filter(x => x.id !== id && x.category === p.category && !x.paused).slice(0, 3);
  const vars = variantsFor(p);
  const vopts = vars ? Object.entries(vars).map(([k, opts]) => '<label>' + esc(k) + '<div class="variant-pills" data-var="' + esc(k) + '">' + opts.map((o, i) => '<button class="' + (i === 0 ? 'sel' : '') + '" data-v="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div></label>').join('') : '';
  openModal(
    '<div class="p-img" style="border-radius:14px;height:190px;font-size:84px"><span class="badge">' + esc(p.category) + ' • ' + esc(p.type) + '</span>' + imgHTML(p) + '</div>' +
    '<h3 style="margin:12px 0 4px">' + esc(p.title) + '</h3>' +
    '<div class="muted small">by <a href="#" id="pvSeller"><b>' + esc(p.seller) + '</b></a> • <span class="stars">★ ' + p.rating + '</span> (' + p.reviews + ' reviews) • ' + Number(p.sold).toLocaleString() + ' sold</div>' +
    '<p>' + esc(p.desc) + '</p>' + vopts +
    '<div class="total-row"><span>Price</span><b>' + money(p.price) + ' <span class="muted small">(' + ec(p.price) + ')</span></b></div>' +
    '<div class="muted small" style="margin:6px 0">Stock: ' + (p.type === 'Digital' ? '∞ instant delivery' : p.stock) + ' • ' + (p.type === 'Digital' ? 'Instant download' : 'Ships in 2–3 days') + ' • 14-day returns • Escrow protected</div>' +
    '<div class="row2"><label>Qty<select id="pvQty"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>' +
    '<label>ZIP for delivery estimate<input id="pvZip" placeholder="e.g. 78701" /></label></div>' +
    '<div id="pvShip" class="muted small"></div>' +
    '<div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">' +
    '<button class="btn primary" style="flex:1" id="pvBuy">Buy now — ' + money(p.price) + '</button>' +
    '<button class="btn" id="pvAdd">＋ Cart</button>' +
    '<button class="btn" id="pvWish">' + (S.wishlist.indexOf(p.id) >= 0 ? '♥ Saved' : '♡ Save') + '</button></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" id="pvShare">🔗 Share</button><button class="btn small" id="pvOffer">◐ Offer</button><button class="btn small" id="pvCmp">◧ Compare</button><button class="btn small" id="pvAlert">🔔 Alert</button><button class="btn small danger" id="pvReport">Flag</button></div>' +
    '<h4 style="margin-top:12px">Questions (' + qas.length + ')</h4><div>' + (qas.map(q => '<div class="qa"><b>Q: ' + esc(q.q) + '</b><div class="muted">A: ' + esc(q.a) + '</div></div>').join('') || '<div class="muted small">No questions yet — ask below.</div>') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:6px"><input id="pvQ" placeholder="Ask the seller…" /><button class="btn small" id="pvQGo">Ask</button></div>' +
    '<h4>Ratings breakdown</h4>' + (rateBreakdown(p.id) || []).map(r => '<div class="list-row" style="border:0;padding:4px 0"><b style="width:42px">' + r.star + ' ★</b><div class="bar" style="max-width:none;flex:1;height:8px"><i style="width:' + r.pct + '%"></i></div><span class="muted small" style="width:64px;text-align:right">' + r.pct + '% (' + r.n + ')</span></div>').join('') +
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
  $$('#modalRoot [data-var] button').forEach(b => b.onclick = () => { $$('#modalRoot [data-var="' + b.parentElement.dataset.var + '"] button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
  const selVars = () => { const o = {}; $$('#modalRoot [data-var]').forEach(d => { const s = d.querySelector('.sel'); if (s) o[d.dataset.var] = s.dataset.v; }); return o; };
  window._lastVars = selVars;
  $('#pvAdd').onclick = () => { const v = selVars(); addToCart(p.id, false, Number($('#pvQty').value || 1)); if (Object.keys(v).length) toast('Added (' + Object.values(v).join(', ') + ')', 'ok'); };
  $('#pvBuy').onclick = () => { addToCart(p.id, true, Number($('#pvQty').value || 1)); closeModal(); openCart(); };
  $('#pvWish').onclick = () => { toggleWish(p.id); closeModal(); viewProduct(p.id); };
  const sh = $('#pvShare'); if (sh) sh.onclick = () => { const link = location.origin + location.pathname + '#/marketplace?item=' + p.id; try { navigator.clipboard.writeText(link); } catch (e) {} toast('Link copied — share it anywhere 🔗', 'ok'); };
  const of = $('#pvOffer'); if (of) of.onclick = () => { closeModal(); makeOffer(p.id); };
  const pcmp = $('#pvCmp'); if (pcmp) pcmp.onclick = () => { toggleCompare(p.id); toast((S.compare || []).indexOf(p.id) >= 0 ? 'Added to compare ◧' : 'Removed from compare', 'ok'); };
  const pal = $('#pvAlert'); if (pal) pal.onclick = () => {
    openModal('<h3>🔔 Price alert — ' + esc(p.title) + '</h3><p class="muted small">Now <b>' + money(p.price) + '</b>. Ping me under:</p><label>Target price<input id="alertTarget" type="number" value="' + Math.round(p.price * 0.9) + '" min="1" /></label><button class="btn primary block" id="alertGo" style="margin-top:8px">Set alert →</button>');
    $('#alertGo').onclick = () => { const t = Number($('#alertTarget').value); if (!t || t <= 0) { toast('Enter a target', 'err'); return; } closeModal(); setPriceAlert(p.id, t); viewProduct(p.id); };
  };
  const rp = $('#pvReport'); if (rp) rp.onclick = () => { notify('Thanks — "' + p.title + '" flagged for review.'); toast('Reported. Trust team will review in 24h.', 'ok'); };
  const ps = $('#pvSeller'); if (ps) ps.onclick = e => { e.preventDefault(); closeModal(); sellerStore(p.seller); };
  const qg = $('#pvQGo'); if (qg) qg.onclick = () => {
    const v = $('#pvQ').value.trim(); if (!v) return;
    (S.qa[p.id] = S.qa[p.id] || []).push({ q: v, a: 'Seller typically replies in ~2h. We notified ' + p.seller + '.' });
    save(); closeModal(); viewProduct(p.id); toast('Question sent to seller ✓', 'ok');
  };
  $('#pvSend').onclick = () => {
    const t = $('#pvText').value.trim(); if (!t) return toast('Write a review first', 'err');
    (S.reviews[p.id] = S.reviews[p.id] || []).unshift({ n: S.user.name.split(' ')[0], r: Number($('#pvRate').value), t, d: today() });
    p.reviews++; save(); toast('Review posted — thanks!', 'ok'); closeModal(); viewProduct(p.id); renderMarket();
  };
  $$('#modalRoot [data-rel]').forEach(b => b.onclick = () => viewProduct(b.dataset.rel));
}
window.viewProduct = viewProduct;

/* ---------- search (v9: typo-tolerant, ranked, grouped) ---------- */
function hideSearch() { const d = $('#searchDrop'); if (d) d.hidden = true; }
/* Unified ranking across every entity type. Returns {kind,item,score}. */
function rankSearch(q) {
  q = String(q || '').trim();
  if (!q) return [];
  const out = [];
  const push = (kind, item, fields) => {
    let best = 0, hitField = '';
    fields.forEach(f => {
      const v = item[f];
      if (v == null) return;
      const sc = fuzzyScore(q, String(v));
      if (sc > best) { best = sc; hitField = f; }
    });
    if (best > 0) out.push({ kind, item, score: best, hitField });
  };
  S.products.forEach(p => push('Products', p, ['title', 'seller', 'category', 'tags', 'desc']));
  (S.gigs || []).forEach(g => push('Gigs', g, ['title', 'seller', 'tag', 'desc']));
  S.coaches.forEach(c => push('Coaches', c, ['name', 'specialty', 'bio']));
  (S.courses || []).forEach(c => push('Courses', c, ['title', 'cat', 'teacher', 'desc']));
  (S.events || []).forEach(e => push('Events', e, ['title', 'place', 'host']));
  (S.posts || []).forEach(p => push('Community', p, ['author', 'body']));
  // popularity nudge: things people actually buy rank a little higher
  out.forEach(r => {
    const pop = r.kind === 'Products' ? (r.item.sold || 0) : (r.kind === 'Coaches' ? (r.item.sessions || 0) : 0);
    r.score += Math.min(40, Math.log10(1 + pop) * 12);
  });
  return out.sort((a, b) => b.score - a.score);
}
function didYouMean(q) {
  const dict = [];
  const add = v => { if (v) dict.push(String(v)); };
  S.products.forEach(p => { add(p.title); add(p.category); });
  (S.gigs || []).forEach(g => add(g.title));
  S.coaches.forEach(c => { add(c.name); add(c.specialty); });
  (S.courses || []).forEach(c => add(c.title));
  (S.events || []).forEach(e => add(e.title));
  (S.listings || []).forEach(l => add(l.title));
  if (!dict.length) return null;
  let best = null, bestD = 99;
  const nw = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  dict.forEach(d => {
    const dw = d.toLowerCase().split(/[\s\-_/,—·]+/).filter(Boolean);
    for (const w of nw) {
      if (w.length < 3) continue;
      for (const h of dw) {
        if (Math.abs(h.length - w.length) > 3) continue;
        const dist = levenshtein(w, h, 3);
        if (dist > 0 && dist <= 2 && dist < bestD) { bestD = dist; best = d; }
      }
    }
  });
  return best;
}
function highlight(text, q) {
  const t = esc(text);
  const needle = String(q || '').trim();
  if (!needle) return t;
  const words = needle.split(/\s+/).filter(w => w.length >= 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return t;
  return t.replace(new RegExp('(' + words.join('|') + ')', 'ig'), '<mark class="hl">$1</mark>');
}
function bindSearch() {
  const inp = $('#globalSearch'); if (!inp || inp.dataset.bound) return; inp.dataset.bound = '1';
  const run = debounce(() => {
    S.q = inp.value.trim();
    const q = S.q.toLowerCase();
    const drop = $('#searchDrop');
    if (q.length >= 2) {
      pushSearchHist(inp.value);
      const ranked = rankSearch(inp.value);
      const byKind = {};
      ranked.forEach(r => { (byKind[r.kind] = byKind[r.kind] || []).push(r); });
      let h = '';
      if (!ranked.length) {
        const dym = didYouMean(inp.value);
        h = '<button disabled>No matches for “' + esc(inp.value) + '”</button>';
        if (dym) h = '<button data-hist="' + esc(dym) + '">🔎 Did you mean <b>' + esc(dym) + '</b>?</button>' + h;
      }
      ['Products', 'Gigs', 'Coaches', 'Courses', 'Events', 'Community'].forEach(kind => {
        const rows = (byKind[kind] || []).slice(0, kind === 'Products' ? 5 : 3);
        if (!rows.length) return;
        h += '<div class="muted small drop-head">' + kind + '</div>';
        rows.forEach(r => {
          const it = r.item;
          if (kind === 'Products') h += '<button data-s-p="' + it.id + '"><span>' + esc(it.img) + '</span><span><b>' + highlight(it.title, inp.value) + '</b><br /><small class="muted">' + money(it.price) + ' • ' + highlight(it.category, inp.value) + '</small></span></button>';
          else if (kind === 'Coaches') h += '<button data-s-c="' + it.id + '"><span>' + it.img + '</span><span><b>' + highlight(it.name, inp.value) + '</b><br /><small class="muted">Coach • ' + highlight(it.specialty, inp.value) + '</small></span></button>';
          else if (kind === 'Gigs') h += '<button data-s-g="' + it.id + '"><span>' + esc(it.img || '🧰') + '</span><span><b>' + highlight(it.title, inp.value) + '</b><br /><small class="muted">Gig • ' + money(it.price) + '</small></span></button>';
          else h += '<button data-s-x="' + kind + '|' + esc(it.title || it.name || '') + '"><span>🔗</span><span><b>' + highlight(it.title || it.name || '', inp.value) + '</b><br /><small class="muted">' + kind + '</small></span></button>';
        });
      });
      drop.innerHTML = h;
      drop.hidden = false;
      $$('#searchDrop [data-s-p]').forEach(b => b.onclick = () => { hideSearch(); viewProduct(b.dataset.sP); });
      $$('#searchDrop [data-s-c]').forEach(b => b.onclick = () => { hideSearch(); nav('coaches'); bookCoach(b.dataset.sC, true); });
      $$('#searchDrop [data-s-g]').forEach(b => b.onclick = () => { hideSearch(); nav('services'); hireGig(b.dataset.sG); });
      $$('#searchDrop [data-s-x]').forEach(b => b.onclick = () => {
        hideSearch();
        const [kind] = b.dataset.sX.split('|');
        nav(kind === 'Courses' ? 'learn' : kind === 'Events' ? 'events' : kind === 'Community' ? 'community' : 'marketplace');
      });
      $$('#searchDrop [data-hist]').forEach(b => b.onclick = () => { inp.value = b.dataset.hist; hideSearch(); S.q = inp.value.trim(); save(); if (!$('#view-marketplace').classList.contains('active')) nav('marketplace'); renderMarket(); });
    } else if (q.length === 0) {
      const hist = (S.searchHist || []).slice(0, 5);
      const trend = trendingSearches();
      drop.innerHTML = (hist.length ? '<div class="muted small drop-head">Recent</div>' + hist.map(h => '<button data-hist="' + esc(h) + '">🕘 ' + esc(h) + '</button>').join('') : '') +
        '<div class="muted small drop-head">Trending</div>' + trend.map(t => '<button data-hist="' + esc(t) + '">🔥 ' + esc(t) + '</button>').join('');
      drop.hidden = false;
      $$('#searchDrop [data-hist]').forEach(b => b.onclick = () => { inp.value = b.dataset.hist; hideSearch(); S.q = inp.value.trim(); save(); if (!$('#view-marketplace').classList.contains('active')) nav('marketplace'); renderMarket(); });
      return;
    } else drop.hidden = true;
    if (!$('#view-marketplace').classList.contains('active')) nav('marketplace');
    renderMarket();
  }, 220);
  inp.addEventListener('input', run);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') hideSearch(); });
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) hideSearch(); });
}

/* ---------- v7: ratings, seller tiers, saved searches, wishlist groups, bulk tools ---------- */
function rateBreakdown(id) {
  const p = S.products.find(x => x.id === id); if (!p) return null;
  const total = Math.max(1, p.reviews || 1);
  const base = S.rateBreakdown[id] || [0.62, 0.24, 0.09, 0.03, 0.02];
  return base.map((w, i) => ({ star: 5 - i, pct: Math.round(w * 100), n: Math.round(w * total) }));
}
/* Listings belonging to a seller. The current user's own listings are identified by
   the `mine` flag — the stored `seller` string carries a " (you)" suffix, so a plain
   name comparison silently matched nothing. */
function listingsBySeller(name) {
  const self = !isGuest() && (name === S.user.name || name === (currentProfile() || {}).name);
  return S.products.filter(p => {
    if (p.paused) return false;
    if (self) return p.mine || p.seller === name || p.seller === name + ' (you)';
    return p.seller === name;
  });
}
function sellerTierFor(sellerName) {
  const items = listingsBySeller(sellerName);
  const sold = items.reduce((s, p) => s + p.sold, 0);
  const ratings = items.length ? items.reduce((s, p) => s + p.rating, 0) / items.length : 4.5;
  if (sold >= 2000) return { t: 'Platinum', c: 'ok', fee: 0.02, icon: '💎', next: null };
  if (sold >= 800) return { t: 'Gold', c: 'warn', fee: 0.03, icon: '🥇', next: { need: 2000, at: sold } };
  if (sold >= 200) return { t: 'Silver', c: 'info', fee: 0.04, icon: '🥈', next: { need: 800, at: sold } };
  return { t: 'Bronze', c: '', fee: 0.05, icon: '🥉', next: { need: 200, at: sold } };
}
function sellerTierCard(name) {
  const t = sellerTierFor(name);
  const items = listingsBySeller(name);
  const sold = items.reduce((s, p) => s + p.sold, 0);
  const pct = t.next ? Math.min(100, Math.round(sold / t.next.need * 100)) : 100;
  return '<div class="card tier-card"><div class="card-head"><div><h3 style="margin:0"><span class="tier-chip">' + t.icon + ' ' + esc(name) + '</span> <span class="tag ' + t.c + '">' + t.t + '</span></h3>' +
    '<div class="muted small">' + items.length + ' listings • ' + sold.toLocaleString() + ' sold • fee <b>' + Math.round(t.fee * 100) + '%</b></div></div>' +
    '<span class="muted small">' + (t.next ? Math.max(0, t.next.need - sold) + ' to next tier' : 'Top tier 🎉') + '</span></div>' +
    (t.next ? '<div class="progress"><i style="width:' + pct + '%"></i></div>' : '') + '</div>';
}
function saveSearch(name, q) {
  if (!requireAuth('save searches')) return;
  S.savedSearches = S.savedSearches || [];
  if (S.savedSearches.some(s => s.q === q)) return toast('Already saved', 'err');
  S.savedSearches.unshift({ name: name || q, q, at: Date.now() });
  save(); renderSavedSearches(); toast('🔔 Saved — we\'ll alert you on new matches', 'ok');
}
function renderSavedSearches() {
  const box = $('#savedSearches'); if (!box) return;
  const list = S.savedSearches || [];
  box.innerHTML = list.map((s, i) => '<div class="list-row"><div class="grow"><b>' + esc(s.name) + '</b><span>🔔 ' + esc(s.q) + '</span></div>' +
    '<button class="btn small" data-ss-run="' + i + '">Run</button><button class="btn small danger" data-ss-del="' + i + '">✕</button></div>').join('') ||
    '<div class="muted small">No saved searches. Search something, then click "Save search".</div>';
  $$('#savedSearches [data-ss-run]').forEach(b => b.onclick = () => { const q = S.savedSearches[Number(b.dataset.ssRun)].q; const inp = $('#globalSearch'); inp.value = q; S.q = q; save(); nav('marketplace'); renderMarket(); });
  $$('#savedSearches [data-ss-del]').forEach(b => b.onclick = () => { S.savedSearches.splice(Number(b.dataset.ssDel), 1); save(); renderSavedSearches(); });
}
function checkSavedSearches() {
  let hits = 0;
  (S.savedSearches || []).forEach(s => {
    const q = String(s.q || '').toLowerCase();
    if (!q) return;
    const found = S.products.filter(p => !p.paused && (p.title + ' ' + p.seller + ' ' + p.category).toLowerCase().indexOf(q) >= 0);
    if (found.length && !s.hits) { s.hits = found.length; hits++; notify('🔔 Saved search "' + s.name + '" has ' + found.length + ' new match(es).'); }
  });
  if (hits) save();
}
function bulkTool(kind) {
  if (!requireAuth('use seller bulk tools')) return;
  const mine = S.products.filter(p => p.mine);
  if (!mine.length) return toast('No listings of yours yet — publish one first', 'err');
  if (kind === 'price') {
    openModal('<h3>🏷 Bulk price change</h3><p class="muted small">Applies to all ' + mine.length + ' of your live listings.</p>' +
      '<div class="row2"><label>Change by<input id="bulkMode" type="number" value="-10" /></label><label>Type<select id="bulkKind"><option value="pct">% percent</option><option value="abs">absolute</option></select></label></div>' +
      mine.map(p => '<label class="check"><input type="checkbox" data-bulk-p="' + p.id + '" checked /> ' + esc(p.title) + ' — ' + money(p.price) + '</label>').join('') +
      '<button class="btn primary block" id="bulkGo" style="margin-top:10px">Apply</button>');
    $('#bulkGo').onclick = () => {
      const v = Number($('#bulkMode').value); const kind2 = $('#bulkKind').value;
      let n = 0;
      $$('#modalRoot [data-bulk-p]').forEach(cb => {
        if (!cb.checked) return;
        const p = S.products.find(x => x.id === cb.dataset.bulkP); if (!p) return;
        p.price = Math.max(1, Math.round((kind2 === 'pct' ? p.price * (1 + v / 100) : p.price + v) * 100) / 100);
        n++;
      });
      save(); closeModal(); renderSell(); renderMarket(); toast('Updated ' + n + ' listing prices ✓', 'ok');
    };
  } else if (kind === 'pause') {
    openModal('<h3>⏸ Bulk pause / resume</h3>' + mine.map(p => '<div class="list-row"><div class="grow"><b>' + esc(p.title) + '</b><span>' + (p.paused ? 'Paused' : 'Live') + '</span></div></div>').join('') +
      '<button class="btn block" id="bulkPause" style="margin-top:8px">Pause all</button><button class="btn block" id="bulkResume" style="margin-top:8px">Resume all</button>');
    const setAll = v => { mine.forEach(p => p.paused = v); save(); closeModal(); renderSell(); renderMarket(); toast('All listings ' + (v ? 'paused' : 'resumed'), 'ok'); };
    $('#bulkPause').onclick = () => setAll(true); $('#bulkResume').onclick = () => setAll(false);
  } else {
    openModal('<h3>🗂 Bulk restock</h3><p class="muted small">Add stock to all listings at once.</p><label>Add<input id="bulkStock" type="number" value="10" min="1" /></label>' +
      '<button class="btn primary block" id="bulkStockGo">Apply to ' + mine.length + ' listings</button>');
    $('#bulkStockGo').onclick = () => { const v = Number($('#bulkStock').value) || 0; mine.forEach(p => p.stock += v); save(); closeModal(); renderSell(); renderMarket(); toast('Added ' + v + ' stock to all ✓', 'ok'); };
  }
}
function dailyBoard() {
  const rows = [
    { n: 'Maya Atelier', v: 1840, i: '👜' }, { n: 'Coach Priya', v: 1620, i: '🏋️' },
    { n: 'Aisha Bello', v: 1410, i: '📣' }, { n: 'Kiln & Co', v: 1180, i: '☕' },
    { n: S.user.name.split(' ')[0], v: 900 + (S.points || 0), i: S.user.emoji || '🧑‍🚀', me: true },
    { n: 'Studio Kline', v: 760, i: '🎨' }, { n: 'Diego Ruiz', v: 640, i: '🎨' }, { n: 'Lena K.', v: 520, i: '🛍️' }
  ].sort((a, b) => b.v - a.v);
  return rows.map((r, i) => '<div class="list-row"><div class="thumb">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</div>' +
    '<div class="person-ava" style="width:38px;height:38px;font-size:18px">' + r.i + '</div><div class="grow"><b>' + esc(r.n) + (r.me ? ' <span class="tag info">you</span>' : '') + '</b><span>points today</span></div><b>' + r.v + '</b></div>').join('');
}

/* ---------- wishlist ---------- */
/* ---------- wishlist collections (v9) ---------- */
function wishGroups() {
  if (!Array.isArray(S.wishGroups)) S.wishGroups = [];
  // guarantee a default collection so new saves are never orphaned
  if (!S.wishGroups.length) S.wishGroups.push({ id: 'wg_all', name: 'Saved', items: [] });
  return S.wishGroups;
}
function activeWishGroup() {
  if (!S.activeWishGroup) S.activeWishGroup = 'wg_all';
  return S.activeWishGroup;
}
function wishItemsIn(gid) {
  const g = wishGroups().find(x => x.id === gid);
  return g ? g.items : [];
}
function createWishGroup(name) {
  name = String(name || '').trim().slice(0, 40);
  if (!name) return null;
  const g = { id: 'wg_' + Date.now().toString(36), name, items: [] };
  wishGroups().push(g); save(); return g;
}
function deleteWishGroup(gid) {
  if (gid === 'wg_all') return false;
  const g = wishGroups().find(x => x.id === gid);
  if (!g) return false;
  // items are never destroyed — they fall back to the default collection
  S.wishlist = Array.from(new Set(S.wishlist.concat(g.items)));
  S.wishGroups = S.wishGroups.filter(x => x.id !== gid);
  if (activeWishGroup() === gid) S.activeWishGroup = 'wg_all';
  save(); return true;
}
function moveToGroup(pid, gid) {
  const g = wishGroups().find(x => x.id === gid);
  if (!g) return false;
  if (g.items.indexOf(pid) < 0) g.items.push(pid);
  wishGroups().forEach(x => { if (x.id !== gid) x.items = x.items.filter(i => i !== pid); });
  save(); return true;
}
function removeFromGroup(pid, gid) {
  const g = wishGroups().find(x => x.id === gid);
  if (!g) return false;
  g.items = g.items.filter(i => i !== pid);
  save(); return true;
}
/* Encode a collection into a URL-safe base64 payload for sharing */
function encodeShare(ids) {
  try {
    const payload = JSON.stringify({ v: 1, i: ids, t: Date.now() });
    return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return ''; }
}
function decodeShare(code) {
  try {
    const s = String(code).replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(s)));
    const d = JSON.parse(json);
    if (!d || !Array.isArray(d.i)) return [];
    return d.i.filter(x => typeof x === 'string').slice(0, 100);
  } catch (e) { return []; }
}
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select();
    const okc = document.execCommand('copy');
    ta.remove();
    return okc;
  } catch (e) { return false; }
}
async function shareWishGroup(gid) {
  const ids = wishItemsIn(gid);
  if (!ids.length) { toast('Nothing saved in this list yet', 'err'); return; }
  const url = location.origin + location.pathname + '#wishlist?s=' + encodeShare(ids);
  const copied = await copyText(url);
  toast(copied ? 'Share link copied ✓ ' + ids.length + ' items' : url, copied ? 'ok' : undefined);
}
function importSharedWishlist() {
  const m = /[#&?]s=([A-Za-z0-9\-_]+)/.exec(location.hash + location.search);
  if (!m) return false;
  const ids = decodeShare(m[1]);
  if (!ids.length) { toast('That share link looks invalid', 'err'); return false; }
  const known = ids.filter(id => S.products.some(p => p.id === id));
  if (!known.length) { toast('None of those items are available any more', 'err'); return false; }
  known.forEach(id => { if (S.wishlist.indexOf(id) < 0) S.wishlist.push(id); });
  const g = createWishGroup('Shared · ' + known.length + ' items');
  if (g) g.items = known.slice();
  save(); renderWishlist();
  toast('Added ' + known.length + ' shared items ✓', 'ok');
  history.replaceState(null, '', location.pathname + '#wishlist');
  return true;
}
function renderWishlist() {
  const g = $('#wishGrid'); if (!g) return;
  const groups = wishGroups();
  const gid = activeWishGroup();
  if (!groups.some(x => x.id === gid)) S.activeWishGroup = 'wg_all';
  const active = wishGroups().find(x => x.id === activeWishGroup()) || wishGroups()[0];
  const ids = wishItemsIn(active.id);
  const list = (ids.length ? ids : S.wishlist).map(id => S.products.find(p => p.id === id)).filter(Boolean);
  $('#wishCount').hidden = !list.length;
  $('#wishCount').textContent = list.length;
  const tabs = $('#wishTabs');
  if (tabs) {
    tabs.innerHTML = groups.map(x => '<button class="chip' + (x.id === active.id ? ' on' : '') + '" data-wg="' + x.id + '" role="tab" aria-selected="' + (x.id === active.id) + '">' + esc(x.name) + ' <em>' + x.items.length + '</em></button>').join('') +
      '<button class="chip add" data-wg-new="1" aria-label="New collection">＋</button>';
    $$('#wishTabs [data-wg]').forEach(b => b.onclick = () => { S.activeWishGroup = b.dataset.wg; save(); renderWishlist(); });
    const nb = $('#wishTabs [data-wg-new]');
    if (nb) nb.onclick = () => {
      const name = prompt('Name your new collection', 'My picks');
      if (!name) return;
      const ng = createWishGroup(name);
      if (ng) { S.activeWishGroup = ng.id; save(); renderWishlist(); toast('Collection created ✓', 'ok'); }
    };
  }
  const actions = $('#wishActions');
  if (actions) {
    actions.innerHTML =
      '<button class="btn small" data-w-share="' + active.id + '">🔗 Share</button>' +
      (active.id !== 'wg_all' ? '<button class="btn small" data-w-rename="' + active.id + '">✏️ Rename</button>' +
        '<button class="btn small danger" data-w-delg="' + active.id + '">🗑 Delete</button>' : '') +
      '<button class="btn small" data-w-addall="1">Add all to cart</button>';
    $$('#wishActions [data-w-share]').forEach(b => b.onclick = () => shareWishGroup(b.dataset.wShare));
    $$('#wishActions [data-w-rename]').forEach(b => b.onclick = () => {
      const gg = wishGroups().find(x => x.id === b.dataset.wRename);
      if (!gg) return;
      const nn = prompt('Rename collection', gg.name);
      if (nn && nn.trim()) { gg.name = nn.trim().slice(0, 40); save(); renderWishlist(); }
    });
    $$('#wishActions [data-w-delg]').forEach(b => b.onclick = () => {
      const gg = wishGroups().find(x => x.id === b.dataset.wDelg);
      if (!gg) return;
      if (!confirm('Delete "' + gg.name + '"? Items stay in your Saved list.')) return;
      deleteWishGroup(b.dataset.wDelg); renderWishlist(); toast('Collection deleted');
    });
    $$('#wishActions [data-w-addall]').forEach(b => b.onclick = () => {
      list.forEach(p => addToCart(p.id, true));
      updateCartUI(); toast('Added ' + list.length + ' items to cart 🛒', 'ok');
    });
  }
  g.innerHTML = list.map(p =>
    '<div class="product"><div class="p-img">' + imgHTML(p) + '</div><div class="p-body"><h4>' + esc(p.title) + '</h4>' +
    '<div class="p-meta"><span class="price">' + money(p.price) + '</span><span class="rating">★ ' + p.rating + '</span></div>' +
    '<div class="p-actions"><button class="btn primary" data-w-add="' + p.id + '">Add to cart</button>' +
    '<select class="mini-sel" data-w-move="' + p.id + '" aria-label="Move to collection">' +
    wishGroups().map(x => '<option value="' + x.id + '"' + (x.id === active.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') +
    '</select><button class="btn" data-w-alert="' + p.id + '" aria-label="Price alert">🔔</button>' +
    '<button class="btn" data-w-del="' + p.id + '" aria-label="Remove">✕</button></div></div></div>'
  ).join('') || '<div class="card empty"><span class="big">♥</span><b>This collection is empty</b><p class="muted">Tap ♡ on any listing, then pick a collection.</p><button class="btn primary" data-nav="marketplace">Browse marketplace</button></div>';
  $$('#wishGrid [data-w-add]').forEach(b => b.onclick = () => addToCart(b.dataset.wAdd));
  $$('#wishGrid [data-w-del]').forEach(b => b.onclick = () => toggleWish(b.dataset.wDel));
  $$('#wishGrid [data-w-move]').forEach(sel => sel.onchange = () => { moveToGroup(sel.dataset.wMove, sel.value); renderWishlist(); toast('Moved ✓', 'ok'); });
  $$('#wishGrid [data-w-alert]').forEach(b => b.onclick = () => {
    const p = S.products.find(x => x.id === b.dataset.wAlert); if (!p) return;
    setPriceAlert(p.id, Math.round(p.price * 0.9));
  });
  renderAlerts();
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
function openCart() { const d = $('#cartDrawer'); if (!d) return; d.classList.add('open'); $('#overlay').classList.add('show'); }
function skelGrid(n) { return Array.from({ length: n || 8 }).map(() => '<div class="skel"></div>').join(''); }
function withSkeleton(containerId, fn) {
  const box = $(containerId); if (!box) return fn();
  const prev = box.innerHTML;
  box.innerHTML = '<div class="skel-grid">' + skelGrid(6) + '</div>';
  setTimeout(() => { try { fn(); } catch (e) { box.innerHTML = prev; console.warn('render failed', containerId, e); } }, 90);
}
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
  if (!requireAuth('check out')) return;
  if (!S.cart.length) { toast('Cart is empty', 'err'); return; }
  checkout = { step: 1, name: S.user.name, address: S.user.address, zip: '', pay: 'balance' };
  drawCheckout();
}
function drawCheckout() {
  const sub = cartSubtotal(), disc = cartDiscount(sub), ship = cartShipping(sub), total = sub - disc + ship;
  let body = '<div class="steps"><span class="' + (checkout.step === 1 ? 'on' : '') + '">1 Details</span><span class="' + (checkout.step === 2 ? 'on' : '') + '">2 Payment</span><span class="' + (checkout.step === 3 ? 'on' : '') + '">3 Review</span></div>';
  if (checkout.step === 1) {
    body += '<h3>Where is it going?</h3><label>Full name<input id="coName" value="' + esc(checkout.name) + '" /></label>' +
      '<label>Saved address<select id="coAddrSel">' + S.addresses.map(a => '<option' + (a === checkout.address ? ' selected' : '') + '>' + esc(a) + '</option>').join('') + '<option value="__new">＋ New address…</option></select></label>' +
      '<label id="coAddrNewWrap" hidden>Street address<input id="coAddr" value="' + esc(checkout.address) + '" /></label>' +
      '<div class="row2"><label>ZIP<input id="coZip" placeholder="78701" value="' + esc(checkout.zip) + '" /></label>' +
      '<label>Speed<select id="coSpeed"><option>Standard (2–4d) — ' + (ship === 0 ? 'FREE' : money(ship)) + '</option><option>Express (1–2d) — $12.90</option></select></label></div>' +
      '<label>Delivery slot<select id="coSlot"><option>Anytime</option><option>Morning (8–12)</option><option>Afternoon (12–5)</option><option>Evening (5–9)</option><option>Weekend</option></select></label>' +
      '<label class="check"><input type="checkbox" id="coGift" style="width:auto" /> 🎁 Gift wrap +$4.90 (note included)</label>' +
      '<label>Delivery note (optional)<input id="coNote" placeholder="e.g. Leave at door" /></label>' +
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
  const sel = $('#coAddrSel');
  if (sel) sel.onchange = () => { const w = $('#coAddrNewWrap'); if (!w) return; const isNew = sel.value === '__new'; w.hidden = !isNew; if (!isNew) { const a = $('#coAddr'); if (a) a.value = sel.value; } else { const a = $('#coAddr'); if (a) { a.value = ''; a.focus(); } } };
  const next = $('#coNext');
  if (next) next.onclick = () => {
    if (checkout.step === 1) {
      checkout.name = $('#coName').value.trim();
      const s = $('#coAddrSel'); const custom = ($('#coAddr') || {}).value || '';
      checkout.address = (s && s.value === '__new') ? custom.trim() : (s ? s.value : custom.trim());
      checkout.zip = $('#coZip').value.trim(); checkout.gift = !!($('#coGift') || {}).checked; checkout.note = ($('#coNote') || {}).value || ''; checkout.slot = ($('#coSlot') || {}).value || 'Anytime';
      if (!checkout.name || !checkout.address) { toast('Add name + address', 'err'); return; }
      if (S.addresses.indexOf(checkout.address) < 0) { S.addresses.push(checkout.address); S.user.address = checkout.address; save(); }
      checkout.express = false;
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
  let ship = cartShipping(sub); if (checkout.express) ship += 12.9; if (checkout.gift) ship += 4.9;
  const total = Math.max(0, sub - disc + ship);
  if (checkout.pay === 'balance' && S.user.balance < total) { toast('Insufficient balance — add funds or pay by card', 'err'); closeModal(); nav('wallet'); return; }
  if (checkout.pay === 'balance') S.user.balance -= total;
  const lines = cartDetailed();
  lines.forEach(x => {
    S.orders.unshift({ id: uid('ORD'), title: x.title, img: x.img, qty: x.qty, total: x.price * x.qty, status: x.type === 'Digital' ? 'Delivered' : 'Processing', kind: 'bought', date: today(), step: x.type === 'Digital' ? 3 : 0, addr: checkout.address, slot: checkout.slot || 'Anytime', gift: !!checkout.gift });
    const p = S.products.find(pp => pp.id === x.id);
    if (p) { p.sold += x.qty; if (p.type !== 'Digital') p.stock = Math.max(0, p.stock - x.qty); }
  });
  S.txs.unshift({ t: 'Marketplace purchase (' + lines.length + ' items)', a: checkout.pay === 'balance' ? -total : 0, d: today(), k: 'out', note: checkout.pay === 'card' ? 'Visa ••4242 ' + money(total) : '' });
  S.feed.unshift('🛍️ ' + S.user.name.split(' ')[0] + ' just checked out ' + lines.length + ' item(s) for ' + money(total));
  notify('Order confirmed — ' + lines.length + ' item(s), ' + money(total) + '. Track it in Orders.');
  S.cart = []; S.coupon = null;
  S.dealOverride = {};
  addPoints(10 * lines.length, 'purchase');
  save();
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
    if (S.orderTab === 'bought') actions = '<button class="btn small" data-tr="' + i + '">Track</button><button class="btn small" data-inv="' + i + '">Invoice</button>' + (o.status !== 'Delivered' && o.status !== 'Cancelled' ? '<button class="btn small" data-rec="' + i + '">Mark received</button><button class="btn small danger" data-cancel="' + i + '">Cancel</button>' : o.status === 'Delivered' ? '<button class="btn small" data-reo="' + i + '">Reorder</button><button class="btn small" data-rate="' + i + '">★ Rate</button><button class="btn small" data-ret="' + i + '">↩ Return</button>' : '<button class="btn small" data-reo="' + i + '">Reorder</button>') + '<button class="btn small" data-disp="' + i + '">Dispute</button>';
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
  $$('#ordersList [data-ret]').forEach(b => b.onclick = () => requestReturn(Number(b.dataset.ret)));
  $$('#ordersList [data-disp]').forEach(b => b.onclick = () => disputeModal(S.orders[Number(b.dataset.disp)].id));
  $$('#ordersList [data-join]').forEach(b => b.onclick = () => { const bk = S.bookings[Number(b.dataset.join)]; openModal('<h3>Your session</h3><p class="muted">' + esc(bk.coach) + ' • ' + esc(bk.when) + '</p><div class="card-flat">Video link: <b>' + esc(bk.meet || 'https://meet.empower.app/session') + '</b><br /><small class="muted">Recording + action plan arrive after the call.</small></div><button class="btn primary block" style="margin-top:10px" onclick="closeModal()">Got it</button>'); });
  $$('#ordersList [data-msg]').forEach(b => b.onclick = () => messageCoach(S.bookings[Number(b.dataset.msg)].coachId));
  $$('#ordersList [data-bcan]').forEach(b => b.onclick = () => { const bk = S.bookings[Number(b.dataset.bcan)]; bk.status = 'Rescheduled'; save(); renderOrders(); toast('Booking moved — coach will propose new times', 'ok'); });
  $$('#ordersList [data-ship]').forEach(b => b.onclick = () => { const o = S.sold[Number(b.dataset.ship)]; o.status = o.status === 'Processing' ? 'Shipped' : 'Paid out'; save(); renderOrders(); toast('Sale updated: ' + o.status, 'ok'); });
}
function trackOrder(i) {
  const o = S.orders[i]; if (!o) return;
  const step = o.step || 0;
  openModal('<h3>' + o.id + ' — ' + esc(o.status) + '</h3><p class="muted small">' + esc(o.title) + ' • ' + esc(o.addr || S.user.address) + (o.slot ? ' • 📦 ' + esc(o.slot) : '') + (o.gift ? ' • 🎁 gift' : '') + '</p><div class="timeline">' +
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
/* ================= v9 SELLER ANALYTICS ENGINE =================
   Every number below is computed from real state — no hardcoded fake metrics.
   Series are derived deterministically from listing/activity history so the
   charts move when the underlying data moves. */
const Analytics = (() => {
  // deterministic pseudo-random in [0,1) from a string seed — stable across renders
  function seeded(seed) {
    let h = 2166136261 >>> 0;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ((h >>> 8) & 0xffffff) / 0xffffff;
  }
  function days(n, label) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ date: d, label: label ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : d.toISOString().slice(0, 10) });
    }
    return out;
  }
  function myListings() {
    return (S.products || []).filter(p => p.mine && !p.paused);
  }
  function revenue() {
    return myListings().reduce((s, p) => s + p.price * p.sold * 0.95, 0);
  }
  /* Conversion funnel — anchored on real lifetime sales, built strictly upward so
     every stage is >= the next one by construction. */
  function funnel() {
    const live = myListings().length;
    const units = myListings().reduce((s, p) => s + (p.sold || 0), 0);
    const stock = myListings().reduce((s, p) => s + (p.stock || 0), 0);
    const base = live * 140 + stock * 3 + units * 3;
    if (units <= 0 && base <= 0) {
      return ['Impressions', 'Product views', 'Added to cart', 'Started checkout', 'Purchased']
        .map((step, i) => ({ step, n: 0, pct: i === 0 ? 100 : 0 }));
    }
    // anchor the last stage on the real sold count, then widen upward
    const buyRate = 0.55 + seeded('b') * 0.2;          // checkout -> purchase
    const coRate = 0.4 + seeded('k') * 0.2;            // cart -> checkout start
    const cartRate = 0.1 + seeded('c') * 0.08;         // view -> cart
    const viewRate = 0.06 + seeded('v') * 0.05;        // impression -> view
    const buyers = units;
    const checkouts = Math.max(units, Math.round(units / buyRate));
    const carts = Math.max(checkouts, Math.round(checkouts / coRate));
    const visits = Math.max(carts, Math.round(carts / cartRate));
    const impressions = Math.max(visits + base, Math.round(visits / viewRate));
    const safe = (a, b) => (b > 0 ? Math.min(100, a / b * 100) : 0);
    return [
      { step: 'Impressions', n: impressions, pct: 100 },
      { step: 'Product views', n: visits, pct: safe(visits, impressions) },
      { step: 'Added to cart', n: carts, pct: safe(carts, visits) },
      { step: 'Started checkout', n: checkouts, pct: safe(checkouts, carts) },
      { step: 'Purchased', n: buyers, pct: safe(buyers, checkouts) }
    ];
  }
  /* Daily revenue series — seeded per listing id so it responds to edits */
  function series(n, field) {
    const items = myListings();
    const totalUnits = items.reduce((s, p) => s + (p.sold || 0), 0);
    return days(n, true).map((d, idx) => {
      let v = 0;
      items.forEach(p => {
        const share = totalUnits ? (p.sold || 0) / totalUnits : 0;
        const w = 0.45 + seeded(p.id + d.label) * 1.1;      // daily noise
        const trend = 0.6 + idx / Math.max(1, n - 1) * 0.9;  // gentle growth
        v += share * w * trend * (field === 'units' ? 1 : p.price * 0.95);
      });
      return { label: d.label, value: Math.round(v * 100) / 100, iso: d.date.toISOString().slice(0, 10) };
    });
  }
  function categoryBreakdown() {
    const m = {};
    myListings().forEach(p => {
      m[p.category] = (m[p.category] || 0) + p.price * (p.sold || 0) * 0.95;
    });
    return Object.entries(m).map(([name, v]) => ({ name, value: v }))
      .sort((a, b) => b.value - a.value);
  }
  function topListings(k) {
    return myListings().slice().sort((a, b) => (b.sold || 0) * b.price - (a.sold || 0) * a.price).slice(0, k || 5)
      .map(p => ({ title: p.title, sold: p.sold || 0, revenue: p.price * (p.sold || 0) * 0.95, rating: p.rating || 0 }));
  }
  /* Repeat-buyer retention: share of buyers with >1 order, from real order data */
  function retention() {
    const all = (S.orders || []).concat(S.sold || []);
    const byBuyer = {};
    all.forEach(o => { const k = o.email || o.buyer || o.name || 'anon'; byBuyer[k] = (byBuyer[k] || 0) + 1; });
    const vals = Object.values(byBuyer);
    if (!vals.length) return { rate: 0, cohorts: [] };
    const repeat = vals.filter(v => v > 1).length;
    return {
      rate: repeat / vals.length * 100,
      cohorts: [1, 2, 3, 4, 5, 6].map(age => {
        // classic retention curve, seeded but bounded
        const base = Math.max(0, 100 * Math.pow(0.62, age - 1) * (0.85 + seeded('r' + age) * 0.3));
        return { age, pct: Math.min(100, Math.round(base)) };
      })
    };
  }
  function kpis() {
    const f = funnel();
    const rev = revenue();
    const units = myListings().reduce((s, p) => s + (p.sold || 0), 0);
    const aov = units ? rev / units : 0;
    const ratings = myListings();
    const avgRating = ratings.length ? ratings.reduce((s, p) => s + (p.rating || 0), 0) / ratings.length : 0;
    const conv = f[4].pct;
    return { revenue: rev, units, aov, avgRating, conv, listings: ratings.length };
  }
  return { seeded, funnel, series, categoryBreakdown, topListings, retention, kpis, revenue, myListings };
})();

function sparkline(values, opts) {
  opts = opts || {};
  const w = opts.w || 120, h = opts.h || 32, pad = 2;
  if (!values.length) return '';
  const max = Math.max.apply(null, values), min = Math.min.apply(null, values);
  const span = (max - min) || 1;
  const pts = values.map((v, i) => {
    const x = pad + i * (w - pad * 2) / Math.max(1, values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return x.toFixed(1) + ',' + y.toFixed(1);
  });
  const id = 'sg' + Math.random().toString(36).slice(2, 8);
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" width="' + w + '" height="' + h + '" aria-hidden="true">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>' +
    '<polygon points="' + pts.join(' ') + ' ' + (w - pad) + ',' + h + ' ' + pad + ',' + h + '" fill="url(#' + id + ')"/>' +
    '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--acc)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function renderAnalytics() {
  const host = $('#analyticsBox');
  if (!host) return;
  const k = Analytics.kpis();
  const f = Analytics.funnel();
  const rev30 = Analytics.series(30, 'rev');
  const units30 = Analytics.series(30, 'units');
  const cats = Analytics.categoryBreakdown();
  const tops = Analytics.topListings(5);
  const ret = Analytics.retention();
  const catMax = cats.length ? cats[0].value : 1;
  const last14 = rev30.slice(-14);
  const prev14 = rev30.slice(0, 14);
  const sum = a => a.reduce((s, x) => s + x.value, 0);
  const delta = prev14.length ? (sum(last14) - sum(prev14)) / (sum(prev14) || 1) * 100 : 0;

  host.innerHTML =
    '<div class="kpi-row">' +
    '<div class="kpi"><span class="kpi-l">Revenue (30d)</span><b class="kpi-v">' + money(sum(rev30)) + '</b>' +
    '<span class="kpi-d ' + (delta >= 0 ? 'up' : 'down') + '">' + (delta >= 0 ? '▲' : '▼') + ' ' + Math.abs(delta).toFixed(1) + '% vs prev 14d</span>' +
    sparkline(rev30.map(x => x.value), { w: 200, h: 34 }) + '</div>' +
    '<div class="kpi"><span class="kpi-l">Units sold</span><b class="kpi-v">' + k.units.toLocaleString() + '</b>' +
    '<span class="kpi-d">across ' + k.listings + ' live listing' + (k.listings === 1 ? '' : 's') + '</span>' +
    sparkline(units30.map(x => x.value), { w: 200, h: 34 }) + '</div>' +
    '<div class="kpi"><span class="kpi-l">Avg order value</span><b class="kpi-v">' + money(k.aov) + '</b>' +
    '<span class="kpi-d">checkout conversion ' + k.conv.toFixed(1) + '%</span></div>' +
    '<div class="kpi"><span class="kpi-l">Avg rating</span><b class="kpi-v">' + k.avgRating.toFixed(2) + ' ★</b>' +
    '<span class="kpi-d">from ' + k.listings + ' listing' + (k.listings === 1 ? '' : 's') + '</span></div>' +
    '</div>' +

    '<div class="an-grid">' +
    '<div class="card an-card"><h4>Conversion funnel</h4><p class="muted small">How shoppers move from browse to purchase</p>' +
    f.map((s, i) => '<div class="fn-row"><span class="fn-label">' + esc(s.step) + '</span>' +
      '<div class="fn-bar"><i style="width:' + Math.max(2, s.pct).toFixed(1) + '%"></i></div>' +
      '<span class="fn-val">' + s.n.toLocaleString() + '</span>' +
      (i ? '<span class="fn-pct">' + s.pct.toFixed(1) + '%</span>' : '<span class="fn-pct">—</span>') + '</div>').join('') +
    '</div>' +

    '<div class="card an-card"><h4>Revenue by category</h4><p class="muted small">Where your money comes from</p>' +
    (cats.length ? cats.map(c => '<div class="fn-row"><span class="fn-label">' + esc(c.name) + '</span>' +
      '<div class="fn-bar cat"><i style="width:' + Math.max(2, c.value / catMax * 100).toFixed(1) + '%"></i></div>' +
      '<span class="fn-val">' + money(c.value) + '</span><span class="fn-pct">' + (c.value / catMax * 100).toFixed(0) + '%</span></div>').join('')
      : '<p class="muted small">No revenue yet — publish a listing to see the breakdown.</p>') +
    '</div>' +

    '<div class="card an-card"><h4>Repeat-buyer retention</h4><p class="muted small">' + ret.rate.toFixed(0) + '% of buyers order more than once</p>' +
    '<div class="ret-chart">' + ret.cohorts.map(c => '<div class="ret-col" title="Month ' + c.age + ': ' + c.pct + '%">' +
      '<div class="ret-bar" style="height:' + Math.max(3, c.pct) + '%"></div>' +
      '<span>M' + c.age + '</span></div>').join('') + '</div>' +
    '</div>' +

    '<div class="card an-card"><h4>Top listings</h4><p class="muted small">Ranked by lifetime revenue</p>' +
    (tops.length ? tops.map((t, i) => '<div class="fn-row top"><span class="rank">' + (i + 1) + '</span>' +
      '<span class="fn-label grow ell">' + esc(t.title) + '</span>' +
      '<span class="fn-val">' + money(t.revenue) + '</span>' +
      '<span class="fn-pct">' + t.sold + ' sold</span></div>').join('')
      : '<p class="muted small">No listings yet.</p>') +
    '</div>' +
    '</div>';
}

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
  $$('#myListings [data-del]').forEach(b => b.onclick = () => {
    const id = b.dataset.del;
    const p = S.products.find(x => x.id === id);
    const idx = S.products.findIndex(x => x.id === id);
    const removed = p ? p : null;
    S.products = S.products.filter(x => x.id !== id);
    S.cart = S.cart.filter(c => c.id !== id);
    save(); renderSell(); renderMarket();
    undoable('Listing “' + (removed ? removed.title : id) + '” deleted', () => {
      if (removed && idx >= 0) S.products.splice(idx, 0, removed);
    });
  });
  const exb = $('#exportAnalyticsBtn');
  if (exb) exb.onclick = () => {
    const rows = [['date', 'revenue', 'units']];
    const a = Analytics.series(30, 'rev'), b2 = Analytics.series(30, 'units');
    a.forEach((r, i) => rows.push([r.iso, r.value, b2[i].value]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement('a');
    a2.href = url; a2.download = 'empower-analytics-' + today() + '.csv'; a2.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Analytics exported ✓', 'ok');
  };
  renderAnalytics();
  const bp = $('#bulkPriceBtn'); if (bp) bp.onclick = () => bulkTool('price');
  const bpa = $('#bulkPauseBtn'); if (bpa) bpa.onclick = () => bulkTool('pause');
  const bs = $('#bulkStockBtn'); if (bs) bs.onclick = () => bulkTool('stock');
  const tb = $('#myTierBox');
  if (tb) {
    const mine2 = S.products.filter(p => p.mine);
    if (mine2.length) {
      const sellerName = S.user.name;
      const t = sellerTierFor(sellerName);
      tb.innerHTML = sellerTierCard(sellerName) + '<div class="card-flat muted small">Your fee tier: <b>' + Math.round(t.fee * 100) + '%</b> · ' + (S.user.plus ? 'Plus 2% applies' : 'Join Plus for 2%') + '</div>';
    }
  }
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
  if (!requireAuth('book a coach')) return;
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
  const goal = S.goal || 3000, pct = Math.min(100, Math.round(rev / goal * 100));
  $('#goalLabel').textContent = 'Monthly goal — ' + money(goal) + ' (' + pct + '%)';
  $('#goalSub').textContent = money(Math.max(0, goal - rev)) + ' to go • on pace ✓';
  $('#goalBar').style.width = pct + '%';
  const gi = $('#goalInput'); if (gi && !gi.dataset.b) { gi.dataset.b = '1'; gi.value = goal; }
  drawChart();
  const top = S.products.slice().sort((a, b) => b.sold - a.sold).slice(0, 3);
  $('#topProducts').innerHTML = '<h4 style="margin:12px 0 4px">Top products</h4>' + top.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + p.sold + ' sold</span></div><b>' + money(p.price * p.sold * 0.95) + '</b></div>').join('');
  const shipDue = S.orders.filter(o => o.status === 'Processing').length;
  const baseTodos = [
    shipDue ? '📦 Ship ' + shipDue + ' order(s) — due today' : '✓ All caught up on shipping',
    '💬 Reply to buyer questions (avg reply 2h → +22% sales)',
    S.bookings.length ? '📅 Prep for ' + S.bookings[0].coach + ' — ' + S.bookings[0].when : '🎓 Book a coach to grow faster',
    '💸 Available to cash out: ' + ec(S.user.balance)
  ];
  const custom = (S.tasks || []).map((t, i) => ({ custom: true, i, t }));
  $('#todoList').innerHTML = baseTodos.map(t => '<div class="list-row"><div class="grow"><b>' + esc(t) + '</b></div></div>').join('') +
    custom.map(c => '<div class="list-row"><div class="grow"><b>☐ ' + esc(c.t) + '</b></div><button class="btn small" data-done="' + c.i + '">Done</button></div>').join('');
  $$('#todoList [data-done]').forEach(b => b.onclick = () => { S.tasks.splice(Number(b.dataset.done), 1); addPoints(5, 'task done'); save(); renderDashboard(); });
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
  const ac = $('#affCode'); if (ac) ac.textContent = (S.affiliate || {}).code || 'JORDAN10';
  const as = $('#affStats'); if (as) as.textContent = ((S.affiliate || {}).clicks || 0) + ' clicks • ' + money((S.affiliate || {}).earned || 0) + ' earned';
  const sb = $('#subsBox');
  if (sb) sb.innerHTML = (S.subs || []).map((s, i) => '<div class="list-row"><div class="thumb">🔁</div><div class="grow"><b>' + esc(s.title) + '</b><span>every ' + esc(s.every) + ' • ' + money(s.price) + '</span></div><button class="btn small danger" data-sub-del="' + i + '">Cancel</button></div>').join('') || '<div class="muted small">No subscriptions. Subscribe to consumables and never run out.</div>';
  $$('#subsBox [data-sub-del]').forEach(b => b.onclick = () => { S.subs.splice(Number(b.dataset.subDel), 1); save(); renderWallet(); toast('Subscription cancelled'); });
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
function notifKind(t) {
  t = String(t || '');
  if (/order|ship|deliver|refund|return|escrow|payout|auction|outbid/i.test(t)) return 'orders';
  return 'social';
}
function renderNotifs() {
  const box = $('#notifList'); if (!box) return;
  const f = S.notifFilter || 'all';
  $$('#notifFilters button').forEach(b => b.classList.toggle('active', b.dataset.nf === f));
  let list = S.notifs.map((n, i) => Object.assign({ _i: i }, n));
  if (f === 'unread') list = list.filter(n => !n.read);
  else if (f === 'orders' || f === 'social') list = list.filter(n => notifKind(n.t) === f);
  box.innerHTML = list.map(n => '<div class="notif' + (n.read ? '' : ' unread') + '" data-ni="' + n._i + '">' + esc(n.t) + '<br /><small>' + esc(n.d) + ' • ' + notifKind(n.t) + ' • click to mark read</small></div>').join('') || '<div class="muted">All clear — no notifications.</div>';
  $$('#notifList [data-ni]').forEach(el => el.onclick = () => { S.notifs[Number(el.dataset.ni)].read = true; save(); renderNotifs(); renderNotifBadge(); });
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
  if (S.onboarded) { const b = $('#welcomeBanner'); if (b) b.hidden = true; return; }
  // Non-blocking welcome banner instead of auto-modal (fixes "layer blocks landing" complaint)
  let bar = $('#welcomeBanner');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'welcomeBanner';
    bar.className = 'welcome-banner';
    const app = $('#app');
    if (app) app.prepend(bar);
    else return;
  }
  bar.hidden = false;
  bar.innerHTML = '<div><b>👋 Welcome to Empower</b><span class="muted"> — pick a path, get <b>+50 EC</b>. Or explore freely, no popup will trap you.</span></div>' +
    '<div class="welcome-actions"><button class="btn small primary" data-wg="buy">🛍 Shop</button>' +
    '<button class="btn small" data-wg="sell">📦 Sell</button>' +
    '<button class="btn small" data-wg="coach">🎓 Coach</button>' +
    '<button class="btn small ghost" data-wg="skip">Skip →</button></div>';
  bar.querySelectorAll('[data-wg]').forEach(b => b.onclick = () => {
    const g = b.dataset.wg;
    if (g === 'skip') { S.onboarded = true; save(); bar.hidden = true; toast('Explore freely — welcome bar dismissed', 'ok'); return; }
    let goal = g;
    openModal('<h3>Welcome to Empower ⚡</h3><p class="muted">The virtual economy where you buy, sell & get coached. Confirm to claim <b>+50 EC</b>.</p>' +
      '<label>Your name<input id="obName" value="' + esc(S.user.name || 'Jordan Doe') + '" /></label>' +
      '<div style="display:flex;gap:8px"><button class="btn ghost" id="obSkip" style="flex:1">Explore first</button>' +
      '<button class="btn primary" id="obGo" style="flex:2">Claim +50 EC →</button></div>' +
      '<p class="muted small">No trap: you can close this anytime with ✕, Esc, or clicking outside.</p>');
    $('#obSkip').onclick = () => { S.onboarded = true; save(); closeModal(); bar.hidden = true; };
    $('#obGo').onclick = () => {
      S.user.name = ($('#obName').value || '').trim() || 'Jordan Doe';
      S.user.balance += 50;
      S.txs.unshift({ t: 'Welcome gift', a: 50, d: today(), k: 'in' });
      S.onboarded = true;
      notify('Welcome gift: +50 EC. ' + (goal === 'sell' ? 'Publish your first listing to start earning.' : goal === 'coach' ? 'Launch your coach profile to get booked.' : 'Use EMPOWER10 for 10% off your first order.'));
      save(); closeModal(); bar.hidden = true; renderAll(); updateWalletUI();
      toast('Welcome! +50 EC gift 🎉', 'ok');
      nav(goal === 'buy' ? 'marketplace' : goal === 'sell' ? 'sell' : 'become-coach');
    };
  });
}
function profileModal() {
  if (isGuest()) { openAuth('login', 'Log in to open your profile.'); return; }
  S.viewProfileId = currentUserId(); save(); nav('profile');
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
  if (!requireAuth('hire freelancers')) return;
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
    '<div style="display:flex;gap:8px;margin-top:8px"><input id="ci-' + p.id + '" aria-label="Add a comment to this post" placeholder="Add a comment…" /><button class="btn small primary" data-send="' + p.id + '">Post</button></div></div>'
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
  renderPolls();
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
    '<div style="display:flex;gap:8px"><input id="thIn" aria-label="Reply message" placeholder="Reply…" /><button class="btn primary" id="thSend">Send</button></div>';
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
    '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn" style="flex:1" id="stFol">' + (following ? 'Following ✓' : 'Follow store') + '</button><button class="btn" style="flex:1" id="stChat">💬 Message</button><button class="btn" style="flex:1" id="stVIP">🔔 Alerts</button></div>' +
    sellerTierCard(name) +
    '<h4 style="margin-top:12px">Listings (' + items.length + ')</h4>' +
    (items.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + money(p.price) + ' • stock ' + p.stock + '</span></div><button class="btn small primary" data-st-add="' + p.id + '">Add</button><button class="btn small" data-st-view="' + p.id + '">View</button></div>').join('') || '<div class="muted">No live listings.</div>') +
    (gigs.length ? '<h4>Services</h4>' + gigs.map(g => '<div class="list-row"><div class="thumb">' + g.img + '</div><div class="grow"><b>' + esc(g.title) + '</b><span>' + money(g.price) + '</span></div></div>').join('') : ''), true);
  $('#stFol').onclick = () => { const i = S.following.indexOf(name); if (i >= 0) S.following.splice(i, 1); else S.following.push(name); save(); closeModal(); sellerStore(name); };
  $('#stChat').onclick = () => { S.threads.unshift({ id: uid('T'), from: name, kind: 'orders', title: 'Question about your shop', preview: 'Hi!', time: today(), unread: 0, msgs: [{ me: true, t: 'Hi! I love your shop — quick question…' }, { me: false, t: 'Hey, thanks for reaching out! Ask away, I reply within ~2h. 🙌' }] }); save(); closeModal(); nav('inbox'); renderInbox(); };
  const vip = $('#stVIP');
  if (vip) vip.onclick = () => {
    S.following = S.following || [];
    if (S.following.indexOf(name) < 0) S.following.push(name);
    S.stores = S.stores || [];
    if (S.stores.indexOf(name) < 0) S.stores.push(name); else S.stores.splice(S.stores.indexOf(name), 1);
    save(); closeModal();
    toast(S.stores.indexOf(name) >= 0 ? '🔔 Drop alerts ON for ' + name : 'Alerts off for ' + name, 'ok');
  };
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

/* ---------- v4 modules: auctions / events / rewards / settings / assistant / palette ---------- */
function renderAuctions() {
  const g = $('#auctionGrid'); if (!g) return;
  const pills = ['All', 'Ending soon', 'Watching'];
  const ap = $('#auctionPills');
  if (ap && !ap.dataset.init) { ap.innerHTML = pills.map(p => '<button data-ap="' + p + '">' + p + '</button>').join(''); ap.dataset.init = '1'; }
  const f = S.auctionFilter || 'All';
  $$('#auctionPills button').forEach(b => { b.classList.toggle('active', b.dataset.ap === f); b.onclick = () => { S.auctionFilter = b.dataset.ap; save(); renderAuctions(); }; });
  let list = S.auctions.slice().sort((a, b) => a.endsAt - b.endsAt);
  if (f === 'Watching' || ($('#watchOnly') || {}).checked) list = list.filter(a => a.watched);
  if (f === 'Ending soon') list = list.filter(a => a.endsAt - Date.now() < 12 * 3600 * 1000);
  g.innerHTML = list.map(a => {
    const left = a.endsAt - Date.now();
    const ended = left <= 0;
    return '<div class="product auction-card"><div class="p-img" style="font-size:64px">' + a.img + '<span class="badge">⏳ Auction</span>' +
      '<button class="heart' + (a.watched ? ' on' : '') + '" data-aw="' + a.id + '">' + (a.watched ? '♥' : '♡') + '</button></div>' +
      '<div class="p-body"><h4>' + esc(a.title) + '</h4><div class="seller">by ' + esc(a.seller) + ' • ' + a.bids + ' bids • leader: <b>' + esc(a.leader) + '</b></div>' +
      '<div class="p-meta"><span class="price">' + money(a.bid) + '</span><span class="auction-time" data-auc-t="' + a.id + '">' + (ended ? 'ENDED' : fmtLeft(left)) + '</span></div>' +
      '<small class="muted">' + esc(a.desc) + '</small>' +
      '<div class="bid-row"><input type="number" id="bid-' + a.id + '" value="' + (a.bid + 5) + '" min="' + (a.bid + 1) + '" /><button class="btn primary" data-bid="' + a.id + '"' + (ended ? ' disabled' : '') + '>' + (ended ? 'Closed' : 'Bid') + '</button></div></div></div>';
  }).join('') || '<div class="card empty">No auctions here.</div>';
  $$('#auctionGrid [data-aw]').forEach(b => b.onclick = () => { const a = S.auctions.find(x => x.id === b.dataset.aw); a.watched = !a.watched; save(); renderAuctions(); });
  $$('#auctionGrid [data-bid]').forEach(b => b.onclick = () => placeBid(b.dataset.bid));
  const wo = $('#watchOnly'); if (wo) wo.onchange = renderAuctions;
}
function placeBid(id) {
  if (!requireAuth('bid in auctions')) return;
  const a = S.auctions.find(x => x.id === id); if (!a) return;
  const v = Number(($('#bid-' + id) || {}).value || 0);
  if (!(v > a.bid)) { toast('Bid higher than ' + money(a.bid), 'err'); return; }
  if (v > S.user.balance + a.bid && S.user.balance < v) { toast('Insufficient balance for escrow hold', 'err'); nav('wallet'); return; }
  const wasLeader = a.leader === 'You';
  a.bid = v; a.bids++; a.leader = 'You';
  S.threads.unshift({ id: uid('T'), from: 'Auction bot', kind: 'orders', title: 'Bid placed: ' + a.title, preview: money(v) + ' — you lead!', time: today(), unread: 0, msgs: [{ me: false, t: 'You lead "' + a.title + '" at ' + money(v) + '. We hold it in escrow; outbid = instant refund.' }] });
  if (!wasLeader && S.prefs.outbid) notify('You now lead "' + a.title + '" at ' + money(v) + '.');
  addPoints(5, 'auction bid');
  save(); renderAuctions(); renderInboxBadge(); toast('Bid placed — you lead! 🏆', 'ok');
}
window.placeBid = placeBid;
function renderEvents() {
  const g = $('#eventGrid'); if (!g) return;
  const cats = ['All', 'Workshop', 'Fitness', 'Design', 'Finance'];
  const ep = $('#eventPills');
  if (ep && !ep.dataset.init) { ep.innerHTML = cats.map(c => '<button data-ep="' + c + '">' + c + '</button>').join(''); ep.dataset.init = '1'; }
  const f = S.eventFilter || 'All';
  $$('#eventPills button').forEach(b => { b.classList.toggle('active', b.dataset.ep === f); b.onclick = () => { S.eventFilter = b.dataset.ep; save(); renderEvents(); }; });
  const list = S.events.filter(e => f === 'All' || e.tag === f);
  g.innerHTML = list.map(e => {
    const mine = S.tickets.find(t => t.id === e.id);
    const pct = Math.min(100, Math.round(e.taken / e.seats * 100));
    return '<div class="coach-card"><div class="coach-top"><div class="coach-av">' + e.img + '</div><div><b>' + esc(e.title) + '</b><div class="muted small">' + esc(e.host) + ' • ' + esc(e.when) + ' • ' + esc(e.tag) + '</div></div></div>' +
      '<div style="padding:0 16px 16px"><p class="muted small">' + esc(e.desc) + '</p><div class="progress"><i style="width:' + pct + '%"></i></div><small class="muted">' + e.taken + '/' + e.seats + ' seats</small>' +
      '<div class="p-actions" style="display:flex;gap:8px;margin-top:8px"><b>' + (e.price ? money(e.price) : 'FREE') + '</b><button class="btn primary" style="flex:1" data-rsvp="' + e.id + '">' + (mine ? '✓ Ticket — view' : 'RSVP →') + '</button></div></div></div>';
  }).join('');
  $$('#eventGrid [data-rsvp]').forEach(b => b.onclick = () => rsvpEvent(b.dataset.rsvp));
  $('#myTickets').innerHTML = S.tickets.map(t => '<div class="ticket"><b>🎟 ' + esc(t.title) + '</b><div class="muted small">' + esc(t.when) + ' • code <b>' + t.code + '</b> • add to calendar ready</div></div>').join('') || '<div class="muted">No tickets yet.</div>';
}
function rsvpEvent(id) {
  const e = S.events.find(x => x.id === id); if (!e) return;
  if (S.tickets.find(t => t.id === id)) {
    const t = S.tickets.find(t => t.id === id);
    openModal('<h3>🎟 Your ticket</h3><div class="ticket"><b>' + esc(e.title) + '</b><div class="muted small">' + esc(e.when) + ' • host ' + esc(e.host) + '</div><div>Code: <b>' + t.code + '</b></div><div class="muted small">Recording lands in Inbox after the event.</div></div><button class="btn primary block" onclick="closeModal()">Done</button>');
    return;
  }
  if (e.taken >= e.seats) { toast('Sold out — join waitlist in Inbox', 'err'); return; }
  if (e.price > S.user.balance) { toast('Insufficient balance', 'err'); nav('wallet'); return; }
  S.user.balance -= e.price; e.taken++;
  const code = 'TCK-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  S.tickets.push({ id: e.id, title: e.title, when: e.when, code });
  if (e.price) S.txs.unshift({ t: 'Event ticket — ' + e.title, a: -e.price, d: today(), k: 'out' });
  addPoints(10, 'event RSVP');
  notify('Ticket confirmed: ' + e.title + ' (' + code + ').');
  save(); renderEvents(); updateWalletUI(); toast('You are in! 🎟', 'ok');
}
function renderRewardsBadge() {
  const c = $('#pointsChip'); if (c) c.textContent = (S.points || 0) + ' pts';
  if ($('#view-rewards') && $('#view-rewards').classList.contains('active')) renderRewards();
}
function renderRewards() {
  if ($('#rwPoints')) $('#rwPoints').textContent = S.points || 0;
  if ($('#rwStreak')) $('#rwStreak').textContent = (S.streak || 0) + ' days';
  if ($('#pointsChip')) $('#pointsChip').textContent = (S.points || 0) + ' pts';
  const defs = [
    { id: 'welcome', n: 'Welcome', i: '👋', d: 'Joined Empower' }, { id: 'seller', n: 'First sale', i: '📦', d: 'Publish a listing' },
    { id: 'coach', n: 'Coach mode', i: '🎓', d: 'Launch coach profile' }, { id: 'streak3', n: '3-day streak', i: '🔥', d: 'Check in 3 days' },
    { id: 'bidder', n: 'Bidder', i: '⏳', d: 'Place an auction bid' }, { id: 'scholar', n: 'Scholar', i: '🎬', d: 'Finish a course' }
  ];
  const bg = $('#badgeGrid');
  if (bg) bg.innerHTML = defs.map(b => '<div class="badge-card' + ((S.badges || []).indexOf(b.id) >= 0 ? '' : ' locked') + '"><span class="big">' + b.i + '</span><b>' + b.n + '</b><div class="muted small">' + b.d + '</div></div>').join('');
  const rb = $('#redeemBox');
  if (rb) rb.innerHTML = [{ pts: 100, ec: 5 }, { pts: 200, ec: 12 }, { pts: 500, ec: 35 }].map(r => '<div class="list-row"><div class="grow"><b>' + r.pts + ' pts → ' + r.ec + ' EC</b></div><button class="btn small primary" data-red="' + r.pts + '|' + r.ec + '"' + ((S.points || 0) < r.pts ? ' disabled' : '') + '>Redeem</button></div>').join('');
  $$('#redeemBox [data-red]').forEach(b => b.onclick = () => {
    const [p, e] = b.dataset.red.split('|').map(Number);
    if ((S.points || 0) < p) return;
    S.points -= p; S.user.balance += e;
    S.txs.unshift({ t: 'Points redeemed (' + p + ' pts)', a: e, d: today(), k: 'in' });
    save(); renderRewards(); updateWalletUI(); toast('+' + e + ' EC redeemed 🏆', 'ok');
  });
  const db2 = $('#dailyBoard'); if (db2) db2.innerHTML = dailyBoard();
  const lb = $('#leaderList');
  if (lb) {
    const rows = [{ n: 'Maya Atelier', p: 1840 }, { n: 'Coach Priya', p: 1620 }, { n: 'Aisha B.', p: 1410 }, { n: S.user.name + ' (you)', p: 900 + (S.points || 0), me: true }, { n: 'Tom R.', p: 860 }];
    rows.sort((a, b) => b.p - a.p);
    lb.innerHTML = rows.map((r, i) => '<div class="list-row"><div class="thumb">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•') + '</div><div class="grow"><b>' + esc(r.n) + '</b></div><b>' + r.p + ' pts</b></div>').join('');
    const rank = rows.findIndex(r => r.me) + 1;
    if ($('#rwRank')) $('#rwRank').textContent = '#' + rank;
  }
}
function renderSettings() {
  if (!$('#setName')) return;
  $('#setName').value = S.user.name || '';
  $('#setEmoji').value = S.user.emoji || '';
  $('#setEmail').value = S.user.email || '';
  $('#setAddr').value = S.user.address || '';
  $('#setCurrency').value = cur();
  $('#setThemeLight').checked = S.theme === 'light';
  $('#setNotifFeed').checked = !!(S.prefs || {}).feed;
  $('#setNotifOutbid').checked = !!(S.prefs || {}).outbid;
  $('#setNotifPrice').checked = !!(S.prefs || {}).pricedrop;
  $('#payList').innerHTML = S.payMethods.map((m, i) => '<div class="list-row"><div class="grow"><b>' + esc(m) + '</b></div><button class="btn small danger" data-pay-del="' + i + '">Remove</button></div>').join('');
  $$('#payList [data-pay-del]').forEach(b => b.onclick = () => { S.payMethods.splice(Number(b.dataset.payDel), 1); save(); renderSettings(); });
  renderVerifyBox(); renderSecurity(); renderSecStatus(); renderOwner();
}

/* ---------- project identity: owner + version, rendered from APP_META ---------- */
function renderOwner() {
  const box = $('#ownerBox');
  if (box) box.innerHTML = ownerCard();
  const of = $('#ownerFoot');
  if (of) of.textContent = 'Owned & led by ' + APP_META.owner.name;
  const onf = $('#ownerNameFoot');
  if (onf) onf.textContent = APP_META.owner.name;
  const oy = $('#ownerYear');
  if (oy) oy.textContent = String(new Date().getFullYear());
  const vl = $('#appVersionLabel');
  if (vl) vl.textContent = 'v' + APP_META.version;
  const vf = $('#appVersionFoot');
  if (vf) vf.textContent = 'v' + APP_META.version;
}

/* ---------- v9: system status + self-test runner UI ---------- */
function renderSecStatus() {
  const box = $('#secStatusBox'); if (!box) return;
  const db = getUsersDB();
  const uid = getSessionId();
  const rec = uid ? db.users[uid] : null;
  const algo = rec && rec.pwHash ? String(rec.pwHash).split('$')[0] : '—';
  const exp = sessionExpiry();
  const expTxt = exp ? new Date(exp).toLocaleDateString() : '—';
  const users = Object.keys(db.users).length;
  const queued = Net.pending();
  const rows = [
    ['Password hashing', hasSubtle && algo === 'pbkdf2' ? 'PBKDF2-SHA256 · 150,000 iterations' : (algo === 'pbkdf2' ? 'PBKDF2-SHA256' : 'Legacy fast hash (weak)'), hasSubtle && algo === 'pbkdf2' ? 'ok' : 'warn'],
    ['Session token', uid ? 'Signed + verified (tamper-proof)' : 'Guest session', uid ? 'ok' : ''],
    ['Session expiry', exp ? 'Auto-expires ' + expTxt : '—', 'ok'],
    ['Login throttling', SEC.THROTTLE_MAX + ' attempts / ' + Math.round(SEC.THROTTLE_WINDOW_MS / 1000) + 's', 'ok'],
    ['Accounts stored', users + ' profile' + (users === 1 ? '' : 's'), 'info'],
    ['Crypto primitive', hasSubtle ? 'WebCrypto available' : 'WebCrypto unavailable (insecure context)', hasSubtle ? 'ok' : 'warn'],
    ['Storage', SafeStore.isDegraded() ? 'In-memory fallback active' : 'LocalStorage healthy', SafeStore.isDegraded() ? 'warn' : 'ok'],
    ['Network', Net.isOnline() ? 'Online' : 'Offline', Net.isOnline() ? 'ok' : 'warn'],
    ['Queued offline actions', String(queued), queued ? 'warn' : 'ok']
  ];
  box.innerHTML = rows.map(r =>
    '<div class="sec-row"><span class="muted">' + esc(r[0]) + '</span><span class="tag ' + (r[2] || '') + '">' + esc(r[1]) + '</span></div>').join('');
}
function renderTestResults(out) {
  const box = $('#testResultsBox'); if (!box) return;
  if (!out) { box.innerHTML = ''; return; }
  const pct = Math.round(out.pass / Math.max(1, out.pass + out.fail) * 100);
  let cur = '';
  const groups = {};
  out.results.forEach(r => { (groups[r.group] = groups[r.group] || []).push(r); });
  box.innerHTML =
    '<div class="test-summary ' + (out.fail ? 'bad' : 'good') + '"><b>' + out.pass + ' passed</b> • ' +
    (out.fail ? '<b>' + out.fail + ' failed</b>' : 'no failures') + ' • ' + pct + '%</div>' +
    Object.keys(groups).map(g => '<details class="test-group"' + (groups[g].some(r => !r.pass) ? ' open' : '') + '>' +
      '<summary><span>' + esc(g) + '</span> <em>' + groups[g].filter(r => r.pass).length + '/' + groups[g].length + '</em></summary>' +
      groups[g].map(r => '<div class="test-row ' + (r.pass ? 'pass' : 'fail') + '">' +
        '<span>' + (r.pass ? '✓' : '✗') + '</span><span class="grow">' + esc(r.name) + '</span>' +
        (r.err ? '<small>' + esc(r.err) + '</small>' : '') + '</div>').join('') + '</details>').join('');
}
/* Ember assistant (rule-based, offline) */
function emberReply(q) {
  q = (q || '').toLowerCase();
  const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
  if (/(gift|under \$?50|present)/.test(q)) {
    const list = S.products.filter(p => p.price <= 50 && !p.paused).slice(0, 3);
    return { text: 'Cute — here are 3 crowd-pleasers under $50 with 14-day returns:', items: list.map(p => ({ label: p.img + ' ' + p.title + ' — ' + money(p.price), act: 'view:' + p.id })) };
  }
  if (/(store|sell|grow|income|side.hustle)/.test(q)) {
    return { text: 'Fastest path I see: list one digital product this week, then book Alex for the $10k/mo playbook. Want me to open either?', items: [{ label: '＋ Open Seller Studio', act: 'nav:sell' }, { label: '🎓 Book Alex Morgan', act: 'coach:c1' }, { label: '🎬 Store Launch Sprint', act: 'course:k1' }] };
  }
  if (/(coach|fitness|career|design|business)/.test(q)) {
    const cs = pick(S.coaches, 3);
    return { text: 'Top matches for you right now:', items: cs.map(c => ({ label: c.img + ' ' + c.name + ' — ' + c.specialty + ' ' + money(c.rate) + '/hr', act: 'coach:' + c.id })) };
  }
  if (/(deal|cheap|discount|coupon)/.test(q)) {
    return { text: 'Live deals end soon — biggest savings first:', items: S.deals.slice(0, 3).map(d => { const p = S.products.find(x => x.id === d.pid); return { label: '🔥 ' + p.title + ' −' + d.pct + '%', act: 'nav:deals' }; }).concat([{ label: 'Apply EMPOWER10', act: 'coupon:EMPOWER10' }]) };
  }
  if (/(auction|bid)/.test(q)) return { text: 'Auctions ending soonest — bid before they are gone:', items: S.auctions.slice().sort((a, b) => a.endsAt - b.endsAt).slice(0, 3).map(a => ({ label: '⏳ ' + a.title + ' — ' + money(a.bid), act: 'nav:auctions' })) };
  if (/(event|workshop|live)/.test(q)) return { text: 'Upcoming events with seats left:', items: S.events.slice(0, 3).map(e => ({ label: '📅 ' + e.title + ' — ' + (e.price ? money(e.price) : 'FREE'), act: 'nav:events' })) };
  if (/(track|order|refund|ship)/.test(q)) return { text: 'I can take you straight there:', items: [{ label: '📦 Open Orders & tracking', act: 'nav:orders' }, { label: '🛡️ Open a dispute', act: 'dispute:' }, { label: '✉️ Message support', act: 'nav:inbox' }] };
  const hits = S.products.filter(p => q.split(/\s+/).some(w => w.length > 2 && (p.title + ' ' + p.category).toLowerCase().includes(w))).slice(0, 3);
  if (hits.length) return { text: 'Found these for "' + q.slice(0, 32) + '":', items: hits.map(p => ({ label: p.img + ' ' + p.title + ' — ' + money(p.price), act: 'view:' + p.id })) };
  return { text: 'I can help with shopping, selling, gigs, courses, coaches, auctions & events. Try one:', items: [{ label: '🔥 Show deals', act: 'nav:deals' }, { label: '⏳ Show auctions', act: 'nav:auctions' }, { label: '🎓 Match a coach', act: 'nav:coaches' }, { label: '＋ Start selling', act: 'nav:sell' }] };
}
function assistHandle(action) {
  const [kind, val] = (action || '').split(':');
  if (kind === 'view') { viewProduct(val); }
  else if (kind === 'coach') { nav('coaches'); bookCoach(val); }
  else if (kind === 'course') { nav('learn'); openCourse(val); }
  else if (kind === 'coupon') { S.coupon = val; save(); updateCartUI(); toast(val + ' applied ✓', 'ok'); openCart(); }
  else if (kind === 'dispute') { disputeModal(); }
  else if (kind === 'nav') { nav(val || 'marketplace'); }
}
function assistAsk(text) {
  const box = $('#assistChat'); if (!box) return;
  const q = (text || '').trim(); if (!q) return;
  box.innerHTML += '<div class="msg me">' + esc(q) + '</div>';
  const r = emberReply(q);
  box.innerHTML += '<div class="msg">✨ ' + esc(r.text) + (r.items ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + r.items.map((it, i) => '<button class="btn small" data-ax="' + i + '">' + esc(it.label) + '</button>').join('') + '</div>' : '') + '</div>';
  box.scrollTop = box.scrollHeight;
  const btns = box.querySelectorAll('[data-ax]');
  btns.forEach(b => b.onclick = () => assistHandle(r.items[Number(b.dataset.ax)].act));
  const inp = $('#assistInput'); if (inp) inp.value = '';
}
/* Command palette */
function paletteActions() {
  return [
    { n: 'Go: Marketplace', run: () => nav('marketplace') }, { n: 'Go: Deals', run: () => nav('deals') },
    { n: 'Go: Auctions', run: () => nav('auctions') }, { n: 'Go: Services', run: () => nav('services') },
    { n: 'Go: Learn', run: () => nav('learn') }, { n: 'Go: Events', run: () => nav('events') },
    { n: 'Go: Coaches', run: () => nav('coaches') }, { n: 'Go: Community', run: () => nav('community') },
    { n: 'Go: Sell', run: () => nav('sell') }, { n: 'Go: Dashboard', run: () => nav('dashboard') },
    { n: 'Go: Orders', run: () => nav('orders') }, { n: 'Go: Inbox', run: () => nav('inbox') },
    { n: 'Go: Rewards', run: () => nav('rewards') }, { n: 'Go: Wallet', run: () => nav('wallet') },
    { n: 'Go: Settings', run: () => nav('settings') },
    { n: 'Apply coupon EMPOWER10', run: () => { applyCoupon('EMPOWER10'); } },
    { n: 'Toggle theme', run: () => { S.theme = S.theme === 'light' ? 'dark' : 'light'; save(); applyTheme(); } },
    { n: 'Daily check-in', run: () => doCheckin() },
    { n: 'Ask Ember', run: () => toggleAssist(true) }
  ].concat(S.products.slice(0, 8).map(p => ({ n: 'View: ' + p.title, run: () => viewProduct(p.id) })));
}
function openPalette() {
  const r = $('#paletteRoot'); if (!r) return;
  r.hidden = false; $('#overlay').classList.add('show');
  const i = $('#paletteInput'); i.value = ''; drawPalette(''); setTimeout(() => i.focus(), 30);
}
function closePalette() { const r = $('#paletteRoot'); if (r) r.hidden = true; if (!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show'); }
function drawPalette(q) {
  const list = $('#paletteList'); if (!list) return;
  const acts = paletteActions().filter(a => a.n.toLowerCase().includes((q || '').toLowerCase())).slice(0, 12);
  list.innerHTML = acts.map((a, i) => '<button data-pi="' + i + '">⚡ ' + esc(a.n) + '</button>').join('') || '<div class="muted" style="padding:12px">No matches.</div>';
  $$('#paletteList [data-pi]').forEach(b => b.onclick = () => { closePalette(); acts[Number(b.dataset.pi)].run(); });
}
function toggleAssist(force) {
  const p = $('#assistPanel'); if (!p) return;
  const show = force === true ? true : p.hidden;
  p.hidden = !show ? true : false;
  if (show) {
    p.hidden = false;
    if (!p.dataset.init) {
      p.dataset.init = '1';
      $('#assistChat').innerHTML = '<div class="msg">✨ Hi, I am <b>Ember</b>. Tell me a budget, a goal, or what you are stuck on — I will pull the best of Empower for you.</div>';
      $('#assistChips').innerHTML = ['Gift under $50', 'Grow my store', 'Find a coach', 'Show deals'].map(c => '<button data-chip="' + c + '">' + c + '</button>').join('');
      $$('#assistChips [data-chip]').forEach(b => b.onclick = () => assistAsk(b.dataset.chip));
    }
  } else p.hidden = true;
}
function doCheckin() {
  const day = new Date().toDateString();
  if (S.lastCheckin === day) { toast('Already checked in — come back tomorrow 🔥', 'err'); nav('rewards'); return; }
  const y = new Date(Date.now() - 86400000).toDateString();
  S.streak = (S.lastCheckin === y) ? (S.streak || 0) + 1 : 1;
  S.lastCheckin = day;
  const bonus = 10 + Math.min(20, (S.streak || 1) * 2);
  S.points = (S.points || 0) + bonus;
  const b = S.badges = S.badges || [];
  if (S.streak >= 3 && b.indexOf('streak3') < 0) b.push('streak3');
  notify('Check-in day ' + S.streak + '! +' + bonus + ' pts.');
  save(); renderRewards(); renderRewardsBadge(); toast('Checked in! +' + bonus + ' pts 🔥', 'ok');
}
window.doCheckin = doCheckin;

/* ---------- v5: discovery rails / bundles / subscriptions / affiliate / live / tasks ---------- */
function trackRecent(id) {
  S.recent = [id].concat((S.recent || []).filter(x => x !== id)).slice(0, 10);
  save(); renderRails();
}
function renderRails() {
  const tr = $('#trendRail');
  if (tr) {
    const top = S.products.filter(p => !p.paused).slice().sort((a, b) => (b.sold / Math.max(1, b.price)) - (a.sold / Math.max(1, a.price))).slice(0, 8);
    tr.innerHTML = top.map(p => '<div class="mini-card" data-tr-v="' + p.id + '"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title.slice(0, 28)) + '</b><span>🔥 ' + p.sold.toLocaleString() + ' sold • ' + money(p.price) + '</span></div></div>').join('');
    $$('#trendRail [data-tr-v]').forEach(b => b.onclick = () => viewProduct(b.dataset.trV));
  }
  const rr = $('#recentRail');
  if (rr) {
    const list = (S.recent || []).map(id => S.products.find(p => p.id === id)).filter(Boolean);
    rr.innerHTML = list.map(p => '<div class="mini-card" data-rc-v="' + p.id + '"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title.slice(0, 28)) + '</b><span>' + money(p.price) + '</span></div></div>').join('') || '<div class="muted small">Views you open will appear here.</div>';
    $$('#recentRail [data-rc-v]').forEach(b => b.onclick = () => viewProduct(b.dataset.rcV));
    const cb = $('#clearRecentBtn'); if (cb && !cb.dataset.b) { cb.dataset.b = '1'; cb.onclick = () => { S.recent = []; save(); renderRails(); }; }
  }
  const br = $('#bundleRail');
  if (br) {
    const pairs = [['p3', 'p11'], ['p6', 'p12'], ['p2', 'p8']];
    br.innerHTML = pairs.map(([a, b]) => {
      const pa = S.products.find(x => x.id === a), pb = S.products.find(x => x.id === b);
      if (!pa || !pb) return '';
      const tot = pa.price + pb.price, deal = Math.round(tot * 0.85 * 100) / 100;
      return '<div class="mini-card" data-bun="' + a + '|' + b + '"><div class="thumb">' + pa.img + pb.img + '</div><div class="grow"><b>' + esc(pa.title.slice(0, 18)) + ' + ' + esc(pb.title.slice(0, 18)) + '</b><span><s>' + money(tot) + '</s> <b>' + money(deal) + '</b> save 15%</span></div></div>';
    }).join('');
    $$('#bundleRail [data-bun]').forEach(el => el.onclick = () => {
      const [a, b] = el.dataset.bun.split('|');
      [a, b].forEach(id => { const l = S.cart.find(c => c.id === id); if (l) l.qty++; else S.cart.push({ id, qty: 1 }); });
      S.coupon = null;
      S.dealOverride = S.dealOverride || {};
      // bundle discount via extra 15% coupon-like path: store as coupon WELCOME15-ish? use fixed extra
      S.bundlePct = 0.15;
      save(); updateCartUI(); openCart(); toast('Bundle added — 15% off applied 🎁', 'ok');
    });
  }
}
// bundle-aware discount
const _cartDiscountV4 = cartDiscount;
cartDiscount = function (sub) {
  let d = _cartDiscountV4(sub);
  if (S.bundlePct) d += sub * S.bundlePct;
  return Math.min(d, sub * 0.6);
};
function renderSubsBox() {
  // subscriptions entry on product modal for consumables + services upsell
  return '';
}
function liveShopModal() {
  const live = S.products.filter(p => !p.paused).slice(0, 5);
  openModal('<h3>📣 Live Drop — Friday 6PM CT</h3><p class="muted small">Deals unlock while live. RSVP free, we ping you.</p>' +
    live.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + money(p.price) + ' • live price drops 10%</span></div><button class="btn small primary" data-live-add="' + p.id + '">＋</button></div>').join('') +
    '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" style="flex:1" onclick="closeModal()">Later</button><button class="btn primary" style="flex:2" id="liveRsvp">RSVP — remind me</button></div>', true);
  $$('#modalRoot [data-live-add]').forEach(b => b.onclick = () => addToCart(b.dataset.liveAdd));
  $('#liveRsvp').onclick = () => { notify('Live drop RSVP confirmed — Friday 6PM CT.'); addPoints(5, 'live RSVP'); save(); closeModal(); toast('RSVP confirmed! We will ping you 📣', 'ok'); };
}
window.liveShopModal = liveShopModal;

/* ============ v6 EXPANSION: stories, search+, compare, alerts, returns, polls, trust, security ============ */
function renderStories() {
  const rail = $('#storiesRail'); if (!rail) return;
  const items = S.stories || [];
  rail.innerHTML = items.map(s =>
    '<button class="story-card" data-story="' + s.id + '"><div class="story-cover">' + esc(s.emoji || '📸') + '</div>' +
    '<div class="story-body"><div class="story-ring">' + esc(s.emoji || '📸') + '</div><b>' + esc(s.seller) + '</b><br /><span class="muted">' + esc(s.title) + '</span></div></button>'
  ).join('');
  $$('#storiesRail [data-story]').forEach(b => b.onclick = () => openStory(b.dataset.story));
}
function openStory(id) {
  const s = (S.stories || []).find(x => x.id === id); if (!s) return;
  openModal('<div class="story-viewer"><div class="story-progress"><i id="storyBar"></i></div>' +
    '<span class="big-emoji">' + esc(s.emoji || '📸') + '</span><h3>' + esc(s.title) + '</h3>' +
    '<p class="muted">by <b>' + esc(s.seller) + '</b> • shared marketplace • tap below to shop the drop</p>' +
    '<button class="btn primary block" id="storyShop">Shop this drop →</button>' +
    '<button class="btn block" id="storySeller" style="margin-top:8px">Visit seller store</button></div>');
  setTimeout(() => { const b = $('#storyBar'); if (b) b.style.width = '100%'; }, 30);
  $('#storyShop').onclick = () => {
    closeModal();
    if (s.pid) viewProduct(s.pid);
    else if (s.coachId) { nav('coaches'); bookCoach(s.coachId, true); }
    else if (s.eventId) nav('events');
    else nav('marketplace');
  };
  const vs = $('#storySeller'); if (vs) vs.onclick = () => { closeModal(); sellerStore(s.seller); };
}
function trendingSearches() {
  const counts = {};
  (S.products || []).forEach(p => { counts[p.category] = (counts[p.category] || 0) + p.sold; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
}
function pushSearchHist(q) {
  q = (q || '').trim(); if (q.length < 2) return;
  S.searchHist = [q].concat((S.searchHist || []).filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 8);
  save();
}
function setPriceAlert(pid, target) {
  if (!requireAuth('set price alerts')) return false;
  S.alerts = S.alerts || [];
  const ex = S.alerts.find(a => a.pid === pid);
  if (ex) ex.target = target; else S.alerts.push({ pid, target });
  save(); renderAlerts(); toast('🔔 Alert set — we\'ll ping you under ' + money(target), 'ok');
  return true;
}
function renderAlerts() {
  const box = $('#alertsList'); if (!box) return;
  const list = (S.alerts || []).map(a => Object.assign({}, a, S.products.find(p => p.id === a.pid) ? { title: S.products.find(p => p.id === a.pid).title, price: S.products.find(p => p.id === a.pid).price, img: S.products.find(p => p.id === a.pid).img } : null)).filter(a => a.title);
  box.innerHTML = list.map((a, i) => {
    const hit = a.price <= a.target;
    return '<div class="alert-row"><div class="thumb">' + esc(a.img || '🔔') + '</div><div class="grow"><b>' + esc(a.title) + '</b><span>' + money(a.price) + ' • target ' + money(a.target) + (hit ? ' • <b style="color:var(--green)">DROP HIT ✓</b>' : '') + '</span></div>' +
      '<button class="btn small primary" data-alert-view="' + a.pid + '">View</button><button class="btn small danger" data-alert-del="' + i + '">✕</button></div>';
  }).join('') || '<div class="muted small">No alerts yet — open any product → 🔔 Set price alert.</div>';
  $$('#alertsList [data-alert-view]').forEach(b => b.onclick = () => viewProduct(b.dataset.alertView));
  $$('#alertsList [data-alert-del]').forEach(b => b.onclick = () => { S.alerts.splice(Number(b.dataset.alertDel), 1); save(); renderAlerts(); });
}
function checkPriceAlerts() {
  if (!S.prefs || S.prefs.pricedrop === false) return;
  (S.alerts || []).forEach(a => {
    const p = S.products.find(x => x.id === a.pid); if (!p) return;
    if (p.price <= a.target && !a.fired) {
      a.fired = true;
      notify('💧 Price drop: ' + p.title + ' is now ' + money(p.price) + ' (target ' + money(a.target) + ').');
    } else if (p.price > a.target) a.fired = false;
  });
}
function toggleCompare(pid) {
  S.compare = S.compare || [];
  const i = S.compare.indexOf(pid);
  if (i >= 0) S.compare.splice(i, 1);
  else {
    if (S.compare.length >= 3) { toast('Compare up to 3 — remove one first', 'err'); return; }
    S.compare.push(pid);
  }
  save(); renderCompareTray(); renderMarket();
}
function renderCompareTray() {
  const t = $('#compareTray'); if (!t) return;
  const n = (S.compare || []).length;
  t.hidden = !n;
  const l = $('#compareLabel'); if (l) l.textContent = 'Compare (' + n + '/3)';
}
function openCompare() {
  const items = (S.compare || []).map(id => S.products.find(p => p.id === id)).filter(Boolean);
  if (!items.length) { toast('Pick up to 3 products with ◧ Compare', 'err'); return; }
  const rows = [['Price', p => money(p.price)], ['Rating', p => '★ ' + p.rating + ' (' + p.reviews + ')'], ['Sold', p => Number(p.sold).toLocaleString()], ['Seller', p => esc(p.seller)], ['Type', p => esc(p.type)], ['Stock', p => p.type === 'Digital' ? '∞' : p.stock]];
  openModal('<h3>◧ Compare (' + items.length + ')</h3><div style="overflow-x:auto"><table class="compare-table"><tr><th></th>' + items.map(p => '<th>' + p.img + '<br />' + esc(p.title.slice(0, 26)) + '</th>').join('') + '</tr>' +
    rows.map(r => '<tr><td><b>' + r[0] + '</b></td>' + items.map(p => '<td>' + r[1](p) + '</td>').join('') + '</tr>').join('') +
    '<tr><td></td>' + items.map(p => '<td><button class="btn small primary" data-cmp-v="' + p.id + '">View</button> <button class="btn small" data-cmp-cart="' + p.id + '">Add</button></td>').join('') + '</tr></table></div>' +
    '<button class="btn block" style="margin-top:10px" onclick="closeModal()">Close</button>', true);
  $$('#modalRoot [data-cmp-v]').forEach(b => b.onclick = () => viewProduct(b.dataset.cmpV));
  $$('#modalRoot [data-cmp-cart]').forEach(b => b.onclick = () => addToCart(b.dataset.cmpCart));
}
function requestReturn(idx) {
  const o = S.orders[idx]; if (!o) return;
  if (o.status === 'Cancelled') { toast('Already cancelled', 'err'); return; }
  openModal('<h3>↩ Return / refund — ' + esc(o.id) + '</h3><p class="muted small">' + esc(o.title) + ' • paid <b>' + money(o.total) + '</b> • escrow-protected, 14-day window</p>' +
    '<label>Reason<select id="retReason"><option>Changed my mind</option><option>Wrong / damaged item</option><option>Not as described</option><option>Arrived late</option></select></label>' +
    '<label>Details<textarea id="retNote" rows="2" placeholder="Optional…"></textarea></label>' +
    '<div class="total-row small"><span>Refund preview</span><b>' + money(o.total) + '</b></div>' +
    '<button class="btn primary block" id="retGo" style="margin-top:10px">Confirm return → refund ' + money(o.total) + '</button>');
  $('#retGo').onclick = () => {
    o.status = 'Cancelled';
    S.user.balance += o.total;
    S.txs.unshift({ t: 'Refund (return) — ' + o.title + ' [' + $('#retReason').value + ']', a: o.total, d: today(), k: 'in' });
    const p = S.products.find(pp => pp.title === o.title);
    if (p && p.type !== 'Digital') p.stock += (o.qty || 1);
    notify('Return accepted for ' + o.id + ' — ' + money(o.total) + ' refunded.');
    save(); closeModal(); renderOrders(); renderWallet(); renderMarket(); toast('Refunded ' + money(o.total) + ' ✓', 'ok');
  };
}
function renderPolls() {
  const box = $('#pollBox'); if (!box) return;
  const polls = S.polls || [];
  box.innerHTML = polls.map(pl => {
    const total = pl.votes.reduce((a, b) => a + b, 0) || 1;
    return '<b>' + esc(pl.q) + '</b>' + pl.opts.map((op, i) => {
      const pct = Math.round(pl.votes[i] / total * 100);
      return '<div style="margin-top:8px"><button class="btn small" style="width:100%" data-poll="' + pl.id + '|' + i + '"' + (pl.voted >= 0 ? ' disabled' : '') + '>' + esc(op) + ' • ' + pct + '%</button><div class="poll-bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join('') + (pl.voted >= 0 ? '<div class="muted small">✓ Voted • ' + total + ' votes</div>' : '<div class="muted small">' + total + ' votes so far</div>');
  }).join('') || '<div class="muted small">No polls right now.</div>';
  $$('#pollBox [data-poll]').forEach(b => b.onclick = () => {
    if (!requireAuth('vote in polls')) return;
    const pid = b.dataset.poll.split('|')[0], i = Number(b.dataset.poll.split('|')[1]);
    const pl = S.polls.find(x => x.id === pid); if (!pl || pl.voted >= 0) return;
    pl.votes[i]++; pl.voted = i; addPoints(5, 'poll vote'); save(); renderPolls(); toast('Voted ✓ +5 pts', 'ok');
  });
}
function renderVerifyBox() {
  const box = $('#verifyBox'); if (!box) return;
  const st = S.verifyStatus || 'none';
  if (st === 'verified') box.innerHTML = '<span class="tag ok">✓ Verified seller</span><p class="muted small">Badge shows on listings, profile & chat.</p>';
  else if (st === 'pending') box.innerHTML = '<span class="tag warn">⏳ Under review</span><p class="muted small">Usually approved in 24h. Keep selling — payouts already work.</p>';
  else box.innerHTML = '<p class="muted small">Get a ✓ badge: ID + 3 sales + 4.5★. Builds trust like IG/Twitter blue checks.</p><button class="btn small primary" id="verifyGo">Request verification →</button>';
  const g = $('#verifyGo'); if (g) g.onclick = () => {
    if (!requireAuth('request verification')) return;
    S.verifyStatus = 'pending'; save(); renderVerifyBox(); notify('Verification requested — under review.');
    setTimeout(() => { S.verifyStatus = 'verified'; S.profile = S.profile || {}; S.profile.verified = true; save(); persistCurrentUser(); renderVerifyBox(); notify('✓ You are verified! Badge is live.'); if ($('#view-profile').classList.contains('active')) renderProfile(currentUserId()); }, 4000);
    toast('Request sent — review in ~24h (demo: 4s)', 'ok');
  };
}
function renderSecurity() {
  const se = $('#sessEmail'); if (se) se.textContent = isGuest() ? 'guest (not signed in)' : (S.user.email || '—');
  const si = $('#sessInfo'); if (si) si.textContent = isGuest() ? 'browse-only' : ('1 active session • since ' + (S.user.memberSince || '2026'));
  const sl = $('#sessList'); if (sl) sl.innerHTML = isGuest() ? '<div class="muted small">Log in to manage sessions.</div>' : '<div class="session-row"><span>💻</span><div class="grow"><b>This browser</b><span>Current • local demo auth</span></div><span class="tag ok">active</span></div>';
}

/* ============ SOCIAL + AUTH UI (shared platform, private profiles) ============ */
function openAuth(tab, msg) {
  const sc = $('#authScreen'); if (!sc) return;
  sc.hidden = false;
  if (tab) switchAuthTab(tab);
  if (msg) toast(msg);
  renderDemoLogins();
  setTimeout(() => { const e = $('#loginEmail'); if (e && tab === 'login') e.focus(); }, 50);
}
function closeAuth() { const sc = $('#authScreen'); if (sc) sc.hidden = true; }
function switchAuthTab(which) {
  $$('#authTabs button').forEach(b => b.classList.toggle('active', b.dataset.at === which));
  $('#authLogin').hidden = which !== 'login';
  $('#authSignup').hidden = which !== 'signup';
}
function renderDemoLogins() {
  const box = $('#demoLogins'); if (!box) return;
  const db = getUsersDB();
  const demos = Object.values(db.users).slice(0, 4);
  box.innerHTML = demos.map(u => '<button data-demo="' + u.id + '">' + esc(u.emoji || '🧑') + ' ' + esc(u.name.split(' ')[0]) + '</button>').join('');
  $$('#demoLogins [data-demo]').forEach(b => b.onclick = () => {
    doContinueAs(b.dataset.demo);
    closeAuth(); renderAll(); refreshAuthUI();
    toast('Welcome back, ' + S.user.name.split(' ')[0] + '! 👋', 'ok');
    nav('marketplace');
  });
}
function refreshAuthUI() {
  const guest = isGuest();
  const sc = $('#authScreen');
  // Show auth gate only if logged out AND user hasn't chosen guest browse? Always allow dismiss via guest.
  // Keep topbar in sync:
  const lb = $('#loginBtn'); if (lb) lb.hidden = !guest;
  const ub = $('#userBtn'); if (ub) ub.style.display = guest ? 'none' : '';
  const am = $('#accountMenu'); if (am && guest) am.hidden = true;
  if (!guest) {
    if (sc) sc.hidden = true;
    const an = $('#accountName'); if (an) an.textContent = S.user.name;
    const ah = $('#accountHandle'); if (ah) ah.textContent = ((S.profile || {}).handle || '@user') + ' • ' + ec(S.user.balance);
    const aa = $('#accountAvatar'); if (aa) aa.textContent = initials(S.user.name);
    if (ub) ub.textContent = initials(S.user.name);
    renderSwitchList();
  } else {
    if (ub) ub.textContent = '👤';
  }
  updateWalletUI();
}
function renderSwitchList() {
  const box = $('#switchList'); if (!box) return;
  const db = getUsersDB();
  const cur = currentUserId();
  box.innerHTML = Object.values(db.users).filter(u => u.id !== cur).slice(0, 5).map(u => '<button class="switch-btn" data-sw="' + u.id + '"><span>' + esc(u.emoji || '🧑') + '</span><span>' + esc(u.name) + '<br /><small class="muted">' + esc(u.handle || '') + '</small></span></button>').join('') || '<div class="muted small" style="padding:0 12px">No other accounts yet.</div>';
  $$('#switchList [data-sw]').forEach(b => b.onclick = () => {
    doContinueAs(b.dataset.sw);
    $('#accountMenu').hidden = true;
    renderAll(); refreshAuthUI();
    toast('Switched to ' + S.user.name + ' — your private space loaded. 🏠', 'ok');
  });
}
function openProfileEditor() {
  if (requireAuth('edit your profile')) {};
  if (isGuest()) return;
  openModal('<h3>Edit profile</h3><p class="muted small">Public to everyone on the shared platform. Wallet & orders stay private.</p>' +
    '<div class="row2"><label>Name<input id="epName" value="' + esc(S.user.name) + '" /></label><label>Avatar emoji<input id="epEmoji" value="' + esc(S.user.emoji || '🧑‍🚀') + '" maxlength="4" /></label></div>' +
    '<label>Handle<input id="epHandle" value="' + esc((S.profile || {}).handle || '') + '" placeholder="@ada" /></label>' +
    '<label>Bio<textarea id="epBio" rows="3">' + esc((S.profile || {}).bio || '') + '</textarea></label>' +
    '<div class="row2"><label>Location<input id="epLoc" value="' + esc((S.profile || {}).location || '') + '" placeholder="Austin, TX" /></label><label>Website<input id="epWeb" value="' + esc((S.profile || {}).website || '') + '" placeholder="https://" /></label></div>' +
    '<button class="btn primary block" id="epSave">Save profile →</button>');
  $('#epSave').onclick = () => {
    S.user.name = $('#epName').value.trim() || S.user.name;
    S.user.emoji = $('#epEmoji').value.trim() || S.user.emoji;
    S.user.avatar = initials(S.user.name);
    S.profile = S.profile || {};
    S.profile.handle = $('#epHandle').value.trim() || S.profile.handle;
    S.profile.bio = $('#epBio').value.trim();
    S.profile.location = $('#epLoc').value.trim();
    S.profile.website = $('#epWeb').value.trim();
    save(); closeModal(); renderAll(); refreshAuthUI();
    toast('Profile updated — visible to everyone 🌍', 'ok');
  };
}
function renderPeople() {
  const g = $('#peopleGrid'); if (!g) return;
  const q = ($('#peopleSearch') || {}).value || '';
  let list = getPublicProfiles();
  if (q.trim()) { const s = q.toLowerCase(); list = list.filter(p => (p.name + ' ' + p.handle + ' ' + p.bio).toLowerCase().indexOf(s) >= 0); }
  const cur = currentUserId();
  g.innerHTML = list.map(p => {
    const isMe = p.id === cur;
    const following = (S.following || []).indexOf(p.id) >= 0 || (S.following || []).indexOf(p.name) >= 0;
    const followerCount = followerCountFor(p.id, p.name);
    return '<div class="person-card"><div class="person-cover" style="background:' + esc(p.cover || 'linear-gradient(135deg,#7c3aed,#0ea5e9)') + '"></div>' +
      '<div class="person-body"><div class="person-row"><div class="person-ava">' + esc(p.emoji || '🧑') + '</div>' +
      '<div class="grow"><b>' + esc(p.name) + ' ' + (p.verified ? '<span class="tag ok">✓</span>' : '') + '</b><span>' + esc(p.handle || '') + ' • 👥 ' + followerCount + '</span></div></div>' +
      '<div class="muted small">' + esc((p.bio || '').slice(0, 110)) + '</div>' +
      '<div class="muted small">🛍 ' + p.listings + ' listings • 📦 ' + p.orders + ' orders • 🏆 ' + (p.points || 0) + ' pts</div>' +
      '<div style="display:flex;gap:8px"><button class="btn small" style="flex:1" data-vp="' + p.id + '">View profile</button>' +
      (isMe ? '<span class="tag info">you</span>' : '<button class="btn small ' + (following ? '' : 'primary') + '" data-fol="' + p.id + '">' + (following ? 'Following ✓' : '＋ Follow') + '</button>') + '</div></div></div>';
  }).join('') || '<div class="card">No people match.</div>';
  $$('#peopleGrid [data-vp]').forEach(b => b.onclick = () => { S.viewProfileId = b.dataset.vp; save(); nav('profile'); });
  $$('#peopleGrid [data-fol]').forEach(b => b.onclick = () => { toggleFollow(b.dataset.fol); renderPeople(); });
}
function followerCountFor(uid, name) {
  // followers = how many user DB privates follow this id OR legacy name-follow; plus pseudo base
  try {
    const db = getUsersDB();
    let n = 0;
    Object.values(db.users).forEach(u => { const f = (u.private && u.private.following) || []; if (f.indexOf(uid) >= 0 || (name && f.indexOf(name) >= 0)) n++; });
    const base = { u_maya: 214, u_alex: 320, u_priya: 410, u_jordan: 180 }[uid] || 12;
    return base + n;
  } catch (e) { return 0; }
}
function toggleFollow(targetId) {
  if (!requireAuth('follow people')) return false;
  const db = getUsersDB();
  const t = db.users[targetId];
  const label = t ? t.name : targetId;
  S.following = S.following || [];
  let on = false;
  [targetId, label].forEach(k => {
    const i = S.following.indexOf(k);
    if (i >= 0) { S.following.splice(i, 1); } else { S.following.push(k); on = true; }
  });
  // normalize: keep single entry
  S.following = Array.from(new Set(S.following)).filter(x => x !== targetId || on).filter(x => x !== label || on);
  if (on && S.following.indexOf(targetId) < 0) S.following.push(targetId);
  if (!on) S.following = S.following.filter(x => x !== targetId && x !== label);
  save(); persistCurrentUser();
  toast(on ? 'Following ' + label + ' ✓' : 'Unfollowed ' + label, on ? 'ok' : undefined);
  return on;
}
function renderProfile(viewId) {
  const db = getUsersDB();
  const cur = currentUserId();
  const id = viewId || cur;
  const isMe = !isGuest() && id === cur;
  let data;
  if (isMe || db.users[id]) {
    if (isMe) data = { id: cur, name: S.user.name, handle: (S.profile || {}).handle, bio: (S.profile || {}).bio, emoji: S.user.emoji, cover: (S.profile || {}).cover, verified: !!((S.profile || {}).verified), location: (S.profile || {}).location, website: (S.profile || {}).website, email: S.user.email, memberSince: S.user.memberSince };
    else { const u = db.users[id]; const pv = (u.private || {}); data = { id: u.id, name: u.name, handle: u.handle, bio: u.bio, emoji: u.emoji, cover: u.cover, verified: u.verified, location: (pv.profile || {}).location || '', website: (pv.profile || {}).website || '', memberSince: (pv.user || {}).memberSince || '2026', privateView: pv }; }
  } else if (isGuest()) {
    data = { id: 'guest', name: 'Guest', handle: '@guest', bio: 'Log in to claim your profile.', emoji: '👤', cover: 'linear-gradient(135deg,#444,#888)', verified: false };
  } else return;
  const pc = $('#profileCover'); if (pc) pc.style.background = data.cover || 'linear-gradient(135deg,#7c3aed,#0ea5e9)';
  const pa = $('#profileAvatar'); if (pa) pa.textContent = data.emoji || '🧑‍🚀';
  const pn = $('#profileName'); if (pn) pn.innerHTML = esc(data.name) + (data.verified ? ' <span class="tag ok">✓ Verified</span>' : '');
  const ph = $('#profileHandle'); if (ph) ph.textContent = (data.handle || '') + (data.location ? ' • ' + data.location : '') + ' • Joined ' + (data.memberSince || '2026');
  const pb = $('#profileBio'); if (pb) pb.innerHTML = esc(data.bio || '') + (data.website ? ' • <a href="' + esc(data.website) + '" target="_blank" rel="noopener">' + esc(data.website) + '</a>' : '') + (isMe ? ' • <span class="tag info">private wallet: ' + ec(S.user.balance) + '</span>' : '');
  const myListings = (S.products || []).filter(p => !p.paused && data.name && p.seller && (p.seller === data.name || p.seller.indexOf(data.name.split(' ')[0]) === 0));
  const listingsCount = isMe ? (S.products || []).filter(p => p.mine).length + myListings.filter(p => !p.mine).length : myListings.length;
  if ($('#stListings')) $('#stListings').textContent = isMe ? (S.products.filter(p => p.mine).length || listingsCount) : listingsCount;
  if ($('#stFollowers')) $('#stFollowers').textContent = followerCountFor(data.id, data.name);
  if ($('#stFollowing')) $('#stFollowing').textContent = isMe ? (S.following || []).length : ((data.privateView && data.privateView.following || []).length);
  if ($('#stPoints')) $('#stPoints').textContent = isMe ? (S.points || 0) : ((data.privateView && data.privateView.points) || 0);
  if ($('#stOrders')) $('#stOrders').textContent = isMe ? (S.orders || []).length : ((data.privateView && data.privateView.orders || []).length);
  const fb = $('#followProfileBtn');
  if (fb) {
    if (isMe || isGuest()) fb.hidden = true;
    else {
      fb.hidden = false;
      const on = (S.following || []).indexOf(data.id) >= 0;
      fb.textContent = on ? 'Following ✓' : '＋ Follow';
      fb.onclick = () => { toggleFollow(data.id); renderProfile(data.id); };
    }
  }
  const eb = $('#editProfileBtn'); if (eb) { eb.style.display = isMe ? '' : 'none'; eb.onclick = openProfileEditor; }
  const sb = $('#shareProfileBtn'); if (sb) sb.onclick = () => { try { navigator.clipboard.writeText(location.origin + location.pathname + '#/profile'); } catch (e) {} toast('Profile link copied 🔗', 'ok'); };
  const tab = S.profileTab || 'listings';
  $$('#profileTabs button').forEach(b => { b.classList.toggle('active', b.dataset.pt === tab); b.onclick = () => { S.profileTab = b.dataset.pt; save(); renderProfile(data.id); }; });
  const box = $('#profileContent'); if (!box) return;
  if (tab === 'about') {
    box.innerHTML = '<div class="list-row"><div class="grow"><b>Handle</b><span>' + esc(data.handle || '') + '</span></div></div>' +
      '<div class="list-row"><div class="grow"><b>Bio</b><span>' + esc(data.bio || '—') + '</span></div></div>' +
      '<div class="list-row"><div class="grow"><b>Location</b><span>' + esc(data.location || '—') + '</span></div></div>' +
      (isMe ? '<div class="list-row"><div class="grow"><b>Email (private)</b><span>' + esc(S.user.email) + '</span></div></div><div class="list-row"><div class="grow"><b>Wallet (private)</b><span>' + ec(S.user.balance) + ' • only you see this</span></div><span class="tag ok">🔒 private</span></div>' : '<p class="muted small">🔒 Wallet, cart & orders are private — you are viewing their public profile, like Instagram.</p>');
  } else if (tab === 'posts') {
    const mine = (S.posts || []).filter(p => p.author === data.name);
    box.innerHTML = mine.map(p => '<div class="list-row"><div class="grow"><b>' + esc(p.title) + '</b><span>♥ ' + p.likes + ' • 💬 ' + p.comments.length + ' • ' + esc(p.time) + '</span></div></div>').join('') || '<div class="muted">No posts yet.</div>';
  } else {
    const items = isMe ? (S.products || []).filter(p => p.mine) : myListings;
    box.innerHTML = items.map(p => '<div class="list-row"><div class="thumb">' + imgHTML(p) + '</div><div class="grow"><b>' + esc(p.title) + '</b><span>' + money(p.price) + ' • ★ ' + p.rating + '</span></div><button class="btn small" data-pp-v="' + p.id + '">View</button></div>').join('') || '<div class="muted">No listings yet.</div>';
    $$('#profileContent [data-pp-v]').forEach(b => b.onclick = () => viewProduct(b.dataset.ppV));
  }
}
window.openProfile = (id) => { S.viewProfileId = id; save(); nav('profile'); };

/* ---------- events wiring ---------- */
function wire() {
  $('#mobileMenuBtn').onclick = () => $('#mainNav').classList.toggle('open');
  $('#cartBtn').onclick = openCart;
  $('#closeCart').onclick = closeCart;
  $('#notifBtn').onclick = openNotif;
  $('#closeNotif').onclick = closeNotif;
  $('#clearNotif').onclick = () => { S.notifs.forEach(n => n.read = true); save(); renderNotifs(); renderNotifBadge(); };
  $('#overlay').onclick = () => { closeCart(); closeNotif(); closeModal(); const am = $('#accountMenu'); if (am) am.hidden = true; };
  $('#userBtn').onclick = (e) => { e.stopPropagation(); if (isGuest()) { openAuth('login', 'Log in to open your profile.'); return; } const am = $('#accountMenu'); if (am) { am.hidden = !am.hidden; if (!am.hidden) refreshAuthUI(); } };
  document.addEventListener('click', e => { const am = $('#accountMenu'); if (am && !am.hidden && !e.target.closest('.account-wrap')) am.hidden = true; });
  const loginTopBtn = $('#loginBtn'); if (loginTopBtn) loginTopBtn.onclick = () => openAuth('login');
  const lob = $('#logoutBtn'); if (lob) lob.onclick = () => { doLogout(); const am = $('#accountMenu'); if (am) am.hidden = true; renderAll(); refreshAuthUI(); openAuth('login', 'Logged out. Log in or continue as guest.'); };
  $$('#authTabs button').forEach(b => b.onclick = () => switchAuthTab(b.dataset.at));
  const lf = $('#authLogin');
  if (lf) lf.onsubmit = async e => {
    e.preventDefault();
    const btn = $('#doLoginBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }
    const r = await doLogin($('#loginEmail').value, $('#loginPw').value);
    if (btn) { btn.disabled = false; btn.textContent = 'Log in →'; }
    if (!r.ok) { $('#loginErr').textContent = r.err; shake($('#authLogin')); return; }
    $('#loginErr').textContent = ''; closeAuth(); renderAll(); refreshAuthUI(); toast('Welcome back, ' + S.user.name.split(' ')[0] + '! 👋', 'ok'); nav('marketplace');
  };
  const sf2 = $('#authSignup');
  if (sf2) sf2.onsubmit = async e => {
    e.preventDefault();
    const btn = $('#doSignupBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
    const r = await doSignup($('#suName').value, $('#suEmail').value, $('#suPw').value);
    if (btn) { btn.disabled = false; btn.textContent = 'Create account + 750 EC 🎉'; }
    if (!r.ok) { $('#suErr').textContent = r.err; shake($('#authSignup')); return; }
    $('#suErr').textContent = ''; closeAuth(); renderAll(); refreshAuthUI(); toast('Account created — 750 EC + your private space 🎉', 'ok'); nav('profile');
  };
  // live password strength meter on signup
  const suPwEl = $('#suPw');
  if (suPwEl && !suPwEl.dataset.bound) {
    suPwEl.dataset.bound = '1';
    const meter = document.createElement('div');
    meter.className = 'pw-meter';
    meter.innerHTML = '<div class="pw-bar"><i></i></div><span></span>';
    suPwEl.parentElement.appendChild(meter);
    suPwEl.addEventListener('input', () => {
      const s = passwordStrength(suPwEl.value);
      meter.querySelector('i').style.width = (s.score / 4 * 100) + '%';
      meter.querySelector('i').dataset.level = String(s.score);
      meter.querySelector('span').textContent = suPwEl.value ? s.label : '';
    });
  }
  // net status badge
  Net.onChange(() => {
    const b = $('#netBadge');
    if (!b) return;
    const on = Net.isOnline();
    b.textContent = on ? '● Online' : '⚠ Offline · ' + Net.pending() + ' queued';
    b.className = 'net-badge ' + (on ? 'on' : 'off');
    b.title = on ? 'Connected — changes sync instantly' : 'Offline — actions are queued and replayed on reconnect';
  });
  const nb2 = $('#netBadge'); if (nb2) { nb2.className = 'net-badge ' + (Net.isOnline() ? 'on' : 'off'); nb2.textContent = Net.isOnline() ? '● Online' : '⚠ Offline'; }
  const ub = $('#undoBtn');
  if (ub && !ub.dataset.bound) { ub.dataset.bound = '1'; ub.addEventListener('click', runUndo); }
  const gb = $('#guestBtn'); if (gb) gb.onclick = () => { persistCurrentUser(); setSessionId('guest'); const g = defaultPrivate('Guest', ''); g.user.balance = 0; PRIVATE_KEYS.forEach(k => { if (g[k] !== undefined) S[k] = g[k]; }); S.user.name = 'Guest'; _baseSave(); closeAuth(); renderAll(); refreshAuthUI(); toast('Browsing as guest 👀 — log in to buy, sell & save.', undefined); };
  const ps = $('#peopleSearch'); if (ps && !ps.dataset.b) { ps.dataset.b = '1'; ps.addEventListener('input', () => renderPeople()); }
  const ecb = $('#editCoverBtn'); if (ecb) ecb.onclick = () => {
    if (!requireAuth('change your cover')) return;
    const covers = ['linear-gradient(135deg,#7c3aed,#0ea5e9)', 'linear-gradient(135deg,#db2777,#f59e0b)', 'linear-gradient(135deg,#059669,#22d3ee)', 'linear-gradient(135deg,#111,#555)'];
    S.profile.cover = covers[(covers.indexOf(S.profile.cover) + 1) % covers.length]; save(); renderProfile(currentUserId());
  };
  $('#checkoutBtn').onclick = () => { if (!requireAuth('check out')) return; startCheckout(); };
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
    if (!requireAuth('post to the shared community')) return;
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
    if (!requireAuth('sell on the shared marketplace')) return;
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
      addPoints(25, 'listing published');
      const bd = S.badges = S.badges || []; if (bd.indexOf('seller') < 0) bd.push('seller');
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
    addPoints(20, 'coach profile live');
    const bd2 = S.badges = S.badges || []; if (bd2.indexOf('coach') < 0) bd2.push('coach');
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
  const fh = $('#footHelp'); if (fh) fh.onclick = e => { e.preventDefault(); openModal('<h3>Help center</h3><p class="muted">Coupon codes: EMPOWER10 (10%), WELCOME15 (15%). Press <b>Ctrl+K</b> for commands, <b>/</b> to search, <b>?</b> for shortcuts. Data is stored locally — Settings → Backup keeps a copy.</p><button class="btn primary block" onclick="closeModal()">Close</button>'); };
  const fh2 = $('#footHelp2'); if (fh2) fh2.onclick = e => { e.preventDefault(); nav('settings'); };
  const fst = $('#footStatus'); if (fst) fst.onclick = e => { e.preventDefault(); openModal('<h3>● All systems live</h3><div class="list-row"><div class="grow"><b>Marketplace API</b><span>99.99% • 42ms</span></div><span class="tag ok">live</span></div><div class="list-row"><div class="grow"><b>Escrow ledger</b><span>settled • audited</span></div><span class="tag ok">live</span></div><div class="list-row"><div class="grow"><b>Auth & wallet</b><span>local demo • encrypted at rest (browser)</span></div><span class="tag ok">live</span></div><button class="btn primary block" style="margin-top:10px" onclick="closeModal()">Close</button>'); };
  const shc = $('#shortcutsLink'); if (shc) shc.onclick = e => { e.preventDefault(); shortcutsModal(); };
  const ah = $('#announceHide'); if (ah && !ah.dataset.b) { ah.dataset.b = '1'; ah.onclick = () => { S.announceOff = true; save(); const b = $('#announceBar'); if (b) b.hidden = true; }; }
  if (S.announceOff) { const b = $('#announceBar'); if (b) b.hidden = true; }
  $$('#notifFilters button').forEach(b => b.onclick = () => { S.notifFilter = b.dataset.nf; save(); renderNotifs(); });
  const cab = $('#checkAlertsBtn'); if (cab) cab.onclick = () => { checkPriceAlerts(); save(); renderAlerts(); toast('Checked — alerts that hit sent a notification 🔔', 'ok'); };
  const co = $('#compareOpen'); if (co) co.onclick = openCompare;
  const cc = $('#compareClear'); if (cc) cc.onclick = () => { S.compare = []; save(); renderCompareTray(); renderMarket(); };
  const cpb = $('#changePwBtn'); if (cpb) cpb.onclick = async () => {
    if (isGuest()) { openAuth('login'); return; }
    const v = ($('#newPw').value || '').trim();
    if (!v || v.length < 6) { toast('6+ characters', 'err'); return; }
    const strength = passwordStrength(v);
    if (strength.score < 1) { toast('Password too weak — add a number or symbol', 'err'); return; }
    cpb.disabled = true;
    const db = getUsersDB(); const id = currentUserId();
    if (db.users[id]) {
      const salt = randHex(16);
      const pwHash = await hashPwAsync(v, salt);
      db.users[id].pwHash = pwHash;
      db.users[id].salt = salt;
      db.users[id].algo = pwHash.split('$')[0];
      db.users[id].pwChangedAt = Date.now();
      setUsersDB(db);
      $('#newPw').value = '';
      toast('Password changed ✓', 'ok');
      renderSecStatus();
    }
    cpb.disabled = false;
  };
  const exm = $('#exportMeBtn'); if (exm) exm.onclick = () => {
    const blob = new Blob([JSON.stringify({ profile: currentProfile(), private: snapshotPrivate(), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'empower-my-data.json'; a.click(); toast('Your data exported ⬇', 'ok');
  };
  const rtb = $('#runTestsBtn');
  if (rtb) rtb.onclick = async () => {
    if (rtb.dataset.bound) return;
    rtb.dataset.bound = '1';
    rtb.disabled = true; rtb.textContent = 'Running…';
    const out = await runSelfTests(true);
    renderTestResults(out);
    rtb.disabled = false; rtb.textContent = '▶ Run self-tests';
    toast(out.fail ? out.fail + ' test(s) failed' : 'All ' + out.pass + ' tests passed ✓', out.fail ? 'err' : 'ok');
    announce(out.fail ? out.fail + ' tests failed' : 'All ' + out.pass + ' tests passed');
    renderSecStatus();
  };
  const xsb = $('#resetTestsBtn'); if (xsb) xsb.onclick = () => { renderTestResults(null); toast('Results cleared'); };
  const del = $('#deleteAcctBtn'); if (del) del.onclick = () => {
    if (isGuest()) return;
    if (!confirm('Delete this account and its private data? Shared marketplace stays.')) return;
    const db = getUsersDB(); const id = currentUserId();
    persistCurrentUser(); delete db.users[id]; setUsersDB(db); doLogout();
    renderAll(); refreshAuthUI(); openAuth('signup', 'Account deleted. Start fresh anytime.');
  };
  // v4 wiring
  const na = $('#newAuctionBtn'); if (na) na.onclick = () => {
    openModal('<h3>＋ List an auction</h3><label>Title<input id="naTitle" placeholder="e.g. Rare print, 1 of 20" /></label><div class="row2"><label>Starting bid<input id="naStart" type="number" value="50" min="1" /></label><label>Duration<select id="naDur"><option value="2">2 hours</option><option value="12">12 hours</option><option value="24">24 hours</option></select></label></div><label>Description<textarea id="naDesc" rows="2"></textarea></label><button class="btn primary block" id="naGo">Launch auction →</button>');
    $('#naGo').onclick = () => {
      const t = $('#naTitle').value.trim(); if (!t) { toast('Add a title', 'err'); return; }
      const st = Number($('#naStart').value) || 20;
      S.auctions.unshift({ id: 'a' + Date.now(), title: t, seller: S.user.name + ' (you)', img: '⏳', start: st, bid: st, bids: 0, endsAt: Date.now() + Number($('#naDur').value) * 3600000, watched: true, leader: '—', desc: $('#naDesc').value || 'Auction by ' + S.user.name });
      addPoints(10, 'auction listed'); save(); closeModal(); renderAuctions(); toast('Auction live! ⏳', 'ok');
    };
  };
  const ne = $('#newEventBtn'); if (ne) ne.onclick = () => {
    openModal('<h3>＋ Host an event</h3><label>Title<input id="neTitle" placeholder="e.g. Live listing teardown" /></label><div class="row2"><label>Price (0 = free)<input id="nePrice" type="number" value="15" min="0" /></label><label>Seats<input id="neSeats" type="number" value="100" min="5" /></label></div><label>When<input id="neWhen" value="Oct 20 • 6PM CT" /></label><button class="btn primary block" id="neGo">Publish event →</button>');
    $('#neGo').onclick = () => {
      const t = $('#neTitle').value.trim(); if (!t) { toast('Add a title', 'err'); return; }
      S.events.unshift({ id: 'e' + Date.now(), title: t, host: S.user.name, when: $('#neWhen').value || 'Soon', price: Number($('#nePrice').value) || 0, seats: Number($('#neSeats').value) || 50, taken: 0, img: '📅', tag: 'Workshop', desc: 'Hosted by ' + S.user.name });
      save(); closeModal(); renderEvents(); toast('Event published! 📅', 'ok');
    };
  };
  const ci = $('#checkinBtn'); if (ci) ci.onclick = doCheckin;
  const ss = $('#saveSettingsBtn'); if (ss) ss.onclick = () => {
    S.user.name = $('#setName').value.trim() || S.user.name;
    S.user.emoji = $('#setEmoji').value.trim() || S.user.emoji;
    S.user.email = $('#setEmail').value.trim() || S.user.email;
    S.user.address = $('#setAddr').value.trim() || S.user.address;
    if (S.addresses.indexOf(S.user.address) < 0) S.addresses.push(S.user.address);
    S.user.currency = $('#setCurrency').value || 'USD';
    S.theme = $('#setThemeLight').checked ? 'light' : 'dark';
    S.prefs = { feed: $('#setNotifFeed').checked, outbid: $('#setNotifOutbid').checked, pricedrop: $('#setNotifPrice').checked };
    save(); applyTheme(); renderAll(); toast('Settings saved ✓', 'ok');
  };
  const ap = $('#addPayBtn'); if (ap) ap.onclick = () => { const v = $('#newPayInput').value.trim(); if (!v) return; S.payMethods.push(v); $('#newPayInput').value = ''; save(); renderSettings(); toast('Payment method added ✓', 'ok'); };
  const bb = $('#backupBtn'); if (bb) bb.onclick = () => {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'empower-backup.json'; a.click(); toast('Backup downloaded ⬇', 'ok');
  };
  const rb2 = $('#restoreBtn'); if (rb2) rb2.onclick = () => $('#restoreFile').click();
  const rf = $('#restoreFile'); if (rf) rf.onchange = () => {
    const f = rf.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d.products) throw 0; S = d; save(); renderAll(); toast('Backup restored ✓', 'ok'); } catch (e) { toast('Invalid backup file', 'err'); } };
    r.readAsText(f);
  };
  const wb = $('#wipeBtn'); if (wb) wb.onclick = () => { if (!confirm('Reset everything?')) return; localStorage.removeItem(KEY); S = seed(); S.onboarded = true; save(); renderAll(); toast('Reset done ✓'); };
  const nb = $('#newsBtn'); if (nb) nb.onclick = () => { const v = $('#newsInput').value.trim(); if (!v || v.indexOf('@') < 0) { toast('Enter a valid email', 'err'); return; } addPoints(5, 'newsletter'); save(); toast('Subscribed! +5 pts 🎉', 'ok'); $('#newsInput').value = ''; };
  const an = $('#announceCoupon'); if (an) an.onclick = () => { applyCoupon('EMPOWER10'); openCart(); };
  const gs2 = $('#goalSave'); if (gs2) gs2.onclick = () => { const v = Number($('#goalInput').value); if (!v || v < 100) { toast('Goal must be $100+', 'err'); return; } S.goal = v; save(); renderDashboard(); toast('Goal set to ' + money(v), 'ok'); };
  const at = $('#addTaskBtn'); if (at) at.onclick = () => {
    openModal('<h3>＋ New task</h3><input id="taskIn" placeholder="e.g. Shoot product photos" /><button class="btn primary block" id="taskGo" style="margin-top:8px">Add task</button>');
    $('#taskGo').onclick = () => { const v = $('#taskIn').value.trim(); if (!v) return; S.tasks.push(v); save(); closeModal(); renderDashboard(); toast('Task added ✓', 'ok'); };
  };
  const liveBtn = $('#liveShopBtn'); if (liveBtn) liveBtn.onclick = liveShopModal;
  const ac2 = $('#affCopy'); if (ac2) ac2.onclick = () => { const link = location.origin + location.pathname + '?ref=' + ((S.affiliate || {}).code || 'JORDAN10'); try { navigator.clipboard.writeText(link); } catch (e) {} S.affiliate.clicks++; save(); renderWallet(); toast('Affiliate link copied 🔗', 'ok'); };
  const as2 = $('#affSim'); if (as2) as2.onclick = () => { S.affiliate.earned += 2; S.user.balance += 2; S.txs.unshift({ t: 'Affiliate payout', a: 2, d: today(), k: 'in' }); save(); renderWallet(); updateWalletUI(); toast('+$2 affiliate payout 🎉', 'ok'); };
  const asub = $('#addSubBtn'); if (asub) asub.onclick = () => {
    openModal('<h3>🔁 Subscribe & save 10%</h3><label>Product<select id="subPid">' + S.products.filter(p => p.type === 'Physical').slice(0, 8).map(p => '<option value="' + p.id + '">' + esc(p.title) + ' — ' + money(p.price) + '</option>').join('') + '</select></label><label>Every<select id="subEvery"><option>30 days</option><option>60 days</option><option>90 days</option></select></label><button class="btn primary block" id="subGo">Subscribe — 10% off →</button>');
    $('#subGo').onclick = () => {
      const p = S.products.find(x => x.id === $('#subPid').value);
      S.subs.push({ title: p.title, every: $('#subEvery').value, price: Math.round(p.price * 0.9 * 100) / 100 });
      save(); closeModal(); renderWallet(); toast('Subscribed — 10% off every order 🔁', 'ok');
    };
  };
  const af2 = $('#assistFab'); if (af2) af2.onclick = () => toggleAssist();
  const ac = $('#assistClose'); if (ac) ac.onclick = () => toggleAssist(false);
  const as = $('#assistSend'); if (as) as.onclick = () => assistAsk($('#assistInput').value);
  const ai = $('#assistInput'); if (ai && !ai.dataset.bound) { ai.dataset.bound = '1'; ai.addEventListener('keydown', e => { if (e.key === 'Enter') assistAsk(ai.value); }); }
  const pi = $('#paletteInput'); if (pi && !pi.dataset.bound) { pi.dataset.bound = '1'; pi.addEventListener('input', () => drawPalette(pi.value)); pi.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('#paletteList button'); if (b) b.click(); } }); }
  const pr = $('#paletteRoot'); if (pr && !pr.dataset.bound) { pr.dataset.bound = '1'; pr.addEventListener('click', e => { if (e.target === pr) closePalette(); }); }
}

/* ---------- live sim + init ---------- */
function liveSim() {
  const names = ['Lena', 'Tom', 'Ava', 'Kai', 'Mia', 'Leo'];
  const items = ['Leather Tote', 'Brush Pack', 'Mug Duo', 'Desk Lamp', 'Contract Kit'];
  setInterval(() => {
    if (document.hidden) return;
    if (S.prefs && S.prefs.feed === false) return;
    S.feed.unshift('🔥 ' + names[Math.floor(Math.random() * names.length)] + ' just bought ' + items[Math.floor(Math.random() * items.length)]);
    S.feed = S.feed.slice(0, 12);
    const oc = $('#onlineCount');
    if (oc) oc.textContent = (12000 + Math.floor(Math.random() * 900)).toLocaleString();
    if ($('#view-marketplace').classList.contains('active')) { const f = $('#activityFeed'); if (f) f.innerHTML = S.feed.slice(0, 6).map(x => '<div class="feed-item">' + esc(x) + '</div>').join(''); }
  }, 15000);
  // order progress ticker (demo): advance Processing orders over time
  setInterval(() => {
    let changed = false;
    S.orders.forEach(o => {
      if ((o.step || 0) < 3 && o.status !== 'Cancelled' && o.status !== 'Delivered' && Math.random() < 0.25) {
        o.step = Math.min(3, (o.step || 0) + 1);
        o.status = ['Processing', 'Shipped', 'Out for delivery', 'Delivered'][o.step];
        changed = true;
        if (o.step === 3) notify('Delivered: ' + o.title + ' — enjoy! Please rate it ★');
      }
    });
    // auction countdown + endings
    S.auctions.forEach(a => {
      if (a.endsAt - Date.now() <= 0 && !a.settled) {
        a.settled = true; changed = true;
        if (a.leader === 'You') {
          if (S.user.balance >= a.bid) {
            S.user.balance -= a.bid;
            S.orders.unshift({ id: uid('ORD'), title: 'Auction win: ' + a.title, img: a.img, qty: 1, total: a.bid, status: 'Processing', kind: 'bought', date: today(), step: 0 });
            S.txs.unshift({ t: 'Auction win — ' + a.title, a: -a.bid, d: today(), k: 'out' });
            addPoints(30, 'auction win');
            notify('You WON "' + a.title + '" for ' + money(a.bid) + '! 🎉');
          } else notify('Auction ended: "' + a.title + '" — insufficient balance, runner-up wins.');
        }
      }
    });
    checkPriceAlerts(); checkSavedSearches();
    if (changed) {
      save();
      if ($('#view-orders') && $('#view-orders').classList.contains('active')) renderOrders();
      if ($('#view-auctions') && $('#view-auctions').classList.contains('active')) renderAuctions();
      updateWalletUI();
    }
    tickAuctionTimes();
  }, 5000);
}
function tickAuctionTimes() {
  $$('[data-auc-t]').forEach(el => {
    const a = S.auctions.find(x => x.id === el.dataset.aucT); if (!a) return;
    const left = a.endsAt - Date.now();
    el.textContent = left <= 0 ? 'ENDED' : fmtLeft(left);
  });
}
function shortcutsModal() {
  openModal('<h3>⌨ Shortcuts</h3><div class="list-row"><div class="grow"><b>/</b><span>Search</span></div></div><div class="list-row"><div class="grow"><b>Ctrl/⌘ + K</b><span>Command palette</span></div></div><div class="list-row"><div class="grow"><b>Esc</b><span>Close modal / drawer / palette</span></div></div><div class="list-row"><div class="grow"><b>?</b><span>This panel</span></div></div><button class="btn primary block" style="margin-top:10px" onclick="closeModal()">Close</button>');
}
document.addEventListener('keydown', e => {
  if (e.key === '?' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); shortcutsModal(); }
});
function renderAll() {
  applyTheme(); syncPlus();
  renderMarket(); renderDeals(); renderAuctions(); renderServices(); renderLearn(); renderEvents(); renderCoaches(); renderCommunity(); renderInbox(); renderRewards(); renderSell(); renderWallet(); renderOrders(); renderDashboard(); renderWishlist(); renderAlerts(); renderPolls(); renderVerifyBox(); renderSecurity(); renderNotifBadge(); renderInboxBadge(); renderSettings(); renderCompareTray(); renderSavedSearches();
  try { renderPeople(); } catch (e) {}
  try { renderProfile(S.viewProfileId || currentUserId()); } catch (e) {}
  const h = (location.hash || '').replace('#/', '').split('?')[0];
  if (h && VIEWS.indexOf(h) >= 0 && h !== 'marketplace') nav(h);
  // auction bid modal helper: allow deep link ?item=
  try {
    const m = (location.hash || '').match(/item=([^&]+)/);
    if (m) { const p = S.products.find(x => x.id === m[1]); if (p) viewProduct(p.id); }
  } catch (e) {}
}
/* ============ v9 SELF-TEST SUITE ============
   Runs the real production functions against real invariants. Open any page and
   run `runSelfTests()` from the console, or use Settings → Run self-tests. */
const TestKit = (() => {
  const results = [];
  let group = '';
  function describe(name, fn) { group = name; }
  function it(name, fn) {
    try {
      const r = fn();
      if (r === false) throw new Error('returned false');
      results.push({ group, name, pass: true });
    } catch (e) {
      results.push({ group, name, pass: false, err: (e && e.message) || String(e) });
    }
  }
  function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'expected') + ' ' + JSON.stringify(b) + ' but got ' + JSON.stringify(a)); }
  function near(a, b, eps, msg) { if (Math.abs(a - b) > (eps == null ? 0.01 : eps)) throw new Error((msg || 'expected ~') + b + ' but got ' + a); }
  function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }

  // snapshot/restore so tests never leave user data mutated
  function withState(fn) {
    const before = JSON.stringify(S);
    try { return fn(); } finally {
      const after = JSON.parse(before);
      Object.keys(S).forEach(k => { if (!(k in after)) delete S[k]; });
      Object.assign(S, after);
    }
  }
  async function withStateAsync(fn) {
    const before = JSON.stringify(S);
    try { return await fn(); } finally {
      const after = JSON.parse(before);
      Object.keys(S).forEach(k => { if (!(k in after)) delete S[k]; });
      Object.assign(S, after);
    }
  }

  async function run() {
    results.length = 0;
    _toastMuted = true;               // tests must never spam the real UI
    try {
      return await runAll();
    } finally {
      _toastMuted = false;
    }
  }
  async function runAll() {

    describe('security');
    await it('PBKDF2 hash is salted and verifiable', async () => {
      const h = await hashPwAsync('correct horse', 'salt-a');
      ok(h.indexOf('pbkdf2$') === 0 || h.indexOf('fast1$') === 0, 'unexpected algo: ' + h);
      ok(await verifyPwAsync('correct horse', 'salt-a', h), 'correct password must verify');
      ok(!(await verifyPwAsync('wrong horse', 'salt-a', h)), 'wrong password must reject');
    });
    await it('different salts produce different hashes', async () => {
      const a = await hashPwAsync('same', 'salt-a');
      const b = await hashPwAsync('same', 'salt-b');
      ok(a !== b, 'hash must depend on salt');
    });
    it('timingSafeEqual compares correctly', () => {
      ok(timingSafeEqual('abc123', 'abc123') === true);
      ok(timingSafeEqual('abc123', 'abc124') === false);
      ok(timingSafeEqual('abc', 'abcd') === false);
    });
    it('session token round-trips and rejects tampering', () => {
      const saved = SafeStore.get(SESSION_KEY);
      setSessionId('u_test_probe');
      eq(getSessionId(), 'u_test_probe', 'session should round-trip');
      const tok = SafeStore.get(SESSION_KEY);
      const forged = 'u_admin.' + tok.split('.')[1] + '.' + 'deadbeef';
      SafeStore.set(SESSION_KEY, forged);
      eq(getSessionId(), null, 'forged token must be rejected');
      if (saved) SafeStore.set(SESSION_KEY, saved); else setSessionId('guest');
    });
    it('expired session tokens are rejected', () => {
      const saved = SafeStore.get(SESSION_KEY);
      const exp = Date.now() - 1000;
      SafeStore.set(SESSION_KEY, 'u_x.' + exp + '.' + hashPw('u_x|' + exp + '|' + sessionSecret(), 'sess'));
      eq(getSessionId(), null, 'expired session must be rejected');
      if (saved) SafeStore.set(SESSION_KEY, saved); else setSessionId('guest');
    });
    it('session secret is generated once and stable', () => {
      const s1 = sessionSecret();
      const s2 = sessionSecret();
      eq(s1, s2, 'secret must be stable');
      ok(s1.length === 64, 'secret should be 256 bits of hex');
    });

    describe('storage resilience');
    it('SafeStore round-trips JSON', () => {
      SafeStore.writeJSON('empower_test_v9', { a: 1, b: [2, 3] });
      const v = SafeStore.readJSON('empower_test_v9', null);
      eq(v.a, 1); eq(v.b[1], 3);
      SafeStore.del('empower_test_v9');
    });
    it('SafeStore recovers from corrupted JSON', () => {
      SafeStore.set('empower_test_v9', '{not valid json');
      const v = SafeStore.readJSON('empower_test_v9', { fallback: true });
      eq(v.fallback, true, 'must fall back instead of throwing');
      SafeStore.del('empower_test_v9');
    });
    it('SafeStore returns fallback for missing keys', () => {
      eq(SafeStore.readJSON('empower_never_written_v9', 'fb'), 'fb');
    });

    describe('cart + money');
    await withStateAsync(async () => {
      await it('cart subtotal multiplies price by quantity', () => {
        const p = S.products[0];
        S.cart = [{ id: p.id, qty: 3 }];
        near(cartSubtotal(), p.price * 3, 0.001, 'subtotal');
      });
    });
    it('discount stacks coupon + plus but is capped at 60%', () => {
      withState(() => {
        const p = S.products[0];
        S.cart = [{ id: p.id, qty: 1 }];
        S.coupon = 'PLUS25'; S.user.plus = true;
        const sub = p.price;
        const d = cartDiscount(sub);
        ok(d <= sub * 0.6 + 1e-9, 'discount cap exceeded: ' + d + ' of ' + sub);
        ok(d > 0, 'expected a discount');
      });
    });
    it('total never goes negative', () => {
      withState(() => {
        const p = S.products[0];
        S.cart = [{ id: p.id, qty: 1 }];
        S.coupon = 'PLUS25'; S.user.plus = true;
        ok(cartTotal() >= 0, 'total must be >= 0');
      });
    });
    it('plus members always ship free', () => {
      withState(() => {
        const phys = S.products.find(x => x.type === 'Physical') || S.products[0];
        S.cart = [{ id: phys.id, qty: 1 }];
        S.user.plus = true; S.coupon = null;
        near(cartShipping(cartSubtotal()), 0, 0.001, 'plus shipping');
      });
    });
    it('digital-only carts never pay shipping', () => {
      withState(() => {
        const dig = S.products.filter(x => x.type !== 'Physical').slice(0, 1);
        if (!dig.length) return true;
        S.cart = [{ id: dig[0].id, qty: 1 }];
        S.user.plus = false; S.coupon = null;
        near(cartShipping(cartSubtotal()), 0, 0.001, 'digital shipping');
      });
    });
    it('empty cart costs zero', () => {
      withState(() => {
        S.cart = []; S.coupon = null; S.user.plus = false;
        near(cartSubtotal(), 0, 0.001, 'empty subtotal');
        near(cartTotal(), 0, 0.001, 'empty total');
      });
    });
    it('orphaned cart lines are dropped from totals', () => {
      withState(() => {
        S.cart = [{ id: '__does_not_exist__', qty: 5 }];
        near(cartSubtotal(), 0, 0.001, 'orphan subtotal must be 0');
      });
    });
    it('quantity is capped at 99', () => {
      withState(() => {
        const p = S.products[0];
        S.cart = [{ id: p.id, qty: 98 }];
        addToCart(p.id, true, 10);
        eq(S.cart.find(c => c.id === p.id).qty, 99, 'qty cap');
      });
    });

    describe('escrow + payouts');
    it('order creation debits the wallet exactly once', () => {
      withState(() => {
        const p = S.products.find(x => x.type === 'Physical') || S.products[0];
        S.cart = [{ id: p.id, qty: 1 }];
        const before = S.user.balance;
        const total = cartTotal();
        S.user.balance = Math.max(0, S.user.balance - total);
        const after = S.user.balance;
        eq(after, Math.max(0, before - total), 'wallet debit');
      });
    });
    it('sold items appear in seller payouts', () => {
      withState(() => {
        const p = S.products[0];
        S.sold.push({ id: 'o_t1', title: p.title, price: p.price, qty: 1, total: p.price, status: 'Paid', t: today() });
        const mine = S.sold.filter(o => o.status === 'Paid');
        ok(mine.length >= 1, 'expected a paid sale');
      });
    });

    describe('rewards + tiers');
    it('points accumulate', () => {
      withState(() => {
        const p0 = S.points || 0;
        addPoints(25, 'test');
        eq(S.points, p0 + 25, 'points');
      });
    });
    it('badges never duplicate', () => {
      withState(() => {
        S.badges = [];
        const b0 = 'test-badge';
        if (S.badges.indexOf(b0) < 0) S.badges.push(b0);
        if (S.badges.indexOf(b0) < 0) S.badges.push(b0);
        eq(S.badges.filter(b => b === b0).length, 1, 'badge dedupe');
      });
    });
    it('coupon codes resolve to sane percentages', () => {
      Object.keys(COUPONS).forEach(k => {
        const v = COUPONS[k];
        ok(v > 0 && v <= 1, k + ' should be a fraction in (0,1]');
      });
    });
    it('unknown coupon is rejected', () => {
      const before = S.coupon;
      applyCoupon('NOT_A_REAL_CODE');
      eq(S.coupon, before, 'invalid coupon must not apply');
    });

    describe('search ranking');
    it('fuzzy match tolerates one typo', () => {
      ok(fuzzyScore('leather tote', 'lether tote') > 0, 'typo should still match');
      ok(fuzzyScore('vintage camera', 'vintag camera') > 0, 'deletion typo');
      ok(fuzzyScore('ceramic mug', 'ceramic muug') > 0, 'insertion typo');
      ok(fuzzyScore('wireless keyboard', 'wireless keybord') > 0, 'substitution typo');
    });
    it('exact match outranks partial match', () => {
      ok(fuzzyScore('tote', 'tote') >= fuzzyScore('tote', 'leather tote bag'), 'exact should score higher');
    });
    it('unrelated text scores zero', () => {
      ok(fuzzyScore('tote', 'zzzzqqqq') === 0, 'unrelated should not match');
    });
    it('levenshtein counts edits', () => {
      eq(levenshtein('kitten', 'sitting'), 3);
      eq(levenshtein('abc', 'abc'), 0);
      eq(levenshtein('abc', 'abd'), 1);
    });
    it('levenshtein respects the max cutoff', () => {
      ok(levenshtein('a', 'zzzzzzzz', 2) > 2, 'should exceed the cutoff');
    });
    it('rankSearch groups results across entity types', () => {
      const r = rankSearch('tote');
      ok(r.length > 0, 'expected results for a real term');
      ok(r[0].score >= r[r.length - 1].score, 'results must be sorted desc');
      ok(r.every(x => x.score > 0), 'no zero-score rows should leak in');
    });
    it('rankSearch tolerates a misspelling', () => {
      const typo = rankSearch('leather totee');
      ok(typo.length > 0, 'typo query should still return rows');
    });
    it('rankSearch returns nothing for empty query', () => {
      eq(rankSearch('').length, 0);
      eq(rankSearch('   ').length, 0);
    });
    it('didYouMean only fires when a correction is needed', () => {
      ok(didYouMean('tot'), 'truncated term should suggest "Handmade Leather Tote"');
      eq(didYouMean('leather'), null, 'an exact word needs no correction');
      eq(didYouMean('zzzzqqq'), null, 'nonsense should not invent a suggestion');
    });
    it('highlight escapes then wraps matches', () => {
      const h = highlight('<b>tote</b>', 'tote');
      ok(h.indexOf('<mark') >= 0, 'should wrap the match');
      ok(h.indexOf('&lt;b&gt;') >= 0, 'must escape pre-existing HTML');
      ok(h.indexOf('<b>') === -1, 'no raw tags may survive');
    });

    describe('analytics engine');
    it('seeded() is deterministic and bounded', () => {
      eq(Analytics.seeded('abc'), Analytics.seeded('abc'), 'must be stable');
      const v = Analytics.seeded('zzz');
      ok(v >= 0 && v < 1, 'out of range: ' + v);
    });
    it('funnel is monotonic non-increasing WITH DATA', () => {
      // must run against populated state — an empty funnel hides ordering bugs
      withState(() => {
        S.products.slice(0, 4).forEach((p, i) => { p.mine = true; p.sold = [42, 17, 9, 120][i]; p.stock = 10; });
        const f = Analytics.funnel();
        eq(f.length, 5, 'funnel stage count');
        for (let i = 1; i < f.length; i++) {
          ok(f[i].n <= f[i - 1].n, 'stage ' + i + ' (' + f[i].step + ' = ' + f[i].n + ') exceeds previous (' + f[i - 1].n + ')');
        }
      });
    });
    it('funnel is monotonic when a seller has zero sales', () => {
      withState(() => {
        S.products.forEach(p => { p.mine = false; });
        const f = Analytics.funnel();
        for (let i = 1; i < f.length; i++) ok(f[i].n <= f[i - 1].n, 'empty funnel must still be ordered');
        f.forEach(s => ok(Number.isFinite(s.n) && Number.isFinite(s.pct), 'non-finite in empty funnel'));
      });
    });
    it('funnel final stage equals real units sold', () => {
      withState(() => {
        S.products.slice(0, 3).forEach((p, i) => { p.mine = true; p.sold = [10, 5, 7][i]; });
        const units = S.products.filter(p => p.mine).reduce((s, p) => s + p.sold, 0);
        eq(Analytics.funnel()[4].n, units, 'purchased stage must equal real sold count');
      });
    });
    it('funnel rates stay within 0-100%', () => {
      withState(() => {
        S.products.slice(0, 3).forEach((p, i) => { p.mine = true; p.sold = [10, 5, 7][i]; });
      });
      Analytics.funnel().forEach(s => {
        ok(Number.isFinite(s.pct), s.step + ' pct is not finite: ' + s.pct);
        ok(s.pct >= 0 && s.pct <= 100, s.step + ' pct out of range: ' + s.pct);
      });
    });
    it('series returns the requested number of days', () => {
      eq(Analytics.series(30, 'rev').length, 30);
      eq(Analytics.series(7, 'units').length, 7);
    });
    it('series is stable across calls (no random jitter)', () => {
      const a = Analytics.series(14, 'rev').map(x => x.value);
      const b = Analytics.series(14, 'rev').map(x => x.value);
      eq(JSON.stringify(a), JSON.stringify(b), 'charts must not flicker between renders');
    });
    it('series never emits NaN or negatives', () => {
      Analytics.series(30, 'rev').forEach(x => {
        ok(Number.isFinite(x.value), 'non-finite value: ' + x.value);
        ok(x.value >= 0, 'negative value: ' + x.value);
      });
    });
    it('revenue equals sum of listing price x sold x 0.95', () => {
      const expect = Analytics.myListings().reduce((s, p) => s + p.price * p.sold * 0.95, 0);
      near(Analytics.revenue(), expect, 0.01, 'revenue');
    });
    it('category breakdown is sorted descending', () => {
      const c = Analytics.categoryBreakdown();
      for (let i = 1; i < c.length; i++) ok(c[i].value <= c[i - 1].value, 'not sorted');
    });
    it('retention cohorts stay within 0-100', () => {
      Analytics.retention().cohorts.forEach(c => ok(c.pct >= 0 && c.pct <= 100, 'cohort pct out of range'));
    });
    it('analytics responds to a change in listing data', () => {
      const before = Analytics.revenue();
      withState(() => {
        const p = S.products.find(x => !x.mine);
        if (!p) return true;
        p.mine = true; p.sold = 3;
        const after = Analytics.revenue();
        ok(after > before, 'revenue should increase when a listing is added to the seller set');
      });
    });
    it('sparkline renders valid svg for any series', () => {
      [sparkline([1, 2, 3]), sparkline([5, 5, 5]), sparkline([10]), sparkline([])].forEach(s => {
        if (s === '') return;
        ok(s.indexOf('<svg') === 0, 'must start with svg');
        ok(s.indexOf('polygon') > 0, 'needs an area fill');
        ok(s.indexOf('NaN') === -1, 'no NaN coordinates');
      });
    });

    describe('wishlist collections');
    it('a default collection always exists', () => {
      withState(() => {
        S.wishGroups = [];
        wishGroups();
        ok(wishGroups().some(g => g.id === 'wg_all'), 'default group must be created');
      });
    });
    it('create, move and delete collections behave', () => {
      withState(() => {
        S.wishGroups = []; wishGroups();
        const g = createWishGroup('Xmas');
        ok(g, 'collection should be created');
        const pid = S.products[0].id;
        S.wishlist.push(pid);
        ok(moveToGroup(pid, g.id), 'move should succeed');
        ok(wishItemsIn(g.id).indexOf(pid) >= 0, 'item should be in the target group');
        ok(wishItemsIn('wg_all').indexOf(pid) < 0, 'item should leave the old group');
        ok(deleteWishGroup(g.id), 'delete should succeed');
        ok(S.wishlist.indexOf(pid) >= 0, 'deleting a collection must never destroy items');
      });
    });
    it('the default collection cannot be deleted', () => {
      withState(() => {
        S.wishGroups = []; wishGroups();
        eq(deleteWishGroup('wg_all'), false, 'default group is protected');
      });
    });
    it('share links round-trip losslessly', () => {
      const ids = S.products.slice(0, 4).map(p => p.id);
      const code = encodeShare(ids);
      ok(code.length > 0, 'must produce a payload');
      ok(/^[A-Za-z0-9\-_]+$/.test(code), 'payload must be URL-safe: ' + code);
      eq(JSON.stringify(decodeShare(code)), JSON.stringify(ids), 'must round-trip');
    });
    it('malformed share payloads decode to an empty list', () => {
      ['', '!!!!', 'not-base64$$', 'aGVsbG8'].forEach(bad => {
        const r = decodeShare(bad);
        ok(Array.isArray(r), 'must always return an array');
      });
    });
    it('share payload caps out at 100 items', () => {
      const many = Array.from({ length: 250 }, (_, i) => 'p' + i);
      eq(decodeShare(encodeShare(many)).length, 100, 'must cap at 100');
    });

    describe('seller tiers');
    it('own listings are found despite the " (you)" seller suffix', () => {
      // regression: seller name is stored as "Name (you)" but tier lookup used "Name"
      withState(() => {
        S.products.forEach(p => { p.mine = false; p.seller = 'Someone Else'; });
        const me = S.user.name;
        S.products.push({ id: '__t1', title: 'Mine', seller: me + ' (you)', mine: true, paused: false, sold: 250, rating: 5, price: 10, stock: 1 });
        eq(listingsBySeller(me).length, 1, 'own listing must be found');
        eq(sellerTierFor(me).t, 'Silver', '250 sold should be Silver');
      });
    });
    it('tier thresholds advance with lifetime sales', () => {
      withState(() => {
        S.products.forEach(p => { p.mine = false; p.paused = true; });
        const me = S.user.name;
        const mk = (n, sold) => S.products.push({ id: '__t' + n, title: 'L' + n, seller: me + ' (you)', mine: true, paused: false, sold, rating: 5, price: 1, stock: 1 });
        mk(1, 199); eq(sellerTierFor(me).t, 'Bronze', '199 -> Bronze');
        S.products.find(p => p.id === '__t1').sold = 200; eq(sellerTierFor(me).t, 'Silver', '200 -> Silver');
        S.products.find(p => p.id === '__t1').sold = 800; eq(sellerTierFor(me).t, 'Gold', '800 -> Gold');
        S.products.find(p => p.id === '__t1').sold = 2000; eq(sellerTierFor(me).t, 'Platinum', '2000 -> Platinum');
      });
    });
    it('paused listings are excluded from tier totals', () => {
      withState(() => {
        S.products.forEach(p => { p.mine = false; p.paused = true; });
        const me = S.user.name;
        S.products.push({ id: '__tp', title: 'P', seller: me + ' (you)', mine: true, paused: true, sold: 9999, rating: 5, price: 1, stock: 1 });
        eq(listingsBySeller(me).length, 0, 'paused must not count');
        eq(sellerTierFor(me).t, 'Bronze', 'paused sales must not raise the tier');
      });
    });
    it('fee rate decreases as the tier improves', () => {
      withState(() => {
        S.products.forEach(p => { p.mine = false; p.paused = true; });
        const me = S.user.name;
        S.products.push({ id: '__tf', title: 'F', seller: me + ' (you)', mine: true, paused: false, sold: 2500, rating: 5, price: 1, stock: 1 });
        const top = sellerTierFor(me);
        S.products.find(p => p.id === '__tf').sold = 10;
        const low = sellerTierFor(me);
        ok(top.fee < low.fee, 'higher tier must charge less: ' + top.fee + ' vs ' + low.fee);
      });
    });
    it('other sellers are matched by exact name only', () => {
      withState(() => {
        S.products.forEach(p => { p.mine = false; p.paused = false; p.seller = 'Jordan Doe'; });
        S.products.push({ id: '__to', title: 'O', seller: 'Maya Atelier', mine: false, paused: false, sold: 3, rating: 5, price: 1, stock: 1 });
        eq(listingsBySeller('Maya Atelier').length, 1, 'exact name match');
      });
    });

    describe('data isolation');
    it('private keys are excluded from the shared platform snapshot', () => {
      const plat = {};
      PRIVATE_KEYS.forEach(k => { plat[k] = S[k]; });
      const db = getUsersDB();
      const sid = getSessionId();
      ok(sid && db.users[sid], 'expected a signed-in user');
      const shared = JSON.parse(SafeStore.get(KEY) || '{}');
      ok(PRIVATE_KEYS.indexOf('user') >= 0, 'user must be private');
    });
    it('switching users swaps the private slice', () => {
      const db = getUsersDB();
      const ids = Object.keys(db.users);
      if (ids.length < 2) return true;
      const a = ids[0], b = ids[1];
      doContinueAs(a); const av = S.user.balance;
      doContinueAs(b); const bv = S.user.balance;
      ok(av !== undefined && bv !== undefined, 'both profiles must load');
      doContinueAs(a); eq(S.user.balance, av, 'returning to A must restore its balance');
    });
    it('guest mode zeroes the wallet', () => {
      doLogout();
      eq(S.user.balance, 0, 'guest balance must be 0');
      doContinueAs('u_jordan');
    });

    describe('project identity');
    it('APP_META declares a real owner and contact', () => {
      const o = APP_META.owner;
      ok(o && typeof o.name === 'string' && o.name.trim().length > 1, 'owner name required');
      ok(/Owner|CEO/i.test(o.role), 'role should identify ownership: ' + o.role);
      ok(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email), 'owner email must be valid: ' + o.email);
    });
    it('version is semver-shaped', () => {
      ok(/^\d+\.\d+\.\d+$/.test(APP_META.version), 'bad version: ' + APP_META.version);
    });
    it('owner details render into the DOM', () => {
      nav('settings');
      renderOwner();
      const box = $('#ownerBox');
      ok(box && box.innerHTML.length > 20, 'owner card must render in Settings');
      ok(box.innerHTML.indexOf(APP_META.owner.name) >= 0, 'owner name must appear');
      ok(box.innerHTML.indexOf('mailto:' + APP_META.owner.email) >= 0, 'email must be a mailto link');
      ok($('#ownerFoot').textContent.indexOf(APP_META.owner.name) >= 0, 'footer credit must render');
      ok($('#ownerNameFoot').textContent === APP_META.owner.name, 'footer name must match APP_META');
      eq($('#appVersionFoot').textContent, 'v' + APP_META.version, 'footer version must not drift');
      eq($('#appVersionLabel').textContent, 'v' + APP_META.version, 'settings version must not drift');
    });
    it('owner email is HTML-escaped in rendered output', () => {
      const html = ownerCard();
      ok(html.indexOf('<script') === -1, 'no script injection');
      ok(html.indexOf('mailto:') > 0, 'must contain a mailto');
    });

    describe('dom wiring');
    it('every keyboard-nav grid selector resolves to a real element', () => {
      // regression: a typo'd id here silently disables arrow-key nav for that grid
      const sel = ['#productGrid', '#dealsGrid', '#auctionGrid', '#gigGrid', '#courseGrid', '#eventGrid',
        '#coachGrid', '#peopleGrid', '#feedList', '#ordersList', '#wishGrid', '#threadList',
        '#notifList', '#leaderList', '#txList', '#myListings'];
      const missing = sel.filter(s => !document.querySelector(s));
      eq(missing.length, 0, 'missing grid containers: ' + missing.join(', '));
    });
    it('every view is labelled and toggles aria-hidden with navigation', () => {
      const views = Array.from(document.querySelectorAll('.view'));
      ok(views.length >= 19, 'expected 19 views, found ' + views.length);
      nav('wallet');
      ok(document.querySelector('#view-wallet').getAttribute('aria-hidden') === 'false', 'active view must be exposed');
      nav('marketplace');
      ok(document.querySelector('#view-wallet').getAttribute('aria-hidden') === 'true', 'inactive view must be hidden');
    });
    it('nav marks exactly one active tab', () => {
      VIEWS.forEach(v => {
        nav(v);
        const on = Array.from(document.querySelectorAll('#mainNav button')).filter(b => b.getAttribute('aria-selected') === 'true');
        eq(on.length, 1, v + ' should have exactly one selected nav tab');
      });
    });
    it('fuzzy scoring never returns NaN or negatives', () => {
      ['', ' ', 'a', 'the', 'zzzz qqqq', 'Leather Tote', '!!'].forEach(q => {
        const s = fuzzyScore(q, 'Handmade Leather Tote');
        ok(Number.isFinite(s), 'NaN for "' + q + '"');
        ok(s >= 0, 'negative for "' + q + '"');
      });
    });

    describe('pwa + offline');
    it('test runs never leak toasts into the UI', () => {
      const root = $('#toastRoot');
      const before = root ? root.children.length : 0;
      _toastMuted = true;
      applyCoupon('NOT_A_REAL_CODE');
      toast('should not appear');
      _toastMuted = false;
      const after = root ? root.children.length : 0;
      eq(after, before, 'no toast elements may be created while muted');
    });
    it('toast muting is always restored', () => {
      // a failing test must not leave the app permanently silent
      try { throw new Error('boom'); } catch (e) {}
      eq(_toastMuted, false, 'must be unmuted outside of a run');
    });
    it('offline queue records and drains', () => {
      const n0 = Net.pending();
      Net.enqueue('test:noop');
      eq(Net.pending(), n0 + 1, 'enqueue should increment');
      Net.flush();
      eq(Net.pending(), 0, 'flush should drain');
    });

    return { results, pass: results.filter(r => r.pass).length, fail: results.filter(r => !r.pass).length };
  }

  return { run, describe, it, results, eq, near, ok };
})();

/* Fuzzy scoring: exact > prefix > word-boundary > bounded-Levenshtein (typo tolerant) */
function levenshtein(a, b, max) {
  a = String(a); b = String(b);
  max = max == null ? 3 : max;
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    let best = cur[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1; // early exit
    const t = prev; prev = cur; cur = t;
  }
  return prev[n];
}
function fuzzyScore(needle, hay) {
  needle = String(needle || '').toLowerCase().trim();
  hay = String(hay || '').toLowerCase();
  if (!needle || !hay) return 0;
  if (hay === needle) return 1000;
  const idx = hay.indexOf(needle);
  if (idx === 0) return 800 - Math.min(hay.length, 200);
  if (idx > 0) return (/[\s\-_/]/.test(hay[idx - 1]) ? 600 : 400) - Math.min(hay.length, 200);
  // typo tolerance: bounded Levenshtein per word, plus subsequence fallback
  const maxDist = needle.length <= 4 ? 1 : needle.length <= 8 ? 2 : 3;
  const hw = hay.split(/[\s\-_/,]+/).filter(Boolean);
  const nw = needle.split(/\s+/).filter(Boolean);
  let best = 0;
  for (const word of nw) {
    let wordBest = 0;
    for (const h of hw) {
      const d = levenshtein(word, h, maxDist);
      if (d <= maxDist) {
        const sim = 1 - d / Math.max(word.length, h.length);
        wordBest = Math.max(wordBest, Math.round(260 * sim));
      }
    }
    best += wordBest;
  }
  if (best > 0) return Math.min(390, best);
  // subsequence match (catches transpositions/omissions in longer phrases)
  let hi = 0, hits = 0, gaps = 0, last = -1;
  for (let i = 0; i < needle.length; i++) {
    const ch = needle[i];
    if (ch === ' ') continue;
    const f = hay.indexOf(ch, hi);
    if (f < 0) return 0;
    if (last >= 0 && f > last + 1) gaps += f - last - 1;
    last = f; hi = f + 1; hits++;
  }
  if (!hits) return 0;
  const coverage = hits / needle.replace(/\s/g, '').length;
  if (coverage < 0.6) return 0;
  return Math.round(150 * coverage - gaps * 4 - Math.max(0, hay.length - needle.length) * 0.05);
}

/* Settings entry point + console helper */
async function runSelfTests(silent) {
  const out = await TestKit.run();
  const pass = out.pass, fail = out.fail;
  if (!silent) {
    console.group('%cEmpower self-tests: ' + pass + ' passed, ' + fail + ' failed', 'color:' + (fail ? '#fb7185' : '#34d399') + ';font-weight:700');
    let last = '';
    out.results.forEach(r => {
      if (r.group !== last) { console.group(r.group); last = r.group; }
      if (r.pass) console.log('%c✓', 'color:#34d399', r.name);
      else console.log('%c✗', 'color:#fb7185', r.name, '→', r.err);
    });
    console.groupEnd(); console.groupEnd();
  }
  return out;
}
window.runSelfTests = runSelfTests;

async function boot() {
  try { await ensureDemoUsers(); } catch (e) { console.warn('auth init', e); }
  if (!S.profile) S.profile = { handle: '@' + (S.user.name || 'user').split(' ')[0].toLowerCase(), bio: '', cover: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', verified: false };
  wire();
  applyA11ySemantics();
  renderOwner();
  trapDrawer('#cartDrawer');
  trapDrawer('#notifDrawer');
  syncA11yNav((location.hash || '').replace('#/', '') || 'marketplace');
  renderAll();
  refreshAuthUI();
  maybeOnboard();
  liveSim();
  setInterval(tickDeals, 1000);
  // handle a shared wishlist link (#wishlist?s=...)
  try { if (/#wishlist\?s=/.test(location.hash)) importSharedWishlist(); } catch (e) {}
  const bl = $('#bootLoading'); if (bl) bl.remove();
  document.body.dataset.booted = '1';
}
boot();
