import { termDetails, fmtDate } from '../../lib/contract.js';
import { buildAgreementPdf } from '../_lib/pdf.js';
import { send, isAdmin, loadRecord, saveRecord, saveFile, sendEmail, emailShell, esc, origin, clientIp, AKONI_EMAIL, config } from '../_lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Wrong admin key.' });
  const b = req.body || {};
  const rec = await loadRecord(b.id);
  if (!rec) return send(res, 404, { error: 'Agreement not found.' });
  const resend = b.resendOnly === true;
  if (!resend) {
    if (rec.status === 'executed') return send(res, 409, { error: 'Already countersigned.' });
    const name = String(b.name || '').trim(), title = String(b.title || '').trim();
    if (!name || !title) return send(res, 400, { error: 'Enter your name and title.' });
    if (!/^data:image\/png;base64,/.test(String(b.signature || ''))) return send(res, 400, { error: 'Please draw your signature.' });
    const now = new Date();
    rec.provider = { name, title, signature: b.signature, signedAt: now.toISOString(), signedAtLocal: now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long', timeStyle: 'long' }), ip: clientIp(req) };
    rec.status = 'executed'; rec.executedAt = now.toISOString(); rec.live = config().live && rec.live;
  } else if (rec.status !== 'executed') return send(res, 409, { error: 'Not executed yet.' });

  const pdf = await buildAgreementPdf(rec, { baseUrl: origin(req), executed: true });
  await saveFile(rec.id, 'executed.pdf', pdf, 'application/pdf');
  const T = termDetails(rec.term, rec.commencementDate || rec.startDate);
  const file = { filename: `Akoni-Virtual-Agreement-${rec.id}-executed.pdf`, content: pdf };
  const body = `<p>Hi ${esc(rec.agent.agentName)},</p><p>Your Akoni Virtual Virtual Assistant Services Agreement is now fully executed. A signed copy is attached for your records.</p>
    <p><b>Agreement ID:</b> ${rec.id}<br><b>Term:</b> ${T.label}<br><b>Service start:</b> ${fmtDate(T.startISO)}<br><b>Term ends:</b> ${fmtDate(T.endISO)}</p>`;
  const e1 = await sendEmail({ to: rec.agent.email, subject: `Executed agreement — Akoni Virtual (${rec.id})`, html: emailShell('Your agreement is fully executed', body), attachments: [file] });
  const e2 = await sendEmail({ to: AKONI_EMAIL, subject: `Executed — ${rec.agent.agentName} (${rec.id})`, html: emailShell('Agreement fully executed', body), attachments: [file] });
  rec.emails.push({ at: new Date().toISOString(), type: resend ? 'executed_resend' : 'executed', agent: e1, akoni: e2 });
  await saveRecord(rec);
  send(res, 200, { ok: true, emailedAgent: e1.ok, emailedAkoni: e2.ok, emailError: e1.ok ? null : e1.error });
}
