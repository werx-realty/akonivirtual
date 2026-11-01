import { send, isAdmin, loadRecord, readFile } from '../_lib/util.js';
export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: 'Wrong admin key.' });
  const rec = await loadRecord(req.query.id);
  if (!rec) return send(res, 404, { error: 'Not found.' });
  const name = rec.status === 'executed' ? 'executed.pdf' : 'agent-signed.pdf';
  const buf = await readFile(rec.id, name);
  if (!buf) return send(res, 404, { error: 'PDF not found.' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Akoni-Virtual-Agreement-${rec.id}-${name}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(buf);
}
