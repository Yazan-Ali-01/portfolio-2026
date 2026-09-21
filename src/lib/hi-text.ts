/**
 * The small amount of /hi wall logic that both sides need to agree on.
 *
 * Kept apart from hi-guards.ts on purpose: this file ships to the browser, so
 * it must not carry the blocklist. Publishing the list of words you filter is
 * a recipe for working out what gets through.
 */

/** One line, not a paragraph. Long enough for a real sentence, short enough to read at a glance. */
export const MAX_MESSAGE = 140;

/** A first name, not a bio. */
export const MAX_NAME = 24;

/** What an unsigned line is published as. */
export const ANON = 'Anonymous';

/** How many lines the wall shows at once. */
export const WALL_SIZE = 60;

/**
 * 1st, 2nd, 3rd, 4th — and the exception that catches everyone: 11th, 12th and
 * 13th take "th" despite ending in 1, 2 and 3.
 */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** A shape both the endpoint and the browser build the wall from. */
export interface WallLine {
  id: string;
  /** The scan number of whoever left it, so a line and a screenshot can be matched up. */
  n: number;
  name: string;
  text: string;
  /** Unix milliseconds. Formatted in the browser, in the reader's own zone. */
  at: number;
}
