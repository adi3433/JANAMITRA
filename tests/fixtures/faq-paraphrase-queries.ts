export interface FaqParaphraseQuery {
  id: number;
  domain: string;
  query: string;
  expectedAnyKeywords: string[];
}

export const FAQ_PARAPHRASE_QUERIES: FaqParaphraseQuery[] = [
  {
    id: 1,
    domain: 'nomination',
    query: 'How many people can go with the candidate into the RO room while filing nomination papers?',
    expectedAnyKeywords: ['only 4 persons', 'returning officer', 'nomination papers'],
  },
  {
    id: 2,
    domain: 'nomination',
    query: 'Can someone other than candidate or proposer submit nomination form on their behalf?',
    expectedAnyKeywords: ['either by the candidate himself', 'any of his proposers', 'cannot be presented by any other person'],
  },
  {
    id: 3,
    domain: 'nomination',
    query: 'Is it valid to send nomination by email or fax?',
    expectedAnyKeywords: ['cannot be sent by post', 'fax or e-mail', 'nomination cannot be sent'],
  },
  {
    id: 4,
    domain: 'nomination',
    query: 'Can a candidate cancel withdrawal notice after submitting it?',
    expectedAnyKeywords: ['withdrawal of candidature', 'cannot be revoked', 'no option or discretion'],
  },
  {
    id: 5,
    domain: 'nomination',
    query: 'Is taking oath on scrutiny day acceptable for nomination?',
    expectedAnyKeywords: ['before the date fixed for scrutiny', 'oath or affirmation', 'cannot be so made and subscribed on the date of scrutiny'],
  },
  {
    id: 6,
    domain: 'registration',
    query: 'I turned 18 recently. Which form do I use for fresh voter enrolment?',
    expectedAnyKeywords: ['form 6', 'new voter registration', '18'],
  },
  {
    id: 7,
    domain: 'registration',
    query: 'What papers are needed for first-time voter registration application?',
    expectedAnyKeywords: ['proof of age', 'proof of address', 'passport-size photograph'],
  },
  {
    id: 8,
    domain: 'registration',
    query: 'I shifted address; which form handles voter details correction?',
    expectedAnyKeywords: ['form 8', 'address change', 'corrections and updates'],
  },
  {
    id: 9,
    domain: 'roll_lookup',
    query: 'How can I verify if my name exists in electoral roll?',
    expectedAnyKeywords: ['electoral search', 'name in the voter list', 'electoral roll'],
  },
  {
    id: 10,
    domain: 'roll_lookup',
    query: 'Can I check voter record using EPIC number?',
    expectedAnyKeywords: ['epic number', 'electoralsearch.eci.gov.in', 'voter id'],
  },
  {
    id: 11,
    domain: 'voting_rules',
    query: 'If I do not have EPIC card, can I still vote with another id?',
    expectedAnyKeywords: ['accepted photo id', 'alternative ids', 'epic'],
  },
  {
    id: 12,
    domain: 'voting_rules',
    query: 'Please tell polling opening and closing time and last voter rule.',
    expectedAnyKeywords: ['7:00 am', '6:00 pm', 'last voter rule'],
  },
  {
    id: 13,
    domain: 'voting_rules',
    query: 'Explain what happens after pressing button in EVM with VVPAT.',
    expectedAnyKeywords: ['vvpat', '7 seconds', 'electronic voting machines'],
  },
  {
    id: 14,
    domain: 'voting_rules',
    query: 'What things are banned inside polling station on poll day?',
    expectedAnyKeywords: ['prohibited items', 'mobile phones', 'silence period'],
  },
  {
    id: 15,
    domain: 'complaint',
    query: 'How do I report poll code violation quickly with evidence?',
    expectedAnyKeywords: ['cvigil', 'photo/video', '100 minutes'],
  },
  {
    id: 16,
    domain: 'complaint',
    query: 'Is there any way to submit election complaint without app?',
    expectedAnyKeywords: ['helpline 1950', 'offline complaint', 'returning officer'],
  },
  {
    id: 17,
    domain: 'timeline',
    query: 'Have the Kerala 2026 election notification and nomination dates been announced?',
    expectedAnyKeywords: ['not yet been announced', 'currently tba', 'nomination'],
  },
  {
    id: 18,
    domain: 'timeline',
    query: 'When does model code of conduct become active and end?',
    expectedAnyKeywords: ['model code of conduct', 'from the date of election announcement', 'results are declared'],
  },
  {
    id: 19,
    domain: 'booth',
    query: 'How to find my exact polling station in Kottayam district?',
    expectedAnyKeywords: ['electoral search portal', 'polling booth', 'kottayam'],
  },
  {
    id: 20,
    domain: 'booth',
    query: 'What are the assembly constituencies in Kottayam for 2026?',
    expectedAnyKeywords: ['vaikom', 'changanassery', 'kaduthuruthy'],
  },
];
