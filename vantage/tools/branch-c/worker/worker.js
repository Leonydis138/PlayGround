/**
 * Branch C Worker - only needed once a paid Pro version exists.
 * Free tier: 100k req/day. Two endpoints:
 *  1. GET  /api/config        - Paddle env IDs for the calculator page
 *  2. POST /webhooks/paddle   - signature-verified; writes a ledger entry
 *     back to the repo via the GitHub API (Accountant agent picks it up)
 * No PII stored; no database. Deploy: npx wrangler deploy
 *
 * Safety notes:
 * - HMAC comparison is constant-time. Never use === on a signature: an
 *   attacker can learn the expected value one byte at a time from timing.
 * - The webhook refuses to run without PADDLE_WEBHOOK_SECRET set (otherwise
 *   HMAC'ing against the literal string "undefined" would produce a real
 *   signature an attacker could reproduce).
 * - The webhook only accepts transaction.completed. Paddle also retries
 *   failed/updated events; writing a ledger entry for those would book
 *   revenue that was never collected.
 * - The ledger file is per-transaction (paddle-<id>.json). A fixed filename
 *   would clobber every sale after the first, and Paddle's retries would
 *   silently lose money records. If the same event fires twice, the second
 *   PUT fails (GitHub needs a sha to update) and is swallowed - the weekly
 *   reconcile catches that case.
 * - The event id is checked against a timestamp window so a captured
 *   webhook cannot be replayed days later to forge a signature.
 * - Amounts are normalised from Paddle's minor units (cents) to major units.
 *   The currency is recorded, not converted - FX is the Accountant's job.
 */
const MAX_SIGNATURE_AGE_SECONDS = 300; // 5 minutes

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/config' && request.method === 'GET') {
      return Response.json({
        paddleMode: env.PADDLE_MODE || 'sandbox',
        clientToken: env.PADDLE_CLIENT_TOKEN || null,
        proPriceId: env.PADDLE_PRO_PRICE_ID || null
      });
    }

    if (url.pathname === '/webhooks/paddle' && request.method === 'POST') {
      if (!env.PADDLE_WEBHOOK_SECRET || !env.GH_PAT || !env.GH_REPO) {
        return new Response('webhook not configured', { status: 500 });
      }

      const raw = await request.text();
      const sig = request.headers.get('Paddle-Signature') || '';
      const ts = (sig.match(/ts:(\d+)/) || [])[1];
      const got = (sig.match(/h1:([a-f0-9]+)/) || [])[1];
      if (!ts || !got) return new Response('bad signature', { status: 401 });

      // Replay window: a signature older than the window is refused even
      // though it is cryptographically valid.
      const age = Math.abs(Date.now() / 1000 - Number(ts));
      if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) {
        return new Response('signature outside the accepted time window', { status: 401 });
      }

      const expected = await hmac(`${ts}:${raw}`, env.PADDLE_WEBHOOK_SECRET);
      if (!safeEqual(got, expected)) return new Response('bad signature', { status: 401 });

      let event;
      try { event = JSON.parse(raw); }
      catch { return new Response('bad payload', { status: 400 }); }

      if (event.event_type === 'transaction.completed' && event.data && event.data.id) {
        const entry = {
          date: new Date().toISOString().slice(0, 10),
          branch: 'branch-c',
          type: 'revenue',
          source: `Paddle - ${(event.data.custom_data && event.data.custom_data.plan) || 'pro'}`,
          amount: Number((event.data.totals && event.data.totals.total) || 0) / 100,
          currency: event.data.currency_code || 'USD',
          reference: event.data.id
        };
        // Sanitise the transaction id before it becomes a path segment.
        const txId = String(event.data.id).replace(/[^A-Za-z0-9_-]/g, '');
        if (!txId) return new Response('bad transaction id', { status: 400 });
        const path = `data/ledger/paddle-${txId}.json`;
        await fetch(`https://api.github.com/repos/${env.GH_REPO}/contents/${path}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.GH_PAT}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'vantage-branch-c-worker'
          },
          body: JSON.stringify({
            message: `paddle: pro sale ${txId}`,
            content: b64utf8(JSON.stringify(entry, null, 2))
          })
        }).catch(() => {}); // log-only; the weekly reconcile catches drops
      }
      return new Response('ok');
    }

    return new Response('not found', { status: 404 });
  }
};

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string compare - standard Workers pattern. Do not "optimise"
// this back to ===.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// btoa() only accepts Latin-1; run the string through UTF-8 bytes first so a
// product name or plan label with any non-ASCII character doesn't 500 us.
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}