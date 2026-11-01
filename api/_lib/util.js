import crypto from 'node:crypto';
import { put, get, list } from '@vercel/blob';

export const AKONI_EMAIL = process.env.AKONI_EMAIL || 'akonivirtual@gmail.com';
export const FROM_EMAIL = process.env.RESEND_FROM || 'Akoni Virtual <agreements@akonivirtual.com>';

export const config = () => ({
  live: process.env.AGREEMENT_LIVE === 'true',
  payments: !!process.env.STRIPE_SECRET_KEY,
  email: !!process.env.RESEND_API_KEY,
  storage: !!process.env.BLOB_READ_WRITE_TOKEN,
});

export function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.json(body);
}

export function origin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'unknown';
}

export function newId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `AV-${d}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

export function isAdmin(req) {
  const key = process.env.ADMIN_KEY || '';
  const got = String(req.headers['x-admin-key'] || '');
  if (!key || got.length !== key.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(key));
}

/* ---------- storage (private Vercel Blob) ---------- */
const base = id => `agreements/${id}`;

export async function saveFile(id, name, body, contentType) {
  return put(`${base(id)}/${name}`, body, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true });
}
export async function readFile(id, name) {
  const r = await get(`${base(id)}/${name}`, { access: 'private', useCache: false });
  if (!r) return null;
  const chunks = [];
  for await (const c of r.stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}
export async function saveRecord(rec) {
  rec.updatedAt = new Date().toISOString();
  await saveFile(rec.id, 'record.json', JSON.stringify(rec, null, 2), 'application/json');
  return rec;
}
export async function loadRecord(id) {
  if (!/^AV-\d{8}-[0-9A-F]{10}$/.test(String(id))) return null;
  const buf = await readFile(id, 'record.json');
  return buf ? JSON.parse(buf.toString('utf8')) : null;
}
export async function listRecords() {
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix: 'agreements/', cursor, limit: 1000 });
    for (const b of r.blobs) if (b.pathname.endsWith('/record.json')) out.push(b.pathname.split('/')[1]);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const recs = await Promise.all(out.map(id => loadRecord(id).catch(() => null)));
  return recs.filter(Boolean).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/* ---------- email (Resend) ---------- */
export async function sendEmail({ to, subject, html, attachments = [] }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], reply_to: AKONI_EMAIL, subject, html,
      attachments: attachments.map(a => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') })),
    }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, id: j.id } : { ok: false, error: j.message || `Resend error ${r.status}` };
}

export function emailShell(title, bodyHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f5f9;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e7ee">
    <div style="background:#0a0d14;padding:18px 24px;border-bottom:3px solid #1f6bff">
      <span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:.08em">AKONI VIRTUAL</span>
    </div>
    <div style="padding:24px;color:#1b2333;font-size:15px;line-height:1.6">
      <h2 style="margin:0 0 12px;font-size:20px;color:#0a0d14">${title}</h2>${bodyHtml}
      <p style="margin-top:24px;color:#6b7588;font-size:13px">Questions? Reply to this email or write to ${AKONI_EMAIL}.</p>
    </div>
  </div></div>`;
}
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- payments (Stripe REST) ---------- */
function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
export async function stripe(path, params, method = 'POST') {
  const url = `https://api.stripe.com/v1/${path}` + (method === 'GET' && params ? `?${form(params)}` : '');
  const r = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : form(params || {}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Stripe error ${r.status}`);
  return j;
}

export async function createCheckout(rec, req) {
  const o = origin(req);
  const s = await stripe('checkout/sessions', {
    mode: 'payment',
    customer_email: rec.agent.email,
    customer_creation: 'always',
    client_reference_id: rec.id,
    metadata: { agreement_id: rec.id },
    payment_intent_data: { setup_future_usage: 'off_session', metadata: { agreement_id: rec.id }, description: `Akoni Virtual agreement ${rec.id}` },
    line_items: [
      { quantity: 1, price_data: { currency: 'usd', unit_amount: 30000, product_data: { name: 'One-time setup fee (1-week setup)', description: `Agreement ${rec.id}. Your card is saved for the $500 monthly fee, first charged on your service start date.` } } },
    ],
    success_url: `${o}/agreement.html?done=${rec.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${o}/agreement.html?pay=${rec.id}`,
  });
  return s.url;
}
