/* Empower — virtual economic platform (buy / sell / coach) — vanilla JS, localStorage */
const KEY = 'empower_state_v1';
const CATS = ['All','Fashion','Tech','Digital','Art','Wellness','Home','Courses'];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => '$' + Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const ec = n => Number(n).toLocaleString() + ' EC';

function seed(){
  return {
    user:{name:'Jordan Doe', initials:'JD', email:'jordan@empower.app', balance:1250, memberSince:'2025'},
    cart:[{id:'p3',qty:1}],
    products:[
      {id:'p1',title:'Handmade Leather Tote',category:'Fashion',price:129,seller:'Maya Atelier',rating:4.9,reviews:212,sold:840,img:'👜',type:'Physical',stock:14,mine:false,created:1,desc:'Full-grain leather, hand-stitched. Fits 14" laptop. Ships in 2 days with dust bag.'},
      {id:'p2',title:'Wireless Focus Headphones',category:'Tech',price:89,seller:'SoundLab',rating:4.8,reviews:531,sold:2100,img:'🎧',type:'Physical',stock:32,mine:false,created:2,desc:'40h battery, ANC, multipoint. 1-year Empower warranty included.'},
      {id:'p3',title:'Notion Business OS Pack',category:'Digital',price:39,seller:'Systemized',rating:5.0,reviews:98,sold:3400,img:'📦',type:'Digital',stock:999,mine:false,created:3,desc:'120+ templates: CRM, finance, hiring, launches. Instant download + free updates.'},
      {id:'p4',title:'Abstract Energy Print Set',category:'Art',price:59,seller:'Studio Kline',rating:4.7,reviews:64,sold:210,img:'🎨',type:'Physical',stock:20,mine:false,created:4,desc:'Set of 3 museum-grade giclée prints, signed. A2 + A3 sizes.'},
      {id:'p5',title:'AI Side-Hustle Course',category:'Courses',price:149,seller:'Coach Alex',rating:4.9,reviews:410,sold:1900,img:'🤖',type:'Digital',stock:999,mine:false,created:5,desc:'6h video + prompts + community. Go from 0 to first $1k/mo offer.'},
      {id:'p6',title:'Ceramic Morning Mug Duo',category:'Home',price:34,seller:'Kiln & Co',rating:4.8,reviews:120,sold:560,img:'☕',type:'Physical',stock:40,mine:false,created:6,desc:'Hand-thrown stoneware, dishwasher safe. Gift box included.'},
      {id:'p7',title:'Procreate Brush Empire',category:'Digital',price:24,seller:'Inkwell',rating:4.9,reviews:300,sold:5200,img:'🖌️',type:'Digital',stock:999,mine:false,created:7,desc:'80 textured brushes + paper pack + 3 tutorials.'},
      {id:'p8',title:'Smart Desk Lamp',category:'Tech',price:69,seller:'Lumen',rating:4.6,reviews:88,sold:340,img:'💡',type:'Physical',stock:25,mine:false,created:8,desc:'Auto-dim, circadian mode, wireless charger base.'},
      {id:'p9',title:'30-Day Fitness Reset',category:'Wellness',price:49,seller:'Coach Priya',rating:5.0,reviews:150,sold:980,img:'💪',type:'Service',stock:50,mine:false,created:9,desc:'Daily 20-min workouts + meal plan + chat support.'},
      {id:'p10',title:'Linen Summer Set',category:'Fashion',price:98,seller:'Maya Atelier',rating:4.7,reviews:77,sold:310,img:'👗',type:'Physical',stock:18,mine:false,created:10,desc:'Breathable European flax, sizes XS–XXL, free exchanges.'},
      {id:'p11',title:'Freelance Contract Kit',category:'Digital',price:29,seller:'LegalEase',rating:4.9,reviews:210,sold:4100,img:'📄',type:'Digital',stock:999,mine:false,created:11,desc:'12 lawyer-drafted templates: MSA, SOW, late-fee, IP.'},
      {id:'p12',title:'Bonsai Starter Trio',category:'Home',price:45,seller:'Verde',rating:4.8,reviews:92,sold:420,img:'🌱',type:'Physical',stock:22,mine:false,created:12,desc:'3 live bonsai + tools + care course access.'},
    ],
    coaches:[
      {id:'c1',name:'Alex Morgan',specialty:'Business',headline:'0 → $10k/mo store playbook',rate:80,years:8,rating:5.0,sessions:320,img:'🧑‍💼',bio:'Ex-DTC founder. I audit your offer, funnel and ads, then give you a 30-day action plan.'},
      {id:'c2',name:'Priya Nair',specialty:'Fitness',headline:'Strength for busy people',rate:55,years:6,rating:5.0,sessions:410,img:'🏋️',bio:'Certified coach. 20-min programs, habit design, nutrition without restriction.'},
      {id:'c3',name:'Diego Ruiz',specialty:'Design',headline:'Portfolio that gets hired',rate:70,years:7,rating:4.9,sessions:190,img:'🎨',bio:'Product designer from fintech unicorns. Weekly critiques + job pipeline.'},
      {id:'c4',name:'Sofia Chen',specialty:'Career',headline:'Land $150k+ remote roles',rate:90,years:9,rating:4.9,sessions:260,img:'💼',bio:'Hiring manager turned coach. Resume, LinkedIn, mock interviews that work.'},
      {id:'c5',name:'Marcus Lee',specialty:'Finance',headline:'Keep more of what you earn',rate:75,years:10,rating:4.8,sessions:150,img:'📈',bio:'CFA. Pricing, bookkeeping, tax setup for sellers and freelancers.'},
      {id:'c6',name:'Aisha Bello',specialty:'Marketing',headline:'Content → clients engine',rate:65,years:5,rating:5.0,sessions:230,img:'📣',bio:'Built 200k audience. Hooks, offers, DM scripts + 30-day calendar.'},
    ],
    orders:[
      {id:'ORD-1042',title:'Notion Business OS Pack',qty:1,total:39,status:'Delivered',kind:'bought',date:'Sep 28'},
      {id:'ORD-1039',title:'Ceramic Morning Mug Duo',qty:2,total:68,status:'Shipped',kind:'bought',date:'Sep 30'},
    ],
    sold:[{id:'SOLD-881',title:'AI Side-Hustle Course (affiliate)',qty:1,total:44.7,status:'Paid out',kind:'sold',date:'Sep 29'}],
    bookings:[{id:'BK-201',coach:'Priya Nair',when:'Oct 5 • 9:00 AM',dur:'60 min',total:55,status:'Confirmed',kind:'bookings'}],
    txs:[
      {t:'Sale payout — Mug Duo',a:64.6,d:'Sep 30',k:'in'},
      {t:'Coaching booking — Priya',a:-55,d:'Sep 29',k:'out'},
      {t:'Added funds — Visa ••4242',a:500,d:'Sep 27',k:'in'},
    ],
    rev:[180,240,190,320,280,410,390],
    feed:[
      '🔥 Maya just sold a Leather Tote for $129',
      '★ New 5★ review for Coach Priya: “life-changing”',
      '⚡ 340 buyers joined Empower today',
    ],
    cat:'All', sort:'featured', q:'', orderTab:'bought',
  };
}
let S;
try{ S = JSON.parse(localStorage.getItem(KEY)) || seed(); }catch{ S = seed(); }
if(!S.products) S = seed();
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

/* ---------- navigation ---------- */
function nav(name){
  $$('#mainNav button').forEach(b=>b.classList.toggle('active', b.dataset.nav===name));
  $$('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+name));
  $('#mainNav').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='dashboard') renderDashboard();
  if(name==='wallet') renderWallet();
  if(name==='orders') renderOrders();
  if(name==='sell') renderSell();
}
document.addEventListener('click',e=>{
  const n = e.target.closest('[data-nav]');
  if(n){ e.preventDefault(); nav(n.dataset.nav); }
});
$('#mobileMenuBtn').onclick = ()=> $('#mainNav').classList.toggle('open');

/* ---------- toast / modal ---------- */
function toast(msg){ const d=document.createElement('div'); d.className='toast'; d.textContent=msg; $('#toastRoot').appendChild(d); setTimeout(()=>d.remove(),2600); }
function openModal(html){ const r=$('#modalRoot'); r.innerHTML=`<div class="modal"><button class="icon-btn close" onclick="closeModal()">✕</button>${html}</div>`; r.classList.add('show'); $('#overlay').classList.add('show'); }
window.closeModal = ()=>{ $('#modalRoot').classList.remove('show'); $('#modalRoot').innerHTML=''; if(!$('#cartDrawer').classList.contains('open')) $('#overlay').classList.remove('show'); };

/* ---------- marketplace ---------- */
function filtered(){
  let list=[...S.products];
  if(S.cat!=='All') list=list.filter(p=>p.category===S.cat);
  if(S.q) list=list.filter(p=>(p.title+p.seller+p.category).toLowerCase().includes(S.q.toLowerCase()));
  const m={ 'price-asc':(a,b)=>a.price-b.price,'price-desc':(a,b)=>b.price-a.price,'rating':(a,b)=>b.rating-a.rating,'newest':(a,b)=>b.created-a.created };
  if(m[S.sort]) list.sort(m[S.sort]);
  return list;
}
function renderMarket(){
  $('#statProducts').textContent = S.products.length;
  $('#statCoaches').textContent = S.coaches.length;
  $('#categoryPills').innerHTML = CATS.map(c=>`<button class="${S.cat===c?'active':''}" data-cat="${c}">${c}</button>`).join('');
  $$('#categoryPills button').forEach(b=>b.onclick=()=>{S.cat=b.dataset.cat;save();renderMarket();});
  const grid=$('#productGrid');
  grid.innerHTML = filtered().map(p=>`
    <div class="product">
      <div class="p-img"><span class="badge">${p.category} • ${p.type}</span><button class="heart" data-fav="${p.id}">♡</button><span>${p.img}</span></div>
      <div class="p-body">
        <h4>${esc(p.title)}</h4><div class="seller">by ${esc(p.seller)} • ${p.sold.toLocaleString()} sold</div>
        <div class="p-meta"><span class="price">${money(p.price)} <small>${ec(p.price)}</small></span><span class="rating">★ ${p.rating} (${p.reviews})</span></div>
        <div class="p-actions"><button class="btn" data-add="${p.id}">Add</button><button class="btn primary" data-view="${p.id}">View</button></div>
      </div>
    </div>`).join('') || `<div class="card">No listings found. <a href="#" data-nav="sell">Be the first to sell it →</a></div>`;
  $$('#productGrid [data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
  $$('#productGrid [data-view]').forEach(b=>b.onclick=()=>viewProduct(b.dataset.view));
  $$('#productGrid [data-fav]').forEach(b=>b.onclick=()=>toast('Saved to wishlist ♥'));
  $('#activityFeed').innerHTML = S.feed.map(f=>`<div class="feed-item">${f}</div>`).join('');
  updateWalletUI(); updateCartUI();
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

$('#sortSelect').onchange = e=>{S.sort=e.target.value;save();renderMarket();};
$('#globalSearch').oninput = e=>{S.q=e.target.value; if(!$('#view-marketplace').classList.contains('active')) nav('marketplace'); renderMarket();};

function viewProduct(id){
  const p=S.products.find(x=>x.id===id); if(!p) return;
  openModal(`
    <div style="font-size:64px;text-align:center;background:#0f0f1a;border-radius:14px;padding:20px">${p.img}</div>
    <h3 style="margin:12px 0 4px">${esc(p.title)}</h3>
    <div class="muted">${p.category} • ${p.type} • by ${esc(p.seller)} • ★ ${p.rating} (${p.reviews} reviews) • ${p.sold.toLocaleString()} sold</div>
    <p>${esc(p.desc)}</p>
    <div class="total-row"><span>Price</span><b>${money(p.price)} <span class="muted">(${ec(p.price)})</span></b></div>
    <div class="muted small">Stock: ${p.stock} • Ships in 2–3 days • 14-day returns • Escrow protected</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn" onclick="closeModal()">Keep browsing</button>
      <button class="btn primary" style="flex:1" onclick="buyNow('${p.id}')">Buy now — ${money(p.price)}</button>
      <button class="btn" onclick="addToCart('${p.id}')">＋ Cart</button>
    </div>`);
}
window.buyNow = id=>{ addToCart(id,true); closeModal(); openCart(); };

/* ---------- cart / checkout ---------- */
window.addToCart = (id,silent)=>{
  const line=S.cart.find(c=>c.id===id);
  if(line) line.qty++; else S.cart.push({id,qty:1});
  save(); updateCartUI(); if(!silent) toast('Added to cart 🛒');
};
function cartDetailed(){ return S.cart.map(c=>({...c,...S.products.find(p=>p.id===c.id)}).filter(Boolean)).filter(x=>x.title); }
function cartTotal(){ return cartDetailed().reduce((s,x)=>s+x.price*x.qty,0); }
function updateCartUI(){
  const n=S.cart.reduce((s,c)=>s+c.qty,0);
  $('#cartCount').textContent=n; $('#cartCount2').textContent=n?`(${n})`:'';
  $('#cartTotal').textContent=money(cartTotal());
  $('#cartItems').innerHTML = cartDetailed().map(x=>`
    <div class="cart-line"><div class="thumb">${x.img}</div>
      <div class="grow"><b>${esc(x.title)}</b><span>${money(x.price)} each</span></div>
      <div class="qty"><button onclick="chQty('${x.id}',-1)">−</button>${x.qty}<button onclick="chQty('${x.id}',1)">＋</button></div>
    </div>`).join('') || '<div class="muted">Your cart is empty. Go find something great →</div>';
}
window.chQty=(id,d)=>{ const l=S.cart.find(c=>c.id===id); if(!l) return; l.qty+=d; if(l.qty<=0) S.cart=S.cart.filter(c=>c.id!==id); save(); updateCartUI(); };
function openCart(){ $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('show'); }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('show'); }
$('#cartBtn').onclick=openCart; $('#closeCart').onclick=closeCart;
$('#overlay').onclick=()=>{closeCart();closeModal();};
$('#checkoutBtn').onclick=()=>{
  if(!S.cart.length) return toast('Cart is empty');
  const t=cartTotal();
  openModal(`<h3>Secure checkout</h3>
    <div class="list-row"><div class="grow"><b>${S.cart.reduce((s,c)=>s+c.qty,0)} items</b><span>Escrow + buyer protection included</span></div><b>${money(t)}</b></div>
    <label style="display:grid;gap:6px;margin:12px 0">Delivery address<input id="addr" placeholder="Street, city, ZIP" value="123 Market St, Austin TX" /></label>
    <label style="display:grid;gap:6px">Pay with<select id="paym"><option>◉ Empower Balance (${ec(S.user.balance)})</option><option>💳 Visa •• 4242</option></select></label>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn" onclick="closeModal()">Back</button>
    <button class="btn primary" style="flex:1" onclick="placeOrder()">Pay ${money(t)} →</button></div>`);
};
window.placeOrder=()=>{
  const t=cartTotal();
  if(S.user.balance < t) { toast('Insufficient balance — top up first'); nav('wallet'); closeModal(); return; }
  S.user.balance -= t;
  cartDetailed().forEach(x=>{
    S.orders.unshift({id:'ORD-'+Math.floor(1000+Math.random()*9000),title:x.title,qty:x.qty,total:x.price*x.qty,status:'Processing',kind:'bought',date:'Today'});
    const p=S.products.find(p=>p.id===x.id); if(p){p.sold+=x.qty; p.stock=Math.max(0,p.stock-x.qty);}
  });
  S.txs.unshift({t:`Marketplace purchase (${S.cart.length} items)`,a:-t,d:'Today',k:'out'});
  S.cart=[]; save(); closeModal(); closeCart(); renderMarket(); renderWallet();
  toast('Order placed! 🎉 Track it in Orders'); nav('orders'); S.orderTab='bought'; renderOrders();
};

/* ---------- sell ---------- */
function renderSell(){
  $('#sellCategory').innerHTML = CATS.filter(c=>c!=='All').map(c=>`<option>${c}</option>`).join('');
  const mine=S.products.filter(p=>p.mine);
  const rev=mine.reduce((s,p)=>s+p.price*p.sold*0.05,0)+1240;
  $('#sellerRevenue').textContent=money(rev);
  $('#sellerActive').textContent=mine.length || S.products.length;
  $('#sellerOrders').textContent=S.sold.length+37;
  $('#myListings').innerHTML = (mine.length?mine:S.products.slice(0,4)).map(p=>`
    <div class="list-row"><div class="thumb">${p.img}</div>
      <div class="grow"><b>${esc(p.title)}</b><span>${p.category} • ${money(p.price)} • stock ${p.stock}</span></div>
      <span class="tag ok">Live</span>
      <button class="btn small" onclick="delListing('${p.id}')">Delete</button></div>`).join('');
}
window.delListing=id=>{ S.products=S.products.filter(p=>p.id!==id); S.cart=S.cart.filter(c=>c.id!==id); save(); renderMarket(); renderSell(); toast('Listing deleted'); };
$('#sellForm').onsubmit=e=>{
  e.preventDefault(); const f=new FormData(e.target);
  const p={id:'p'+Date.now(),title:f.get('title'),category:f.get('category'),price:Number(f.get('price')),stock:Number(f.get('stock')),type:f.get('type'),img:f.get('image')||'📦',seller:S.user.name+' (you)',rating:5.0,reviews:0,sold:0,mine:true,created:99,desc:f.get('description')};
  S.products.unshift(p); S.feed.unshift(`⚡ New listing: ${p.title} for ${money(p.price)}`); save(); e.target.reset(); renderMarket(); renderSell();
  toast('🎉 Listing is live!'); nav('marketplace');
};

/* ---------- coaches ---------- */
function renderCoaches(){
  const specs=['All',...new Set(S.coaches.map(c=>c.specialty))];
  $('#coachFilter').innerHTML=specs.map(s=>`<option>${s}</option>`).join('');
  const draw=f=>{
    const list=S.coaches.filter(c=>f==='All'||c.specialty===f);
    $('#coachGrid').innerHTML=list.map(c=>`
      <div class="coach-card"><div class="coach-top"><div class="coach-av">${c.img}</div>
        <div><b>${esc(c.name)}</b> <span class="tag ok">✓ Verified</span><div class="muted small">${c.specialty} • ${c.years}y exp • ★ ${c.rating} (${c.sessions})</div>
        <div style="font-size:13px;margin-top:4px">${esc(c.headline)}</div></div></div>
        <div style="padding:0 16px 16px;display:flex;align-items:center;gap:8px"><b>${money(c.rate)}/hr</b><span class="muted small">${ec(c.rate)}/hr</span>
        <button class="btn primary small" style="margin-left:auto" onclick="bookCoach('${c.id}')">Book session</button></div>
      </div>`).join('');
  };
  draw('All'); $('#coachFilter').onchange=e=>draw(e.target.value);
}
window.bookCoach=id=>{
  const c=S.coaches.find(x=>x.id===id);
  openModal(`<h3>Book ${esc(c.name)}</h3><p class="muted">${c.specialty} • ★ ${c.rating} • ${money(c.rate)}/hr</p>
    <div class="row2"><label>Date<input type="date" id="bkDate" value="2026-10-05" /></label><label>Time<select id="bkTime"><option>9:00 AM</option><option>1:00 PM</option><option>4:00 PM</option><option>7:00 PM</option></select></label></div>
    <label>Duration<select id="bkDur"><option value="1">60 min — ${money(c.rate)}</option><option value="0.5">30 min — ${money(c.rate/2)}</option></select></label>
    <label>Goal for the session<textarea id="bkNote" rows="3" placeholder="e.g. Review my store + ad account"></textarea></label>
    <button class="btn primary block" onclick="confirmBooking('${c.id}')">Confirm booking →</button>
    <p class="muted small">Free reschedule up to 12h before • Recording + action plan included</p>`);
};
window.confirmBooking=id=>{
  const c=S.coaches.find(x=>x.id===id);
  const dur=Number($('#bkDur').value); const total=c.rate*dur;
  if(S.user.balance<total){ toast('Insufficient balance — add funds'); closeModal(); nav('wallet'); return; }
  S.user.balance-=total;
  S.bookings.unshift({id:'BK-'+Math.floor(100+Math.random()*900),coach:c.name,when:$('#bkDate').value+' • '+$('#bkTime').value,dur:dur===1?'60 min':'30 min',total,status:'Confirmed',kind:'bookings'});
  S.txs.unshift({t:`Coaching — ${c.name}`,a:-total,d:'Today',k:'out'});
  save(); closeModal(); updateWalletUI(); renderWallet(); toast('Booked! Check email for video link 📅');
  nav('orders'); S.orderTab='bookings'; renderOrders();
};
$('#coachForm').onsubmit=e=>{
  e.preventDefault(); const f=new FormData(e.target);
  const c={id:'c'+Date.now(),name:f.get('name'),specialty:f.get('specialty'),headline:f.get('headline'),rate:Number(f.get('rate')),years:Number(f.get('years')),rating:5.0,sessions:0,img:'🧑‍🏫',bio:f.get('bio')};
  S.coaches.unshift(c); S.txs.unshift({t:'Coach welcome bonus',a:25,d:'Today',k:'in'}); S.user.balance+=25;
  save(); renderCoaches(); updateWalletUI(); toast('Welcome, Coach! +25 EC bonus 🎓'); nav('coaches');
};
$('#coachForm').oninput=e=>{
  const f=new FormData($('#coachForm'));
  $('#coachPreview').innerHTML=`<b>${esc(f.get('name')||'Your name')}</b> · ${esc(f.get('specialty')||'Business')}<br>“${esc(f.get('headline')||'Your headline…')}”<br><span>$${f.get('rate')||60}/hr • ${f.get('years')||5}y exp</span>`;
};

/* ---------- dashboard / orders / wallet ---------- */
function renderDashboard(){
  $('#dashGreet').textContent=`Hey ${S.user.name.split(' ')[0]}, here's your empire`;
  const rev=S.sold.reduce((s,o)=>s+o.total,0)+1240+S.bookings.reduce((s,b)=>s+b.total*0.1,0);
  $('#dRevenue').textContent=money(rev); $('#dWallet').textContent=ec(S.user.balance);
  $('#dSold').textContent=S.sold.length+37; $('#dBookings').textContent=S.bookings.length;
  $('#todoList').innerHTML=[ '📦 Ship 2 marketplace orders (due today)','💬 Reply to buyer question on Leather Tote','📅 Prep for coaching session — Oct 5','💸 Cash out available: '+ec(S.user.balance) ].map(t=>`<div class="list-row"><div class="grow"><b>${t}</b></div></div>`).join('');
  $('#recentActivity').innerHTML=[...S.orders,...S.sold,...S.bookings].slice(0,5).map(o=>`<div class="list-row"><div class="thumb">${o.kind==='bookings'?'📅':'📦'}</div><div class="grow"><b>${esc(o.title||o.coach)}</b><span>${o.id} • ${o.date}</span></div><b>${money(o.total)}</b><span class="tag ok">${o.status}</span></div>`).join('');
  const cv=$('#revChart'); const ctx=cv.getContext('2d'); const W=cv.width=cv.offsetWidth*2||600,H=cv.height=320;
  ctx.clearRect(0,0,W,H); const max=Math.max(...S.rev);
  S.rev.forEach((v,i)=>{ const bw=W/7*0.55,x=W/7*i+W/7*0.22,h=v/max*(H-40); const g=ctx.createLinearGradient(0,H-h,0,H); g.addColorStop(0,'#a855f7'); g.addColorStop(1,'#22d3ee'); ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x,H-h-10,bw,h,12); ctx.fill(); });
}
function renderOrders(){
  $$('#orderTabs button').forEach(b=>{ b.classList.toggle('active',b.dataset.tab===S.orderTab); b.onclick=()=>{S.orderTab=b.dataset.tab;save();renderOrders();}; });
  const map={bought:S.orders,sold:S.sold,bookings:S.bookings};
  const list=map[S.orderTab]||[];
  $('#ordersList').innerHTML=list.map(o=>`<div class="list-row"><div class="thumb">${o.kind==='bookings'?'📅':'📦'}</div>
    <div class="grow"><b>${esc(o.title||o.coach)}</b><span>${o.id} • ${o.date||o.when} ${o.qty?`• ×${o.qty}`:''} ${o.dur?`• ${o.dur}`:''}</span></div>
    <b>${money(o.total)}</b><span class="tag ${o.status==='Delivered'||o.status==='Paid out'?'ok':'warn'}">${o.status}</span></div>`).join('')||'<div class="muted">Nothing here yet.</div>';
}
function renderWallet(){
  updateWalletUI();
  $('#walletBig').textContent=ec(S.user.balance);
  $('#txList').innerHTML=S.txs.map(t=>`<div class="list-row"><div class="thumb">${t.k==='in'?'💰':'💸'}</div><div class="grow"><b>${esc(t.t)}</b><span>${t.d}</span></div><b style="color:${t.a>0?'var(--green)':'var(--txt)'}">${t.a>0?'+':''}${money(t.a).replace('$-','−$')}</b></div>`).join('');
}
function updateWalletUI(){ $('#walletBalanceTop').textContent=ec(S.user.balance); $('#walletBalanceHero').textContent=`${ec(S.user.balance)} ≈ ${money(S.user.balance)}`; }
$('#addFundsBtn').onclick=()=>openModal(`<h3>Add funds</h3><div class="row2"><button class="btn primary" onclick="addFunds(100)">+$100</button><button class="btn primary" onclick="addFunds(500)">+$500</button></div><div class="row2" style="margin-top:8px"><button class="btn" onclick="addFunds(50)">+$50</button><button class="btn" onclick="closeModal()">Cancel</button></div><p class="muted small">Instant • No fee • Visa ••4242</p>`);
window.addFunds=n=>{S.user.balance+=n;S.txs.unshift({t:`Added funds — Visa ••4242`,a:n,d:'Today',k:'in'});save();closeModal();renderWallet();toast(`+${ec(n)} added ⚡`);};
$('#payoutBtn').onclick=()=>openModal(`<h3>Cash out to bank ••6789</h3><p class="muted">Arrives in 2 business days. No fee over $50.</p><label>Amount (EC)<input id="payoutAmt" type="number" value="200" min="10" max="${S.user.balance}" /></label><button class="btn primary block" onclick="doPayout()">Withdraw →</button>`);
window.doPayout=()=>{const n=Number($('#payoutAmt').value); if(n>S.user.balance||n<10) return toast('Invalid amount'); S.user.balance-=n; S.txs.unshift({t:'Cash out — Bank ••6789',a:-n,d:'Today',k:'out'}); save(); closeModal(); renderWallet(); toast('Payout on the way 🏦');};
$('#transferBtn').onclick=()=>openModal(`<h3>Send EC to a friend</h3><label>Recipient<input placeholder="@username or email" /></label><label>Amount<input id="sendAmt" type="number" value="25" min="1" /></label><button class="btn primary block" onclick="doSend()">Send →</button>`);
window.doSend=()=>{const n=Number($('#sendAmt').value); if(n>S.user.balance) return toast('Insufficient balance'); S.user.balance-=n; S.txs.unshift({t:'Sent EC to friend',a:-n,d:'Today',k:'out'}); save(); closeModal(); renderWallet(); toast('Sent! ⚡');};
$('#resetDemo').onclick=()=>{S=seed();save();renderAll();toast('Demo data reset');};
$('#userBtn').onclick=()=>openModal(`<h3>${esc(S.user.name)}</h3><p class="muted">${esc(S.user.email)} • Member since ${S.user.memberSince}</p><div class="list-row"><div class="grow"><b>Seller level: Gold</b><span>4.9 rating • 98% on-time</span></div><span class="tag ok">Verified</span></div><button class="btn block" onclick="closeModal()">Close</button>`);

/* ---------- init ---------- */
function renderAll(){ renderMarket(); renderCoaches(); renderSell(); renderWallet(); renderOrders(); renderDashboard(); }
renderAll();
