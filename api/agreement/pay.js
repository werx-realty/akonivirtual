import { send, loadRecord, createCheckout, config } from '../_lib/util.js';
export default async function handler(req, res) {
  if (!config().payments) return send(res, 503, { error: 'Online payment is not set up yet. Akoni Virtual will email you a payment link.' });
  const rec = await loadRecord(req.query.id);
  if (!rec) return send(res, 404, { error: 'Agreement not found.' });
  if (rec.payment?.status === 'paid') return send(res, 200, { paid: true });
  try { send(res, 200, { checkoutUrl: await createCheckout(rec, req) }); }
  catch (e) { send(res, 502, { error: e.message }); }
}
