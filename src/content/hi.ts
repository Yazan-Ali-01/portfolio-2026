import { meta } from './meta';

/* ---------------------------------------------------------------------------
   The shirt page (/hi).

   Destination for the QR printed on the back of a t-shirt. The reader is a
   stranger on a phone, one-handed, with about fifteen seconds. Everything the
   page and the vCard say comes from this file, so the two can never disagree.
   --------------------------------------------------------------------------- */

/**
 * The one switch. Flip it and the status line and the action wording follow.
 * Nothing branches in the markup: both states are strings in COPY below.
 */
export const AVAILABLE = true;

/**
 * Everything that goes into a stranger's address book. `phone` is international
 * digits only, no `+` and no spaces, because wa.me takes exactly that form and
 * the vCard adds its own `+`.
 */
const CONTACT = {
  first: 'Yazan',
  last: 'Ali',
  title: 'Software Engineer',
  phone: '971528556635',
  email: meta.email,
  linkedin: meta.linkedin,
  website: meta.siteUrl,
};

/**
 * This runs while the page is being built, so a missing field fails the build
 * instead of shipping a contact card with holes in it.
 */
for (const [field, value] of Object.entries(CONTACT)) {
  if (!value.trim()) {
    throw new Error(
      `/hi: the vCard field "${field}" is empty. Fill it in src/content/hi.ts — ` +
        `a card with an empty field is worse than no card.`,
    );
  }
}

if (!/^[0-9]{8,15}$/.test(CONTACT.phone)) {
  throw new Error(
    `/hi: phone is "${CONTACT.phone}". It must be international digits only, ` +
      `no "+", no spaces, no dashes — wa.me rejects anything else.`,
  );
}

export const contact = CONTACT;

/** Where the reader has just come from, so the saved card still makes sense in a month. */
const NOTE = 'Software engineer in Dubai. You scanned the QR on my shirt.';

/**
 * vCard 3.0, not 4.0: it is the version iOS Contacts and Android Contacts both
 * import without argument. CRLF line endings are what the spec asks for.
 *
 * The LinkedIn profile goes in twice on purpose. `URL` is the portable field
 * that Android keeps, and `X-SOCIALPROFILE` is what puts it in the LinkedIn row
 * on iOS rather than in a second generic website field.
 */
export const vcard =
  [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${CONTACT.last};${CONTACT.first};;;`,
    `FN:${CONTACT.first} ${CONTACT.last}`,
    `TITLE:${CONTACT.title}`,
    `TEL;TYPE=CELL,VOICE:+${CONTACT.phone}`,
    `EMAIL;TYPE=INTERNET,PREF:${CONTACT.email}`,
    `URL:${CONTACT.website}`,
    `URL:${CONTACT.linkedin}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${CONTACT.linkedin}`,
    `NOTE:${NOTE}`,
    'END:VCARD',
  ].join('\r\n') + '\r\n';

/*
 * The stack, grouped the way the description reads: the interface, then what
 * is behind it, then what it runs on. The grouping is the point. A flat list
 * says "knows some tools"; three layers say "builds the whole thing", which is
 * the actual claim.
 *
 * Each carries its own brand colour, used only as a marker. The words stay in
 * the page's palette, because eight saturated colours of text on a dark page
 * is confetti, while eight small marks read as a legend. Postgres and Next are
 * lightened from their official values, which are too dark to see here.
 */
export const stack = [
  { layer: 'interface', items: [
    { name: 'TypeScript', color: '#3178C6' },
    { name: 'React', color: '#61DAFB' },
    { name: 'Next.js', color: '#E8E8E8' },
  ] },
  { layer: 'services', items: [
    { name: 'NestJS', color: '#E0234E' },
    { name: 'PostgreSQL', color: '#5B8DD9' },
    { name: 'Redis', color: '#FF4438' },
  ] },
  { layer: 'platform', items: [
    { name: 'AWS', color: '#FF9900' },
    { name: 'Docker', color: '#2496ED' },
  ] },
];

/** Flat, for the one sentence a screen reader should hear. */
export const stackNames = stack.flatMap((row) => row.items.map((i) => i.name));

/** Prefilled so the first message costs one tap and no typing. */
export const whatsappHref = `https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(
  'Hi Yazan, I scanned your shirt.',
)}`;

/**
 * Both states of every string, chosen once. The page reads these; it never asks
 * whether AVAILABLE is true.
 */
export const copy = AVAILABLE
  ? {
      status: 'Open to senior and lead roles',
      primary: 'Save my contact',
      primaryNote: 'Phone, email and LinkedIn, straight into your phone',
      whatsapp: 'WhatsApp me',
    }
  : {
      status: 'Not looking right now',
      primary: 'Save my contact',
      primaryNote: 'Keep it for whenever you need a backend engineer',
      whatsapp: 'Say hello on WhatsApp',
    };
