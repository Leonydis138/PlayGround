# Empower — Virtual Economy Marketplace

A production-style marketplace demo where you can **buy, sell, coach, teach, and earn**.
Static HTML/CSS/JS — no build step, no framework, no server dependency.

![19 views, responsive from 320px to 1920px](https://img.shields.io/badge/views-19-a855f7)
![67 self-tests passing](https://img.shields.io/badge/self--tests-67%20passing-34d399)
![PWA offline-ready](https://img.shields.io/badge/PWA-offline--ready-22d3ee)

---

## Ownership

| | |
| --- | --- |
| **Owner & CEO** | **Juan-louw Greyling** |
| **Email** | [juanlouw.greyling@gmail.com](mailto:juanlouw.greyling@gmail.com) |
| **Version** | 9.0.0 |

© 2026 Juan-louw Greyling. All rights reserved.

---

## Quick start

```bash
./start.sh              # serves on http://localhost:3000
# or
python3 -m http.server 3000
```

Open <http://localhost:3000>. No install, no bundler.

### Demo accounts

All demo passwords are `empower123`:

| Email | Name | Focus |
| --- | --- | --- |
| `jordan@empower.app` | Jordan Doe | General seller |
| `maya@empower.app` | Maya Atelier | Leather goods studio |
| `alex@empower.app` | Alex Morgan | E-commerce coach |
| `priya@empower.app` | Priya Nair | Fitness coach |

You can also sign up fresh — new accounts start with **750 EC**.

---

## What's inside

**19 views** — marketplace, deals, auctions, services, learn, events, coaches,
community, sell, become-a-coach, dashboard, orders, inbox, people, profile,
rewards, wishlist, wallet, settings.

### Commerce
- Search with **typo tolerance**, grouped results, match highlighting, and "did you mean"
- Filters, sorting, saved searches, price-drop alerts, compare, bundles
- Product variants, reviews with rating breakdowns, Q&A, offers
- Auctions with live countdowns, gigs, courses, events, coaching bookings
- Full checkout: addresses, delivery slots, coupons, gift cards, Plus discounts
- Orders with tracking, invoices, returns, and disputes

### Selling
- Seller Studio with bulk edit, duplicate, pause, restock
- **Analytics computed live** from your data: 30-day revenue with sparklines,
  conversion funnel, revenue by category, repeat-buyer retention, top listings
- CSV export of analytics
- Seller tiers (Bronze → Platinum) with real fee rates

### Social & community
- Public profiles, follow graph, stories, posts, comments, polls
- Direct messages, support threads, notifications
- Wishlist **collections** with shareable links (`#wishlist?s=…`)

### Platform engineering
- **PBKDF2-SHA256** password hashing (150,000 iterations) via WebCrypto
- **Signed session tokens** (`uid.exp.sig`) with constant-time verification and expiry
- Login throttling (6 attempts / 60s)
- Resilient storage layer — survives quota exhaustion and corrupted JSON
- Offline action queue with reconnect flush
- **63 self-tests** runnable in-browser (`Settings → Run self-tests`, or `runSelfTests()` in the console)

### Accessibility
- Semantic landmarks, labelled views, ARIA tabs on navigation
- Focus traps in modals and drawers, focus restoration on close
- Roving tabindex + arrow-key navigation on nav, tabs, and card grids
- Live regions for announcements, skip link, visible focus rings
- Respects `prefers-reduced-motion` and `prefers-contrast`

---

## Storage model

| Key | Contents |
| --- | --- |
| `empower_state_v5` | Shared marketplace (products, gigs, coaches, posts) |
| `empower_users_v9` | Account records, each with a private profile slice |
| `empower_session_v9` | Signed session token |
| `empower_queue_v9` | Pending offline actions |
| `empower_secret_v9` | Local token-signing secret |

The **marketplace is shared**; each account's **wallet, cart, orders, wishlist,
messages and settings are private**. Private keys are enumerated in `PRIVATE_KEYS`.

> ⚠️ **This is a client-side demo, not production auth.** Everything lives in
> `localStorage` on one device. Real multi-user accounts require a backend with
> server-side authorization — do not put real money or real personal data here.

---

## Architecture notes

- `index.html` — all 19 views, plus auth, drawers, and overlay roots
- `app.js` — state, storage, auth, analytics, search, and every interaction
- `styles.css` — design system, responsive rules, accessibility, animation
- `sw.js` — **network-first** service worker with offline fallback
- `manifest.json` — installable PWA metadata

State is a single `S` object: the shared platform with the current user's private
slice overlaid. `save()` persists both halves.

### Testing

```bash
node --check app.js       # syntax
```

In-browser:

```js
await runSelfTests()      // grouped results + console output
```

The suite covers password hashing, session tampering/expiry, storage corruption
recovery, cart and discount math, escrow debits, rewards, search ranking and typo
tolerance, the analytics funnel invariants, wishlist collections, seller tiers,
and cross-user data isolation. Tests snapshot and restore state, and mute toasts
so they never disturb the UI.

---

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `Ctrl`/`Cmd` + `K` | Command palette |
| `Esc` | Close overlay / drawer / modal |
| `←` `→` `↑` `↓` | Navigate nav tabs and card grids |
| `Tab` | Cycles focus; trapped inside open modals and drawers |

---

## License

© 2026 Juan-louw Greyling. All rights reserved.

Demo project. Created with [OMGithub](https://omgithub.com).