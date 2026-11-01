import { send, isAdmin, listRecords, config } from '../_lib/util.js';
export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: 'Wrong admin key.' });
  const recs = await listRecords();
  send(res, 200, { config: config(), agreements: recs.map(r => ({
    id: r.id, createdAt: r.createdAt, status: r.status, term: r.term, startDate: r.startDate, commencementDate: r.commencementDate,
    agent: r.agent, payment: r.payment, provider: r.provider ? { name: r.provider.name, title: r.provider.title, signedAtLocal: r.provider.signedAtLocal } : null,
    agentSignedAt: r.agentSignature?.signedAtLocal, emails: r.emails,
  })) });
}
