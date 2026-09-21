import type { APIRoute } from 'astro';
import { areas, removeLine, scanCount, wall, withinLimit } from '../../../lib/hi-store';
import { keyMatches } from '../../../lib/hi-admin';
import { clientIp, json } from '../../../lib/hi-visitor';

export const prerender = false;

/**
 * The kill switch behind the live wall.
 *
 * A line goes up the moment it is written, which is what makes the wall worth
 * coming back to and is also the risk: this is how it comes down again.
 */

/** Slow down anyone working through the key space, however unlikely that is. */
async function throttled(request: Request): Promise<boolean> {
  return !(await withinLimit('admin', clientIp(request), 30, 600));
}

export const GET: APIRoute = async ({ request, url }) => {
  if (await throttled(request)) return json({ ok: false }, 429);
  if (!keyMatches(url.searchParams.get('key'))) return json({ ok: false }, 404);

  const [lines, count, where] = await Promise.all([wall(), scanCount(), areas()]);
  return json({ ok: true, wall: lines, count, areas: where });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  if (await throttled(request)) return json({ ok: false }, 429);
  if (!keyMatches(url.searchParams.get('key'))) return json({ ok: false }, 404);

  const id = url.searchParams.get('id');
  if (!id) return json({ ok: false, reason: 'Which line?' }, 400);

  /*
   * No vid, so removeLine skips the ownership check. The message body and the
   * index entry go, and `hi:mine:<vid>` is deliberately left behind: whoever
   * wrote this still counts as having had their one turn.
   */
  await removeLine(id);

  const lines = await wall();
  return json({ ok: true, wall: lines });
};
