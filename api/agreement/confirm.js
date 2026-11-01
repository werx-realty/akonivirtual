import { addDays, fmtDate, money } from '../../lib/contract.js';
import { send, loadRecord, saveRecord, stripe, sendEmail, emailShell, esc, AKONI_EMAIL } from '../_lib/util.js';

const todayPT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

export default async function handler(req, res) {
  const { id, session_id } = req.query;
  const rec = await loadRecord(id);
  if (!rec) return send(res, 404, { error: 'Agreement not found.' });
  if (rec.payment?.status === 'paid') return send(res, 200, { paid: true, id: rec.id, commencementDate: rec.commencementDate || rec.startDate });
  if (!session_id) return send(res, 400, { error: 'Missing payment session.' });
  try {
    const s = await stripe(`checkout/sessions/${encodeURIComponent(session_id)}`, { 'expand[]': 'payment_intent' }, 'GET');
    if (s.metadata?.agreement_id !== rec.id) return send(res, 400, { error: 'This payment does not match the agreement.' });
    if (s.payment_status !== 'paid') return send(res, 402, { error: 'Payment has not completed yet.' });

    // Section 4.4: keep the full one-week Setup Period even if the setup fee is paid late.
    const minStart = addDays(todayPT(), 7);
    const commence = rec.startDate >= minStart ? rec.startDate : minStart;
    const anchorISO = commence; // first $500 charged on the Service Commencement Date
    const pm = s.payment_intent?.payment_method;
    const customer = s.customer;
    let subscriptionId = null, subError = null;
    try {
      await stripe(`customers/${customer}`, { invoice_settings: { default_payment_method: pm } });
      const price = await stripe('prices', { currency: 'usd', unit_amount: 50000, recurring: { interval: 'month' }, product_data: { name: 'Akoni Virtual — Full-Time VA (monthly)' } });
      const anchor = Math.floor(Date.parse(anchorISO + 'T15:00:00Z') / 1000); // 7–8am Pacific, before the VA starts
      const sub = await stripe('subscriptions', {
        customer, default_payment_method: pm, items: { 0: { price: price.id } },
        billing_cycle_anchor: anchor, proration_behavior: 'none',
        metadata: { agreement_id: rec.id, term_months: rec.term }, description: `Akoni Virtual agreement ${rec.id}`,
      });
      subscriptionId = sub.id;
    } catch (e) { subError = e.message; }

    rec.commencementDate = commence;
    rec.payment = { status: 'paid', sessionId: s.id, customer, amount: s.amount_total, paidAt: new Date().toISOString(), subscriptionId, firstRecurring: anchorISO, subscriptionError: subError };
    const e = await sendEmail({ to: AKONI_EMAIL, subject: `Payment received — ${rec.agent.agentName} (${rec.id})`,
      html: emailShell('Payment received', `<p>${esc(rec.agent.agentName)} paid the ${money(s.amount_total / 100)} setup fee. Card saved for monthly billing.</p>
      <p>Service starts ${fmtDate(commence)}. First $500 is charged ${fmtDate(anchorISO)}, then monthly${subscriptionId ? '' : ' — <b>subscription was NOT created automatically: ' + esc(subError) + '</b>'}.</p>`) });
    rec.emails.push({ at: new Date().toISOString(), type: 'payment', akoni: e });
    await saveRecord(rec);
    send(res, 200, { paid: true, id: rec.id, commencementDate: commence });
  } catch (err) { send(res, 502, { error: err.message }); }
}
