import { timingSafeEqual } from 'node:crypto';

/**
 * The one check behind the moderation page and the delete endpoint.
 *
 * Its own file rather than an export from the endpoint, so the page and the
 * route share the check without either importing the other's route module.
 */
export function keyMatches(given: string | null): boolean {
  const expected = process.env.HI_ADMIN_KEY ?? '';
  if (!expected || !given) return false;

  /*
   * Padded to a fixed width before comparing: timingSafeEqual throws outright
   * on a length mismatch, and answering "wrong length" faster than "wrong key"
   * hands over the length of the secret. The real length is then compared
   * separately, after the constant-time part has already run.
   */
  const encoder = new TextEncoder();
  const a = encoder.encode(given.padEnd(128, '\0').slice(0, 128));
  const b = encoder.encode(expected.padEnd(128, '\0').slice(0, 128));

  return timingSafeEqual(a, b) && given.length === expected.length;
}
