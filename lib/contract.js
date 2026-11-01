// Akoni Virtual — Virtual Assistant Services Agreement
// Single source of truth: the signing page and the PDF are both built from this file.
// Bump CONTRACT_VERSION whenever the wording changes.

export const CONTRACT_VERSION = '2026.11-r1';

export const PROVIDER = {
  name: 'Akoni Virtual',
  email: 'akonivirtual@gmail.com',
  website: 'https://akonivirtual.com',
};

export const PRICING = { setupFee: 300, monthlyFee: 500, hoursPerWeek: 35, earlyTerminationMonths: 2, setupDays: 7 };

export const FIELDS = [
  ['agentName', 'Full legal name'],
  ['licenseNumber', 'Real estate license number'],
  ['licenseState', 'State of licensure'],
  ['brokerage', 'Brokerage name'],
  ['brokerName', 'Supervising broker’s name'],
  ['address', 'Business address'],
  ['phone', 'Phone number'],
  ['email', 'Email address'],
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function toISO(dt) { return dt.toISOString().slice(0, 10); }
export function addMonths(iso, n) {
  const d = parseISO(iso);
  const day = d.getUTCDate();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(day, last));
  return toISO(t);
}
export function addDays(iso, n) { const d = parseISO(iso); d.setUTCDate(d.getUTCDate() + n); return toISO(d); }
export function fmtDate(iso) {
  if (!iso) return '__________';
  const d = parseISO(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
export const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function termDetails(term, startISO) {
  const months = Number(term) === 12 ? 12 : 6;
  const endISO = startISO ? addDays(addMonths(startISO, months), -1) : '';
  const recurring = [];
  for (let i = 0; i < months; i++) recurring.push(startISO ? addMonths(startISO, i) : '');
  return {
    months,
    label: months === 12 ? 'Twelve (12) months' : 'Six (6) months',
    startISO, endISO, recurring,
    total: PRICING.setupFee + PRICING.monthlyFee * months,
    earlyFee: Math.min(PRICING.earlyTerminationMonths, months) * PRICING.monthlyFee,
  };
}

/* ------------------------------------------------------------------ */
/* Contract body. Blocks: {n, t} numbered clause, {p} paragraph,       */
/* {h} sub-heading, {ul:[...]} bullet list, {caps} emphasised clause.  */
/* ------------------------------------------------------------------ */
export function buildContract(a = {}) {
  const v = k => (a[k] && String(a[k]).trim()) || '____________________';
  const T = termDetails(a.term, a.startDate);
  const P = PRICING;
  const sched = T.recurring.length ? T.recurring.map(fmtDate).join('; ') : '__________';

  return [
    { num: '1', title: 'Parties and Definitions', blocks: [
      { n: '1.1', t: `This Virtual Assistant Services Agreement (the “Agreement”) is entered into by and between ${PROVIDER.name}, a business offering administrative virtual assistant services, reachable at ${PROVIDER.email} and ${PROVIDER.website} (“Akoni Virtual” or “Provider”), and the real estate licensee identified below (the “Agent” or “Client”). Akoni Virtual and the Agent are each a “Party” and together the “Parties.”` },
      { h: 'Agent information' },
      { ul: [
        `Full legal name: ${v('agentName')}`,
        `Real estate license number: ${v('licenseNumber')}`,
        `State of licensure: ${v('licenseState')}`,
        `Brokerage: ${v('brokerage')}`,
        `Supervising broker: ${v('brokerName')}`,
        `Business address: ${v('address')}`,
        `Phone: ${v('phone')}`,
        `Email: ${v('email')}`,
      ] },
      { n: '1.2', t: 'Definitions. In this Agreement:' },
      { ul: [
        '“Services” means the administrative virtual assistant services described in Section 2.',
        '“VA” means the virtual assistant (or assistants) assigned by Akoni Virtual to perform the Services.',
        '“Licensed Activity” means any act that requires a real estate license under applicable law, including California Business and Professions Code Section 10131 and related regulations of the California Department of Real Estate (“DRE”).',
        '“Supervising Broker” means the licensed real estate broker responsible for supervising the Agent under applicable law.',
        '“Platform” means the Akoni VA Command Center and related agent portal, client portal, lead pipeline, transaction tracker and reporting dashboard.',
        '“Client Data” means all information the Agent provides or that Akoni Virtual accesses in performing the Services, including information about the Agent’s clients, leads, transactions, contacts, login credentials and business records.',
        '“Effective Date” means the date this Agreement is signed by both Parties.',
        '“Service Commencement Date” means the start date selected by the Agent in Section 5, subject to Section 4.4.',
        '“Initial Term” means the six-month or twelve-month period selected in Section 5.',
        '“Monthly Fee” and “Setup Fee” have the meanings given in Section 4.',
      ] },
    ] },

    { num: '2', title: 'Service Description', blocks: [
      { n: '2.1', t: 'Akoni Virtual agrees to provide administrative virtual assistant services to support the Agent’s real estate business, performed at the Agent’s direction and within the limits of Section 6. The Services may include:' },
      { h: 'Lead management' },
      { ul: ['Lead follow-up using scripts and procedures approved by the Agent', 'Approved phone calls, text messages and emails', 'Lead database organization', 'CRM management', 'Appointment scheduling', 'Lead nurturing', 'Follow-up reminders'] },
      { h: 'Listing support' },
      { ul: ['Administrative listing preparation', 'Organizing listing information supplied by the Agent', 'Scheduling photography', 'Scheduling appointments', 'Coordinating administrative tasks'] },
      { h: 'Transaction administration' },
      { ul: ['Tracking transaction milestones', 'Tracking inspection and appraisal appointments', 'Escrow and title follow-ups of an administrative nature', 'Administrative communication', 'Organizing transaction records', 'Monitoring upcoming dates and deadlines', 'Providing administrative status updates'] },
      { h: 'Daily operations' },
      { ul: ['Calendar management', 'Client appointment confirmations', 'Daily activity reporting', 'CRM updates', 'Client portal updates', 'Administrative follow-up'] },
      { h: 'Technology' },
      { ul: ['Access to the Akoni VA Command Center', 'Agent portal', 'Client portal', 'Lead pipeline', 'Transaction tracking', 'Reporting dashboard'] },
      { n: '2.2', t: 'All Services are administrative and organizational. Any task that would constitute Licensed Activity is excluded from the Services, whether or not it appears in the list above, and is governed by Section 6.' },
      { n: '2.3', t: 'Platform access is provided for the Agent’s internal business use during the term of this Agreement. Akoni Virtual retains all rights in the Platform. The Agent retains all rights in Client Data.' },
    ] },

    { num: '3', title: 'Service Hours', blocks: [
      { n: '3.1', t: `The Services include up to thirty-five (${P.hoursPerWeek}) hours of virtual assistant work per week.` },
      { n: '3.2', t: 'The Agent and Akoni Virtual will establish the VA’s working schedule, time zone and response expectations during onboarding. Services are provided according to that agreed operating schedule, which may be updated by mutual written agreement (email is sufficient).' },
      { n: '3.3', t: 'Unused hours do not roll over to a later week or month and are not refundable.' },
      { n: '3.4', t: 'Additional hours or services outside the scope of this Agreement require the Agent’s written approval in advance and may involve additional fees, which Akoni Virtual will state in writing before the work is performed.' },
      { n: '3.5', t: 'Akoni Virtual may assign a qualified replacement or backup VA during absences, holidays or staffing changes, and will notify the Agent of any change in the primary assigned VA.' },
    ] },

    { num: '4', title: 'Pricing and Payment', blocks: [
      { n: '4.1', t: `Setup Fee. The Agent will pay a one-time setup fee of ${money(P.setupFee)} (the “Setup Fee”), due upon signing this Agreement. The Setup Fee covers onboarding, system configuration, portal setup, workflow configuration and initial VA preparation, which takes approximately one (1) week (the “Setup Period”). The Service Commencement Date may not be earlier than seven (7) days after signing. The Setup Fee is non-refundable once onboarding work has begun.` },
      { n: '4.2', t: `Monthly Fee. The Agent will pay a monthly service fee of ${money(P.monthlyFee)} (the “Monthly Fee”). The first Monthly Fee is due on the Service Commencement Date, after the Setup Period and before the VA begins providing Services. Each subsequent Monthly Fee is due in advance on the monthly anniversary of the Service Commencement Date.` },
      { n: '4.3', t: `Payment schedule for this Agreement: Setup Fee of ${money(P.setupFee)} due at signing; Monthly Fees of ${money(P.monthlyFee)} due on ${sched}. Total fees for the Initial Term: ${money(T.total)}.` },
      { n: '4.4', t: 'Service commencement. Services begin on the Service Commencement Date, provided the Setup Fee has been received and the first Monthly Fee has been successfully charged. If the Setup Fee is received late, the Service Commencement Date moves so that the full Setup Period is preserved; if the first Monthly Fee cannot be charged, it moves to the first business day after that payment is received. Later due dates follow the adjusted Service Commencement Date.' },
      { n: '4.5', t: 'Recurring payment authorization. The Agent authorizes Akoni Virtual, through its payment processor (currently Stripe), to charge the payment method the Agent provides for the Setup Fee, the first Monthly Fee, each subsequent Monthly Fee on its due date, and any other fees the Agent approves in writing under this Agreement. This authorization remains in effect until this Agreement ends and all amounts due have been paid. The Agent may update the payment method at any time by contacting Akoni Virtual.' },
      { n: '4.6', t: 'Late or failed payments. If a payment is not received within five (5) days after its due date, Akoni Virtual may suspend the Services after giving the Agent written notice by email, until the overdue amount is paid. Suspension does not reduce amounts owed and does not extend the Initial Term.' },
      { n: '4.7', t: 'Fees are fixed. Fees under this Agreement are fixed service fees. They are not commissions and are not contingent on the outcome, closing or compensation of any real estate transaction.' },
      { n: '4.8', t: 'Taxes. Fees are stated exclusive of any applicable sales, use or similar taxes, which the Agent is responsible for if they apply. Each Party is responsible for its own income taxes.' },
      { n: '4.9', t: 'Monthly Fees are non-refundable and are not prorated for partial months, except as required by law or as stated in Section 11.' },
    ] },

    { num: '5', title: 'Term, Renewal and Minimum Commitment', blocks: [
      { n: '5.1', t: 'Minimum commitment. The minimum commitment under this Agreement is six (6) months. This Agreement cannot be entered into for a period shorter than six (6) months.' },
      { n: '5.2', t: `Selected Initial Term: ${a.term ? T.label : '[Six (6) months] or [Twelve (12) months]'}.` },
      { ul: [
        `Service Commencement Date: ${fmtDate(a.startDate)}`,
        `Initial Term expiration date: ${fmtDate(T.endISO)}`,
        `Setup Fee due: at signing (setup takes about one week)`,
        `Monthly payment dates during the Initial Term: ${sched}`,
      ] },
      { n: '5.3', t: 'Renewal. When the Initial Term ends, this Agreement continues on a month-to-month basis at the then-current Monthly Fee unless either Party gives the other written notice of nonrenewal at least thirty (30) days before the end of the Initial Term. During any month-to-month period, either Party may end this Agreement by giving at least thirty (30) days’ written notice, effective at the end of the paid monthly period in which the notice period ends. No early termination fee applies to a month-to-month period.' },
      { n: '5.4', t: 'Fee changes on renewal. Akoni Virtual may change the Monthly Fee for any month-to-month renewal period by giving the Agent at least thirty (30) days’ written notice. The Monthly Fee will not change during the Initial Term.' },
      { n: '5.5', t: 'Written notice under this Section may be given by email to the addresses in Section 1 and Section 14.' },
    ] },

    { num: '6', title: 'California Real Estate License Compliance', blocks: [
      { caps: 'IMPORTANT: AKONI VIRTUAL PROVIDES ADMINISTRATIVE VIRTUAL ASSISTANT SERVICES ONLY. AKONI VIRTUAL AND ITS VIRTUAL ASSISTANTS ARE NOT ACTING AS LICENSED CALIFORNIA REAL ESTATE AGENTS OR BROKERS UNDER THIS AGREEMENT.' },
      { n: '6.1', t: 'The VA is not authorized to perform any Licensed Activity. Nothing in this Agreement authorizes, requests or requires the VA to do so.' },
      { n: '6.2', t: 'The VA will not:' },
      { ul: [
        'Sign any real estate contract on behalf of the Agent',
        'Sign purchase agreements',
        'Sign listing agreements',
        'Sign addendums or amendments',
        'Prepare or complete California real estate disclosure forms',
        'Complete Transfer Disclosure Statements',
        'Complete Seller Property Questionnaires',
        'Complete Natural Hazard Disclosure forms',
        'Complete any other legally required seller or buyer disclosure',
        'Negotiate contracts or transaction terms',
        'Recommend contract terms',
        'Provide legal advice',
        'Provide real estate advice',
        'Interpret contractual obligations',
        'Make decisions on behalf of buyers or sellers',
        'Handle escrow funds, deposits or any client money',
        'Perform any activity prohibited to unlicensed assistants under California law',
      ] },
      { n: '6.3', t: 'Permitted activities. The VA may perform administrative scheduling, tracking, communication and organizational tasks permitted for unlicensed assistants, under the direction and supervision of the responsible real estate licensee.' },
      { n: '6.4', t: 'Agent responsibility. The Agent remains solely responsible for all legally required disclosures, contracts, signatures, negotiations, compliance determinations and all Licensed Activity.' },
      { n: '6.5', t: 'Broker supervision. The Supervising Broker retains responsibility for supervision of the Agent and the Agent’s business activities as required by applicable law, including California Business and Professions Code Section 10159.2 and DRE regulations.' },
      { n: '6.6', t: 'Statutory compliance. Both Parties will comply with California Business and Professions Code Section 10130 (which prohibits acting as a real estate broker or salesperson without a license) and Section 10137 (which prohibits a licensee from employing or compensating an unlicensed person for acts requiring a license), together with applicable DRE regulations and guidance on unlicensed assistants.' },
      { n: '6.7', t: 'Right and duty to decline. If any requested assignment would require a real estate license or would violate applicable law, the VA must decline that assignment and notify the Agent. Declining such an assignment is not a breach of this Agreement and does not reduce any fee.' },
      { n: '6.8', t: 'Communications compliance. The Agent is responsible for ensuring that leads and contacts the VA is asked to call, text or email have given any consent required by law, and for providing approved scripts and opt-out procedures. The VA will follow the Agent’s do-not-contact lists and will honor opt-out requests it receives.' },
      { n: '6.9', t: 'Licenses in other states. If the Agent is licensed outside California, the Agent will inform Akoni Virtual of any additional restrictions on unlicensed assistants under the law of the Agent’s state, and the VA will observe them.' },
    ] },

    { num: '7', title: 'Client Responsibilities', blocks: [
      { n: '7.1', t: 'The Agent agrees to:' },
      { ul: [
        'Maintain an active real estate license where required',
        'Maintain appropriate brokerage affiliation',
        'Provide clear instructions to the VA',
        'Provide approved scripts and communication procedures',
        'Provide necessary system access, using individual logins where possible',
        'Maintain appropriate supervision of the VA’s work',
        'Review all legally significant documents personally',
        'Personally handle all contracts and disclosures',
        'Personally handle all negotiations',
        'Make all professional real estate decisions',
        'Maintain responsibility for client representation',
        'Ensure all business practices comply with applicable laws',
        'Provide timely information and approvals',
      ] },
      { n: '7.2', t: 'The Agent is responsible for the accuracy of information and instructions provided to the VA, and for the content of any communication the Agent approves.' },
    ] },

    { num: '8', title: 'Confidentiality and Data Protection', blocks: [
      { n: '8.1', t: 'Akoni Virtual will maintain reasonable administrative, technical and physical safeguards to protect Client Data, including client information, agent databases, transaction information, contact information, login credentials, business records and confidential communications.' },
      { n: '8.2', t: 'Separation. The Agent’s Client Data will be kept separate from the data of other Akoni Virtual clients and will not be shared with any other agent.' },
      { n: '8.3', t: 'Use limits. Akoni Virtual and its VAs will use Client Data only to perform the Services. Neither Akoni Virtual nor its VAs will sell, share or disclose Client Data for any unrelated purpose. To the extent applicable, Akoni Virtual will act as a service provider under the California Consumer Privacy Act and will process personal information only on the Agent’s behalf and for the business purposes in this Agreement.' },
      { n: '8.4', t: 'Authorized access. Access to Client Data is limited to the assigned VA and Akoni Virtual personnel who need it to perform or support the Services. Each such person is bound by confidentiality obligations at least as protective as this Section.' },
      { n: '8.5', t: 'Credentials. Login credentials provided by the Agent will be stored securely, used only for the Services and never shared outside Akoni Virtual. The Agent may change or revoke credentials at any time.' },
      { n: '8.6', t: 'Incident notification. Akoni Virtual will notify the Agent without undue delay, and in any case within seventy-two (72) hours after becoming aware, of any unauthorized access to or disclosure of Client Data, and will cooperate reasonably to contain and remedy the incident.' },
      { n: '8.7', t: 'Return or deletion. Within thirty (30) days after this Agreement ends, Akoni Virtual will return Client Data to the Agent in a commonly used format on request, and then delete it from its systems, except where retention is required by law. The Agent and the Supervising Broker remain responsible for keeping transaction records as required by law, including California Business and Professions Code Section 10148.' },
      { n: '8.8', t: 'Confidentiality obligations survive the end of this Agreement for three (3) years, and indefinitely for login credentials and personal information.' },
    ] },

    { num: '9', title: 'Independent Service Provider', blocks: [
      { n: '9.1', t: 'This Agreement is a business-to-business services agreement between Akoni Virtual and the Agent as a business client.' },
      { n: '9.2', t: 'Nothing in this Agreement creates an employment, partnership, joint venture or agency relationship between Akoni Virtual (or any VA) and the Agent.' },
      { n: '9.3', t: 'The VA is assigned, managed and compensated through Akoni Virtual. Akoni Virtual is solely responsible for its own VA staffing, compensation, taxes and service delivery arrangements. The Agent will not pay any VA directly.' },
    ] },

    { num: '10', title: 'Service Limitations', blocks: [
      { n: '10.1', t: 'Akoni Virtual does not guarantee a specific number of leads, appointments, transactions or closings, or any specific amount of income.' },
      { n: '10.2', t: 'The Services provide administrative support and operational assistance. The Agent remains responsible for business results and professional decisions.' },
      { n: '10.3', t: 'Akoni Virtual will perform the Services in a professional and workmanlike manner. Except as stated in this Agreement, the Services and the Platform are provided “as is,” and Akoni Virtual disclaims all other warranties to the extent permitted by law.' },
    ] },

    { num: '11', title: 'Termination', blocks: [
      { n: '11.1', t: 'Expiration. This Agreement ends at the end of the Initial Term if either Party has given timely notice of nonrenewal under Section 5.3; otherwise it continues month-to-month as stated there.' },
      { n: '11.2', t: 'Mutual termination. The Parties may end this Agreement at any time by mutual written agreement.' },
      { n: '11.3', t: 'Material breach. Either Party may terminate this Agreement by written notice if the other Party materially breaches it and does not cure the breach within fifteen (15) days after receiving written notice describing it. If the Agent terminates for Akoni Virtual’s uncured material breach, no early termination fee applies and Akoni Virtual will refund any prepaid Monthly Fee for the period after the termination date.' },
      { n: '11.4', t: 'Failure to pay. Akoni Virtual may terminate this Agreement by written notice if any payment remains unpaid for fifteen (15) days after written notice of non-payment.' },
      { n: '11.5', t: 'Repeated noncompliance. Akoni Virtual may terminate this Agreement by written notice if the Agent repeatedly requests that the VA perform Licensed Activity or other unlawful acts after being notified under Section 6.7.' },
      { n: '11.6', t: 'Immediate suspension. Either Party may immediately suspend access to systems or Client Data where reasonably necessary to protect Client Data, prevent a security incident or comply with law, and will promptly notify the other Party.' },
      { n: '11.7', t: `Early termination by the Agent. The Agent may end this Agreement before the end of the Initial Term, for any reason, by giving thirty (30) days’ written notice and paying an early termination fee equal to the lesser of (a) the Monthly Fees remaining for the balance of the Initial Term after the notice period, or (b) ${PRICING.earlyTerminationMonths} Monthly Fees (${money(T.earlyFee)} for this Agreement). The Parties agree that Akoni Virtual’s damages from early termination (including VA allocation, recruiting, training and onboarding costs) would be difficult to calculate, and that this fee is a reasonable estimate of those damages and not a penalty.` },
      { n: '11.8', t: 'Effect of termination. When this Agreement ends: (a) the Services and Platform access stop; (b) the Agent will remove or change any credentials shared with the VA, and Akoni Virtual will cease using them; (c) Client Data will be returned and deleted under Section 8.7; and (d) all fees accrued through the termination date, and any early termination fee that applies, remain payable.' },
      { n: '11.9', t: 'Sections 4 (as to amounts owed), 6.4, 8, 9, 10, 11.8, 13 and 14 survive the end of this Agreement.' },
    ] },

    { num: '12', title: 'Electronic Signatures and Records', blocks: [
      { n: '12.1', t: 'The Parties agree to conduct this transaction electronically. Electronic signatures and electronic records have the same legal effect as handwritten signatures and paper records, to the extent permitted by applicable law, including the federal Electronic Signatures in Global and National Commerce Act and the California Uniform Electronic Transactions Act (Civil Code Section 1633.1 and following).' },
      { n: '12.2', t: 'By signing electronically, the Agent affirmatively consents to doing business electronically, confirms the ability to access and keep a PDF copy of this Agreement, and may request a paper copy at any time by emailing ' + PROVIDER.email + '.' },
      { n: '12.3', t: 'The signature record includes each signer’s electronic signature, printed legal name, and the date and time signed, together with the Service Commencement Date and selected Initial Term. A digital fingerprint of the agreement text is recorded with each signature.' },
      { n: '12.4', t: 'When both Parties have signed, a completed PDF of this Agreement will be saved and a copy delivered to both Parties by email.' },
    ] },

    { num: '13', title: 'Governing Law and Venue', blocks: [
      { n: '13.1', t: 'This Agreement is governed by the laws of the State of California, without regard to its conflict-of-laws rules.' },
      { n: '13.2', t: 'Any dispute arising out of or relating to this Agreement will be brought in the state or federal courts of competent jurisdiction located in the State of California, and each Party consents to the jurisdiction of those courts. Before filing any claim, the Parties will try in good faith to resolve the dispute by written notice and discussion for at least thirty (30) days.' },
      { n: '13.3', t: 'The choice of California law in this Section is based on Akoni Virtual’s place of business. It does not affect any licensing or consumer-protection law that applies to the Agent because of the state where the Agent is licensed.' },
    ] },

    { num: '14', title: 'General Provisions', blocks: [
      { n: '14.1', t: `Limitation of liability. Except for a Party’s indemnity obligations, breach of Section 8, gross negligence, willful misconduct or the Agent’s payment obligations: (a) neither Party will be liable for indirect, incidental, special, consequential or lost-profit damages; and (b) each Party’s total liability under this Agreement will not exceed the fees paid or payable by the Agent in the three (3) months before the event giving rise to the claim.` },
      { n: '14.2', t: 'Indemnification. The Agent will defend and indemnify Akoni Virtual and its VAs against third-party claims arising from the Agent’s Licensed Activity, the Agent’s instructions, the content of communications the Agent approves, or the Agent’s violation of law. Akoni Virtual will defend and indemnify the Agent against third-party claims arising from Akoni Virtual’s breach of Section 8, gross negligence or willful misconduct.' },
      { n: '14.3', t: `Notices. Notices under this Agreement must be in writing and may be sent by email to Akoni Virtual at ${PROVIDER.email} and to the Agent at the email address in Section 1. Notice is effective when sent, unless the sender receives an error message.` },
      { n: '14.4', t: 'Assignment. Neither Party may assign this Agreement without the other’s written consent, except that Akoni Virtual may assign it to a successor to its business on written notice.' },
      { n: '14.5', t: 'Force majeure. Neither Party is liable for delay or failure caused by events beyond its reasonable control (other than payment obligations), provided it gives prompt notice and uses reasonable efforts to resume performance.' },
      { n: '14.6', t: 'Entire agreement; amendments. This Agreement is the entire agreement between the Parties about its subject and replaces all prior proposals and discussions. It may be amended only in a writing signed (including electronically) by both Parties.' },
      { n: '14.7', t: 'Severability; waiver. If any provision is found unenforceable, it will be enforced to the maximum extent permitted and the rest of this Agreement will remain in effect. A failure to enforce a provision is not a waiver.' },
      { n: '14.8', t: 'Counterparts; headings. This Agreement may be signed in counterparts, including electronically. Headings are for convenience only.' },
      { n: '14.9', t: 'Contract activation. This Agreement becomes effective upon execution by both Parties. Service commencement occurs on the Service Commencement Date, after the one-week Setup Period and subject to receipt of the Setup Fee and first Monthly Fee under Section 4.4.' },
    ] },
  ];
}

export function contractPlainText(a) {
  const out = ['AKONI VIRTUAL', 'VIRTUAL ASSISTANT SERVICES AGREEMENT', 'Version ' + CONTRACT_VERSION, ''];
  for (const s of buildContract(a)) {
    out.push(`SECTION ${s.num} — ${s.title.toUpperCase()}`);
    for (const b of s.blocks) {
      if (b.h) out.push(b.h);
      else if (b.ul) b.ul.forEach(x => out.push('- ' + x));
      else if (b.caps) out.push(b.caps);
      else out.push((b.n ? b.n + ' ' : '') + b.t);
    }
    out.push('');
  }
  return out.join('\n');
}

export const ACKNOWLEDGEMENTS = [
  'I understand Akoni Virtual provides administrative virtual assistant services only, and the VA is not a licensed real estate agent or broker under this Agreement.',
  'I understand the VA will not sign, prepare or complete contracts, addendums or disclosure forms, negotiate, give legal or real estate advice, or handle escrow funds or client money.',
  'I remain solely responsible for all disclosures, contracts, signatures, negotiations and licensed activity, and my supervising broker retains supervision responsibility.',
  'I will not ask the VA to perform any act that requires a real estate license, and I understand the VA must decline any such request (California Business and Professions Code Sections 10130 and 10137).',
];

export const PAYMENT_ACKS = [
  'I agree to the $300 Setup Fee due today and the $500 Monthly Fee as stated in Section 4, with the first $500 charged on my Service Commencement Date after the one-week setup.',
  'I authorize Akoni Virtual, through its payment processor, to charge my payment method for the Setup Fee today and for each Monthly Fee on its due date, starting on my Service Commencement Date.',
  'I understand that after the Initial Term this Agreement continues month-to-month unless either party gives 30 days’ written notice of nonrenewal.',
  'I understand that ending the Agreement early during the Initial Term carries the early termination fee described in Section 11.7.',
];

export const ESIGN_CONSENT = 'I consent to conduct this transaction electronically and to sign this Agreement with an electronic signature, which has the same legal effect as a handwritten signature. I can access and keep a PDF copy of this Agreement, and I can request a paper copy at any time by emailing akonivirtual@gmail.com.';
