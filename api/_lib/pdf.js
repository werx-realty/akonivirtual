import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildContract, termDetails, fmtDate, money, CONTRACT_VERSION, ACKNOWLEDGEMENTS, PAYMENT_ACKS, ESIGN_CONSENT, PRICING } from '../../lib/contract.js';

const BLACK = rgb(0.04, 0.05, 0.08), INK = rgb(0.11, 0.14, 0.2), GREY = rgb(0.42, 0.46, 0.53);
const SILVER = rgb(0.82, 0.84, 0.88), BLUE = rgb(0.12, 0.42, 1), WHITE = rgb(1, 1, 1), RED = rgb(0.75, 0.1, 0.1);

// Standard PDF fonts only cover WinAnsi; replace anything else.
const OK = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''));
const clean = s => String(s ?? '').replace(/\r?\n/g, ' ').split('').map(c => {
  const k = c.charCodeAt(0);
  return (k >= 32 && k <= 126) || (k >= 160 && k <= 255) || OK.has(c) ? c : (c === '\t' ? ' ' : '?');
}).join('');

async function fetchLogo(baseUrl) {
  try { const r = await fetch(`${baseUrl}/images/akoni-logo-pdf.png`); if (r.ok) return new Uint8Array(await r.arrayBuffer()); } catch {}
  return null;
}

function dataUrlBytes(u) {
  const m = /^data:image\/png;base64,(.+)$/.exec(u || '');
  return m ? Buffer.from(m[1], 'base64') : null;
}

export async function buildAgreementPdf(rec, { baseUrl, executed }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Akoni Virtual — VA Services Agreement ${rec.id}`);
  doc.setAuthor('Akoni Virtual'); doc.setSubject('Virtual Assistant Services Agreement'); doc.setCreator('Akoni Virtual agreements');
  const F = await doc.embedFont(StandardFonts.Helvetica), FB = await doc.embedFont(StandardFonts.HelveticaBold);
  const FO = await doc.embedFont(StandardFonts.HelveticaOblique);
  const logoBytes = await fetchLogo(baseUrl);
  const logo = logoBytes ? await doc.embedPng(logoBytes).catch(() => null) : null;

  const W = 612, H = 792, M = 56, CW = W - M * 2;
  let page, y;
  const newPage = () => { page = doc.addPage([W, H]); y = H - 60; };
  const ensure = h => { if (y - h < 64) newPage(); };
  const wrap = (text, font, size, width) => {
    const words = clean(text).split(' '); const lines = []; let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(t, size) > width && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  };
  const para = (text, { font = F, size = 9.6, color = INK, indent = 0, gap = 5, lh = 1.42 } = {}) => {
    const lines = wrap(text, font, size, CW - indent);
    for (const l of lines) { ensure(size * lh); page.drawText(l, { x: M + indent, y, size, font, color }); y -= size * lh; }
    y -= gap;
  };

  // ---- Cover header
  newPage();
  page.drawRectangle({ x: 0, y: H - 128, width: W, height: 128, color: BLACK });
  page.drawRectangle({ x: 0, y: H - 131, width: W, height: 3, color: BLUE });
  if (logo) { const s = 92 / logo.height; page.drawImage(logo, { x: M - 4, y: H - 118, width: logo.width * s, height: 92 }); }
  page.drawText('AKONI VIRTUAL', { x: W - M - FB.widthOfTextAtSize('AKONI VIRTUAL', 18), y: H - 62, size: 18, font: FB, color: WHITE });
  const t2 = 'VIRTUAL ASSISTANT SERVICES AGREEMENT';
  page.drawText(t2, { x: W - M - F.widthOfTextAtSize(t2, 10), y: H - 80, size: 10, font: F, color: SILVER });
  const t3 = `Agreement ID ${rec.id}  ·  Version ${CONTRACT_VERSION}`;
  page.drawText(clean(t3), { x: W - M - F.widthOfTextAtSize(clean(t3), 8), y: H - 98, size: 8, font: F, color: GREY });
  y = H - 160;
  if (!rec.live) {
    page.drawRectangle({ x: M, y: y - 6, width: CW, height: 22, color: rgb(1, 0.95, 0.95), borderColor: RED, borderWidth: 0.6 });
    page.drawText('PRE-REVIEW DRAFT — pending review by a California real estate attorney and a business attorney.', { x: M + 8, y: y + 1, size: 8.5, font: FB, color: RED });
    y -= 34;
  }
  const T = termDetails(rec.term, rec.commencementDate || rec.startDate);
  const summary = [
    ['Agent', rec.agent.agentName], ['Brokerage', rec.agent.brokerage], ['License', `${rec.agent.licenseNumber} (${rec.agent.licenseState})`],
    ['Initial Term', T.label], ['Service Commencement', fmtDate(T.startISO)], ['Term Expires', fmtDate(T.endISO)],
    ['Fees', `${money(PRICING.setupFee)} setup + ${money(PRICING.monthlyFee)}/month`], ['Status', executed ? 'Fully executed' : 'Signed by Agent — awaiting Akoni Virtual countersignature'],
  ];
  page.drawRectangle({ x: M, y: y - 4 - 4 * 30, width: CW, height: 4 * 30 + 12, color: rgb(0.965, 0.97, 0.98), borderColor: SILVER, borderWidth: 0.6 });
  summary.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2), x = M + 12 + col * (CW / 2), yy = y - row * 30;
    page.drawText(k.toUpperCase(), { x, y: yy - 2, size: 6.8, font: FB, color: GREY });
    page.drawText(clean(v).slice(0, 52), { x, y: yy - 14, size: 9.4, font: FB, color: INK });
  });
  y -= 4 * 30 + 26;

  // ---- Body
  for (const s of buildContract({ ...rec.agent, term: rec.term, startDate: rec.commencementDate || rec.startDate })) {
    ensure(40); y -= 6;
    page.drawText(clean(`SECTION ${s.num}`), { x: M, y, size: 7.5, font: FB, color: BLUE }); y -= 13;
    page.drawText(clean(s.title.toUpperCase()), { x: M, y, size: 11.5, font: FB, color: BLACK }); y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.5, color: SILVER }); y -= 13;
    for (const b of s.blocks) {
      if (b.h) { ensure(20); y -= 2; para(b.h, { font: FB, size: 9.4, gap: 3 }); }
      else if (b.ul) for (const it of b.ul) {
        const lines = wrap(it, F, 9.4, CW - 26);
        lines.forEach((l, i) => { ensure(13.4); if (!i) page.drawText('•', { x: M + 12, y, size: 9.4, font: F, color: BLUE }); page.drawText(l, { x: M + 24, y, size: 9.4, font: F, color: INK }); y -= 13.4; });
        if (it === b.ul[b.ul.length - 1]) y -= 5;
      }
      else if (b.caps) { para(b.caps, { font: FB, size: 9.4, gap: 7 }); }
      else {
        const label = b.n ? b.n + '  ' : '';
        const lines = wrap(label + b.t, F, 9.6, CW);
        lines.forEach((l, i) => {
          ensure(13.6);
          if (i === 0 && label) { page.drawText(clean(b.n), { x: M, y, size: 9.6, font: FB, color: INK }); page.drawText(l.slice(label.length), { x: M + FB.widthOfTextAtSize(label, 9.6), y, size: 9.6, font: F, color: INK }); }
          else page.drawText(l, { x: M, y, size: 9.6, font: F, color: INK });
          y -= 13.6;
        });
        y -= 5;
      }
    }
  }

  // ---- Signature page
  newPage();
  page.drawText('SIGNATURES', { x: M, y, size: 7.5, font: FB, color: BLUE }); y -= 15;
  page.drawText('Execution of Agreement', { x: M, y, size: 15, font: FB, color: BLACK }); y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.5, color: SILVER }); y -= 18;
  para('This Agreement becomes effective upon execution by both Parties. Service commencement occurs on the Service Commencement Date, subject to receipt of the Setup Fee and first Monthly Fee.', { size: 9.4 });
  y -= 6;

  const sigBlock = async (heading, rows, sigUrl, h = 150) => {
    ensure(h + 10);
    const top = y;
    page.drawRectangle({ x: M, y: top - h, width: CW, height: h, borderColor: SILVER, borderWidth: 0.8, color: WHITE });
    page.drawRectangle({ x: M, y: top - 22, width: CW, height: 22, color: BLACK });
    page.drawText(heading, { x: M + 12, y: top - 15, size: 9, font: FB, color: WHITE });
    let yy = top - 40;
    const sx = M + CW - 220, sy = top - h + 34, maxW = sx - (M + 120) - 12;
    for (const [k, v] of rows) {
      page.drawText(k, { x: M + 12, y: yy, size: 7.6, font: FB, color: GREY });
      for (const l of wrap(v || '—', F, 9, maxW).slice(0, 2)) { page.drawText(l, { x: M + 120, y: yy, size: 9, font: F, color: INK }); yy -= 12; }
      yy -= 5;
    }
    page.drawLine({ start: { x: sx, y: sy }, end: { x: sx + 200, y: sy }, thickness: 0.8, color: INK });
    page.drawText('Signature', { x: sx, y: sy - 11, size: 7.4, font: F, color: GREY });
    const bytes = dataUrlBytes(sigUrl);
    if (bytes) {
      const img = await doc.embedPng(bytes).catch(() => null);
      if (img) { const sc = Math.min(196 / img.width, 70 / img.height); page.drawImage(img, { x: sx + 2, y: sy + 2, width: img.width * sc, height: img.height * sc }); }
    } else page.drawText('Awaiting signature', { x: sx + 4, y: sy + 8, size: 9, font: FO, color: GREY });
    y = top - h - 18;
  };

  const ps = rec.provider;
  await sigBlock('AKONI VIRTUAL — SERVICE PROVIDER', [
    ['Authorized Representative', ps?.name], ['Title', ps?.title], ['Date and time signed', ps ? ps.signedAtLocal : ''],
  ], ps?.signature);
  const ag = rec.agentSignature;
  await sigBlock('AGENT', [
    ['Full legal name', rec.agent.agentName], ['Brokerage', rec.agent.brokerage], ['License number', `${rec.agent.licenseNumber} (${rec.agent.licenseState})`],
    ['Date and time signed', ag.signedAtLocal], ['Commencement', fmtDate(T.startISO)], ['Initial Term', T.label],
  ], ag.signature, 186);

  // ---- Audit trail
  newPage();
  page.drawText('ELECTRONIC SIGNATURE RECORD', { x: M, y, size: 7.5, font: FB, color: BLUE }); y -= 15;
  page.drawText('Audit Trail', { x: M, y, size: 15, font: FB, color: BLACK }); y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.5, color: SILVER }); y -= 18;
  const kv = (k, v) => { ensure(14); page.drawText(k, { x: M, y, size: 7.8, font: FB, color: GREY }); const ls = wrap(v || '—', F, 8.8, CW - 150); ls.forEach((l, i) => { if (i) ensure(12); page.drawText(l, { x: M + 150, y, size: 8.8, font: F, color: INK }); y -= 12.4; }); y -= 3; };
  kv('Agreement ID', rec.id); kv('Contract version', rec.contractVersion);
  kv('Document fingerprint (SHA-256)', rec.docHash);
  kv('Agent signed', `${ag.signedAtLocal} · ${ag.signedAt}`); kv('Agent typed name', ag.typedName);
  kv('Agent IP address', ag.ip); kv('Agent device', ag.userAgent);
  kv('Agent initials (Section 6)', rec.licensingInitials);
  kv('Electronic consent', ESIGN_CONSENT);
  y -= 4; para('California licensing acknowledgements accepted by the Agent:', { font: FB, size: 8.8 });
  ACKNOWLEDGEMENTS.forEach(t => para('[x] ' + t, { size: 8.6, indent: 8, gap: 2 }));
  y -= 4; para('Pricing and payment acknowledgements accepted by the Agent:', { font: FB, size: 8.8 });
  PAYMENT_ACKS.forEach(t => para('[x] ' + t, { size: 8.6, indent: 8, gap: 2 }));
  y -= 4;
  kv('Payment status', rec.payment?.status === 'paid' ? `Paid ${money(rec.payment.amount / 100)} on ${rec.payment.paidAt} (Stripe ${rec.payment.sessionId})` : 'Not yet received');
  if (ps) { kv('Akoni Virtual countersigned', `${ps.signedAtLocal} · ${ps.signedAt}`); kv('Countersigned by', `${ps.name}, ${ps.title}`); }

  // ---- Footers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const f = clean(`Akoni Virtual · Virtual Assistant Services Agreement · ${rec.id}${rec.live ? '' : ' · PRE-REVIEW DRAFT'}`);
    p.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: 0.4, color: SILVER });
    p.drawText(f, { x: M, y: 28, size: 7, font: F, color: GREY });
    const pg = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pg, { x: W - M - F.widthOfTextAtSize(pg, 7), y: 28, size: 7, font: F, color: GREY });
  });
  return Buffer.from(await doc.save());
}
