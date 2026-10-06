import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const dataFile = path.join(dataDir, 'enquiries.json');
const PORT = process.env.PORT || 3002;
const MAX_BODY = 16 * 1024;
const MAX_POSTS_PER_MIN = 8;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};
const STATUS_VALUES = new Set(['new', 'in-review', 'quoted', 'closed']);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RX = /^[A-Za-z0-9-]+$/;
const SECRET_RX = /password\s*[:=]|passwd|api[_-]?key\s*[:=]|access[_-]?key|secret\s*[:=]|-----BEGIN [A-Z ]*PRIVATE KEY-----/i;

const hits = new Map();

function readQueue() {
  try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return []; }
}
function writeQueue(q) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dataFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(q, null, 2));
  fs.renameSync(tmp, dataFile);
}
function send(res, code, body, type = 'application/json') {
  res.writeHead(code, {
    'content-type': type,
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin'
  });
  res.end(Buffer.isBuffer(body) ? body : typeof body === 'string' ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); return; }
      body += c;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
function rateLimitOk(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= MAX_POSTS_PER_MIN) return false;
  arr.push(now);
  hits.set(ip, arr);
  return true;
}
function sanitize(v, max) { return String(v ?? '').trim().slice(0, max); }

async function handleEnquiries(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[2];

  if (req.method === 'GET' && parts.length === 2) {
    return send(res, 200, readQueue().slice().reverse());
  }
  if (req.method === 'POST' && parts.length === 2) {
    if (!rateLimitOk(req.socket.remoteAddress)) return send(res, 429, { error: 'Too many submissions — please wait a minute.' });
    let data;
    try { data = JSON.parse(await readBody(req) || '{}'); }
    catch (e) { return send(res, e.code === 413 ? 413 : 400, { error: 'Invalid JSON body.' }); }
    if (data.company_website) return send(res, 204, '');
    const name = sanitize(data.name, 120);
    const email = sanitize(data.email, 254);
    const message = sanitize(data.message, 5000);
    if (!name) return send(res, 400, { error: 'Name is required.' });
    if (!EMAIL_RX.test(email)) return send(res, 400, { error: 'A valid email address is required.' });
    if (message.length < 20) return send(res, 400, { error: 'Please describe the issue in at least 20 characters.' });
    if (SECRET_RX.test(message + ' ' + name)) return send(res, 422, { error: 'Remove passwords, keys or tokens before submitting.' });
    const q = readQueue();
    const entry = {
      id: 'VARS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
      name, email, message, note: '', status: 'new',
      at: new Date().toISOString()
    };
    q.push(entry);
    writeQueue(q);
    return send(res, 201, { ok: true, id: entry.id, note: 'Enquiry queued. No automated reply. No contract created.' });
  }
  if (req.method === 'PATCH' && parts.length === 3 && ID_RX.test(id)) {
    let data;
    try { data = JSON.parse(await readBody(req) || '{}'); }
    catch { return send(res, 400, { error: 'Invalid JSON body.' }); }
    const q = readQueue();
    const i = q.findIndex(e => e.id === id);
    if (i === -1) return send(res, 404, { error: 'Not found.' });
    if (data.status !== undefined) {
      if (!STATUS_VALUES.has(data.status)) return send(res, 400, { error: 'Invalid status.' });
      q[i].status = data.status;
    }
    if (data.note !== undefined) q[i].note = sanitize(data.note, 1000);
    writeQueue(q);
    return send(res, 200, q[i]);
  }
  if (req.method === 'DELETE' && parts.length === 3 && ID_RX.test(id)) {
    const q = readQueue();
    const i = q.findIndex(e => e.id === id);
    if (i === -1) return send(res, 404, { error: 'Not found.' });
    q.splice(i, 1);
    writeQueue(q);
    return send(res, 200, { ok: true });
  }
  return send(res, 405, { error: 'Method not allowed.' });
}

const BLOCKED = new Set(['/server.js', '/data', '/.env', '/.gitignore', '/package.json', '/package-lock.json', '/node_modules']);
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  if (p === '/favicon.ico') p = '/favicon.svg';
  if (BLOCKED.has(p)) return send(res, 403, 'Forbidden', 'text/plain');
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || file.startsWith(dataDir)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (e, d) => {
    if (e) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, d, MIME[path.extname(file)] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return send(res, 200, { ok: true, count: readQueue().length, time: new Date().toISOString() });
  }
  if (url.pathname.startsWith('/api/enquiries')) return handleEnquiries(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  serveStatic(req, res, url);
});
server.listen(PORT, () => console.log(`VANTAGE-ARS on http://localhost:${PORT}`));
