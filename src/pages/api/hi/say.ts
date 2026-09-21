import type { APIRoute } from 'astro';
import { addLine, lineBy, ordinalFor, removeLine, scanCount, wall, withinLimit } from '../../../lib/hi-store';
import { checkMessage, checkName } from '../../../lib/hi-guards';
import { clientIp, json, visitorId } from '../../../lib/hi-visitor';

export const prerender = false;

/**
 * Leave a line on the wall.
 *
 * Three gates, narrowing: you must have scanned (a cookie), you get one line
 * (not one an hour — one), and the address you came from gets a handful of
 * attempts an hour no matter how many cookies it clears. Only then does the
 * text itself go past the guards.
 */
export const POST: APIRoute = async (context) => {
  const vid = visitorId(context);
  if (!vid) {
    return json({ ok: false, reason: 'Reload the page and try again.' }, 400);
  }

  /*
   * Ahead of the guards, because the cheapest way to stop someone hammering the
   * blocklist to find out what it contains is to stop them hammering at all.
   */
  if (!(await withinLimit('say', clientIp(context.request), 5, 3600))) {
    return json({ ok: false, reason: 'That is enough for one hour.' }, 429);
  }

  const already = await lineBy(vid);
  if (already) {
    return json({ ok: false, reason: 'You have already left a line.' }, 409);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, reason: 'Say something first.' }, 400);
  }

  const fields = (body ?? {}) as { text?: unknown; name?: unknown };

  const text = checkMessage(fields.text);
  if (!text.ok) return json({ ok: false, reason: text.reason }, 422);

  const name = checkName(fields.name);
  if (!name.ok) return json({ ok: false, reason: name.reason }, 422);

  /*
   * Their scan number travels with the line, so a wall entry and the screenshot
   * someone posted of "you're the 143rd" are the same person to a reader. Zero
   * for anyone who opted out of being counted and still wants to say something.
   */
  const n = (await ordinalFor(vid)) ?? 0;

  const line = await addLine(vid, {
    n,
    name: name.value,
    text: text.value,
    at: Date.now(),
  });

  /*
   * The full wall comes back rather than just the new line, so the page the
   * visitor is looking at includes anything posted while they were typing.
   */
  const [count, lines] = await Promise.all([scanCount(), wall()]);
  return json({ ok: true, line, wall: lines, count });
};

/**
 * Take your own line back down.
 *
 * Worth the twenty lines it costs: people post things they regret, and the
 * alternative is that someone has to email a stranger and wait. Ownership is
 * the cookie, checked inside removeLine so it cannot be skipped here.
 */
export const DELETE: APIRoute = async (context) => {
  const vid = visitorId(context);
  if (!vid) return json({ ok: false, reason: 'Nothing to remove.' }, 400);

  if (!(await withinLimit('unsay', clientIp(context.request), 10, 3600))) {
    return json({ ok: false, reason: 'Try again later.' }, 429);
  }

  const mine = await lineBy(vid);
  if (!mine) return json({ ok: false, reason: 'Nothing to remove.' }, 404);

  await removeLine(mine.id, vid);

  const [count, lines] = await Promise.all([scanCount(), wall()]);
  return json({ ok: true, wall: lines, count });
};
