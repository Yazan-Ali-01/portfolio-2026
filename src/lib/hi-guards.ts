import { MAX_MESSAGE, MAX_NAME } from './hi-text';

/* ---------------------------------------------------------------------------
   What a stranger is allowed to publish under someone else's name.

   The wall is live: a line is public the moment it is submitted, and this file
   is the only thing standing in front of it. It runs on the server and never
   ships to the browser, so the blocklist stays unpublished.

   Everything here is a pure function over a string, so it can be reasoned about
   and tested without a network or a database.
   --------------------------------------------------------------------------- */

export type Checked = { ok: true; value: string } | { ok: false; reason: string };

/**
 * Characters that exist to make two different strings look identical: zero-width
 * spaces, joiners, direction overrides, and the BOM. They are the standard way
 * to smuggle a blocked word past a filter, and no honest one-line message needs
 * one.
 */
const INVISIBLE = /[​-‏‪-‮⁠-⁤﻿]/g;

/** Control characters, including the newlines that would turn one line into several. */
const CONTROL = /[\u0000-\u001F\u007F]/g;

/**
 * Anything that reads as a link. The wall is a place to say something, not a
 * place to put a URL in front of everyone who scans the shirt — an open link
 * field on a public page is found by spammers within days of existing.
 *
 * Deliberately blunt: a bare "example.com" is caught by the second branch, and
 * a false positive on something like "node.js" costs a stranger one edit while
 * a false negative costs the page its credibility.
 */
const LINKY = [
  /\b(?:https?|ftp|mailto|data|javascript)\s*:/i,
  /\bwww\s*\./i,
  /\b[a-z0-9-]+\s*(?:\.|\(?dot\)?)\s*(?:com|net|org|io|co|ru|xyz|top|link|info|biz|shop|club|site|online|dev|ai|me)\b/i,
] as const;

/**
 * A long run of digits is a phone number, and nobody should post theirs to a
 * public wall — not even their own.
 *
 * Nine, not seven. A shorter threshold takes "2020-2024" with it, and being
 * told that a date range looks like a phone number is the kind of wrongness
 * that makes someone give up rather than rephrase.
 */
const PHONEY = /\d[\s.-]*(?:\d[\s.-]*){8,}/;

/**
 * Leetspeak folded back to letters before the blocklist runs, so "f*ck", "fu ck"
 * and "f4ck" are all measured as the same word. Applied only to the copy the
 * blocklist sees — the reader still gets exactly the characters they typed.
 */
const LEET: Record<string, string> = {
  '4': 'a', '@': 'a', '8': 'b', '(': 'c', '3': 'e', '6': 'g', '9': 'g',
  '1': 'i', '!': 'i', '|': 'i', '0': 'o', '5': 's', '$': 's', '7': 't', '+': 't',
};

/**
 * Slurs and sexual abuse, which is the whole of what this list is for. It is not
 * a profanity filter: "this is fucking great" is a compliment and goes up
 * untouched.
 *
 * Two lists, because one matching strategy cannot serve both halves.
 *
 * These are checked as bare substrings of the fully collapsed copy, so "f a g g
 * o t" and "n1gg3r" are caught along with the plain spelling. Every entry is a
 * string that cannot appear inside an innocent word, which is what earns it the
 * right to be matched that loosely.
 */
const BLOCKED_ANYWHERE = [
  'nigger', 'nigga', 'niglet', 'faggot', 'tranny', 'kike',
  'wetback', 'towelhead', 'raghead', 'childporn',
  'killyourself', 'killurself', 'kysyourself',
] as const;

/**
 * These cannot be matched that way, because each one lives inside an ordinary
 * English word: "rape" in grape and therapist, "spic" in suspicious, "pedo" in
 * torpedo, "paki" in Pakistani, "cunt" in Scunthorpe. Blocking a stranger for
 * writing "suspicious" is its own kind of failure, so they are matched as whole
 * words, with the specific endings each one actually takes.
 *
 * The trade is deliberate and understood: spacing out an ambiguous word will
 * get past this, and the alternative refuses honest sentences every day to stop
 * an attack that arrives once.
 */
const BLOCKED_WORDS = [
  /\brap(?:e|es|ed|ing|ist|ists)\b/,
  /\bped(?:o|os|ophile|ophiles)\b/,
  /\bspics?\b/,
  /\bchinks?\b/,
  /\bgooks?\b/,
  /\bpakis?\b/,
  /\bcunts?\b/,
  /\bwhores?\b/,
  /\bsluts?\b/,
  /\bretard(?:s|ed|ing)?\b/,
] as const;

/** Lowercased, leet folded, and stripped of everything that is not a letter. */
function fold(value: string): string {
  const lowered = value.toLowerCase();
  let out = '';
  for (const char of lowered) out += LEET[char] ?? char;
  return out.replace(/[^a-z]/g, '');
}

/**
 * The same folding, but with word boundaries left intact — runs of anything
 * that is not a letter become a single space. This is what the whole-word
 * patterns above are tested against.
 */
function foldWords(value: string): string {
  const lowered = value.toLowerCase();
  let out = '';
  for (const char of lowered) out += LEET[char] ?? char;
  return out.replace(/[^a-z]+/g, ' ').trim();
}

/**
 * The shared first pass: make the string safe to store and to render, and make
 * it one line. Unicode is normalised first so that a composed and a decomposed
 * form of the same word cannot disagree with the blocklist.
 */
function normalise(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(CONTROL, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBlocked(value: string): boolean {
  const collapsed = fold(value);
  if (BLOCKED_ANYWHERE.some((word) => collapsed.includes(word))) return true;

  const spaced = foldWords(value);
  return BLOCKED_WORDS.some((pattern) => pattern.test(spaced));
}

/**
 * The message itself. Order matters: cheap structural checks first, so the
 * blocklist only ever runs on a string that is already the right shape.
 */
export function checkMessage(raw: unknown): Checked {
  const value = normalise(raw);

  if (!value) return { ok: false, reason: 'Say something first.' };
  if (value.length > MAX_MESSAGE) {
    return { ok: false, reason: `Keep it to ${MAX_MESSAGE} characters.` };
  }

  /*
   * At least two letters. Without this the wall fills with emoji rows and
   * punctuation art, which is not a message and looks like a broken page.
   */
  if ((value.match(/\p{L}/gu) ?? []).length < 2) {
    return { ok: false, reason: 'Use a few words.' };
  }

  if (LINKY.some((pattern) => pattern.test(value))) {
    return { ok: false, reason: 'No links, sorry — this wall is public.' };
  }

  if (PHONEY.test(value)) {
    return { ok: false, reason: "Don't post a phone number on a public page." };
  }

  /*
   * One character repeated across the whole line ("aaaaaaaa", "!!!!!!!!").
   * Counted over the folded copy so spacing tricks do not dodge it.
   */
  const folded = fold(value);
  if (folded.length > 8 && new Set(folded).size <= 2) {
    return { ok: false, reason: 'Use a few words.' };
  }

  if (isBlocked(value)) {
    return { ok: false, reason: 'That one is not going up. Try again.' };
  }

  return { ok: true, value };
}

/**
 * The name is optional, so an empty one is a success with an empty value rather
 * than an error. The caller substitutes ANON at render time.
 */
export function checkName(raw: unknown): Checked {
  const value = normalise(raw);

  if (!value) return { ok: true, value: '' };
  if (value.length > MAX_NAME) {
    return { ok: false, reason: `Names cap at ${MAX_NAME} characters.` };
  }
  if (LINKY.some((pattern) => pattern.test(value)) || PHONEY.test(value)) {
    return { ok: false, reason: 'A first name is all this needs.' };
  }
  if (isBlocked(value)) {
    return { ok: false, reason: 'Pick a different name.' };
  }

  return { ok: true, value };
}
