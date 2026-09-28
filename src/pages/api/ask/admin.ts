import type { APIRoute } from 'astro';
import { DAILY_BUDGET, leads, recentChats, spentToday, transcript } from '../../../lib/ask-store';
import { keyMatches } from '../../../lib/hi-admin';
import { withinLimit } from '../../../lib/hi-store';
import { clientIp, json } from '../../../lib/hi-visitor';

export const prerender = false;

/**
 * What people asked, and what it cost.
 *
 * The transcripts are the reason this is worth having: every question is
 * something a visitor wanted to know and could not find on the site. Same key
 * and the same throttle as the wall's admin route.
 */
export const GET: APIRoute = async ({ request, url }) => {
  if (!(await withinLimit('admin', clientIp(request), 30, 600))) return json({ ok: false }, 429);
  if (!keyMatches(url.searchParams.get('key'))) return json({ ok: false }, 404);

  const [spent, ids, captured] = await Promise.all([spentToday(), recentChats(60), leads()]);
  const chats = await Promise.all(ids.map(async (id) => ({ id, turns: await transcript(id) })));

  return json({
    ok: true,
    spentToday: spent,
    budget: DAILY_BUDGET,
    leads: captured,
    chats: chats.filter((c) => c.turns.length),
  });
};
