import { FIELDS, CONTRACT_VERSION, contractPlainText, ACKNOWLEDGEMENTS, PAYMENT_ACKS, termDetails, fmtDate, money, addDays } from '../../lib/contract.js';
import { buildAgreementPdf } from '../_lib/pdf.js';
import { send, newId, sha256, clientIp, origin, saveRecord, saveFile, sendEmail, emailShell, esc, createCheckout, config, AKONI_EMAIL } from '../_lib/util.js';

const todayPT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
const nowPT = () => new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long', timeStyle: 'long' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  const cfg = config();
  if (!cfg.storage) return send(res, 503, { error: 'Agreement storage is not set up yet. Please contact akonivirtual@gmail.com.' });
  const b = req.body || {};
  const agent = {};
  for (const [k, label] of FIELDS) {
    const v = String(b.agent?.[k] ?? '').trim().slice(0, 200);
    if (!v) return send(res, 400, { error: `${label} is required.` });
    agent[k] = v;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agent.email)) return send(res, 400, { error: 'Enter a valid email address.' });
  const term = Number(b.term);
  if (![6, 12].includes(term)) return send(res, 400, { error: 'Select a 6-month or 12-month agreement.' });
  const start = String(b.startDate || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || start < addDays(todayPT(), 7) || start > addDays(todayPT(), 120))
    return send(res, 400, { error: 'Choose a start date at least 7 days from today (setup takes one week) and within 120 days.' });
  if (!Array.isArray(b.licensingAcks) || b.licensingAcks.length !== ACKNOWLEDGEMENTS.length || !b.licensingAcks.every(Boolean))
    return send(res, 400, { error: 'All California licensing acknowledgements are required.' });
  const initials = String(b.licensingInitials || '').trim().slice(0, 6);
  if (initials.length < 2) return send(res, 400, { error: 'Enter your initials for Section 6.' });
  if (!Array.isArray(b.paymentAcks) || b.paymentAcks.length !== PAYMENT_ACKS.length || !b.paymentAcks.every(Boolean))
    return send(res, 400, { error: 'All pricing and payment acknowledgements are required.' });
  if (b.esignConsent !== true) return send(res, 400, { error: 'Electronic signature consent is required.' });
  const typedName = String(b.typedName || '').trim();
  if (typedName.toLowerCase().replace(/\s+/g, ' ') !== agent.agentName.toLowerCase().replace(/\s+/g, ' '))
    return send(res, 400, { error: 'Your typed name must match your full legal name exactly.' });
  const sig = String(b.signature || '');
  if (!/^data:image\/png;base64,/.test(sig) || sig.length > 400000) return send(res, 400, { error: 'Please draw your signature.' });
  if (b.contractVersion !== CONTRACT_VERSION) return send(res, 409, { error: 'The agreement was updated. Please reload the page and review it again.' });

  const docText = contractPlainText({ ...agent, term, startDate: start });
  const docHash = sha256(docText);
  if (b.docHash && b.docHash !== docHash) return send(res, 409, { error: 'The agreement text did not match. Please reload the page and try again.' });

  const now = new Date();
  const rec = {
    id: newId(), createdAt: now.toISOString(), status: 'agent_signed', live: cfg.live,
    contractVersion: CONTRACT_VERSION, docHash, agent, term, startDate: start,
    licensingAcks: ACKNOWLEDGEMENTS, licensingInitials: initials, paymentAcks: PAYMENT_ACKS, esignConsent: true,
    agentSignature: { typedName, signature: sig, signedAt: now.toISOString(), signedAtLocal: nowPT(), ip: clientIp(req), userAgent: String(req.headers['user-agent'] || '').slice(0, 300) },
    payment: { status: cfg.payments ? 'pending' : 'manual' }, emails: [],
  };
  await saveRecord(rec);
  const pdf = await buildAgreementPdf(rec, { baseUrl: origin(req), executed: false });
  await saveFile(rec.id, 'agent-signed.pdf', pdf, 'application/pdf');

  const T = termDetails(term, start);
  const name = `Akoni-Virtual-Agreement-${rec.id}-agent-signed.pdf`;
  const e1 = await sendEmail({ to: agent.email, subject: `Your Akoni Virtual agreement (${rec.id})`, attachments: [{ filename: name, content: pdf }],
    html: emailShell('We received your signed agreement', `<p>Hi ${esc(agent.agentName)},</p><p>Thank you for signing your Akoni Virtual Virtual Assistant Services Agreement. Your signed copy is attached.</p>
    <p><b>Term:</b> ${T.label}<br><b>Service start:</b> ${fmtDate(start)}<br><b>Fees:</b> ${money(300)} setup + ${money(500)}/month</p>
    <p>Setup takes about one week. Your first $500 monthly payment is charged on your service start date.</p><p>Next, Akoni Virtual will countersign, and you'll receive the fully executed agreement by email.</p>`) });
  const e2 = await sendEmail({ to: AKONI_EMAIL, subject: `New agreement signed — ${agent.agentName} (${rec.id})`, attachments: [{ filename: name, content: pdf }],
    html: emailShell('New agreement ready to countersign', `<p><b>${esc(agent.agentName)}</b> (${esc(agent.brokerage)}, ${esc(agent.licenseState)} license ${esc(agent.licenseNumber)}) signed a ${T.label.toLowerCase()} agreement starting ${fmtDate(start)}.</p>
    <p>Email: ${esc(agent.email)} · Phone: ${esc(agent.phone)}</p><p>Countersign at <a href="${origin(req)}/agreement-admin.html">${origin(req)}/agreement-admin.html</a>.</p>`) });
  rec.emails.push({ at: new Date().toISOString(), type: 'agent_signed', agent: e1, akoni: e2 });

  let checkoutUrl = null;
  if (cfg.payments) {
    try { checkoutUrl = await createCheckout(rec, req); } catch (e) { rec.payment.error = e.message; }
  }
  await saveRecord(rec);
  send(res, 200, { id: rec.id, checkoutUrl, pdf: pdf.toString('base64'), emailed: e1.ok, payments: cfg.payments });
}
