import type { APIRoute } from 'astro';
import { vcard } from '../content/hi';

/**
 * The contact card itself, at /hi.vcf.
 *
 * It is a route rather than a file in public/ for one reason: everything in it
 * is validated when the site is built, so the card cannot ship with an empty
 * field. A file sitting in public/ would have no such check.
 *
 * The build writes this to dist/hi.vcf, and the .vcf extension is what gets it
 * served as text/vcard. That content type is the whole trick: it is what makes
 * a phone open the card in Contacts instead of showing it as text.
 */
export const GET: APIRoute = () => new Response(vcard);
