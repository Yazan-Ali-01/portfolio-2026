import type { APIRoute } from 'astro';
import { claimOrdinal, countArea, ordinalFor, scanCount, wall, lineBy, withinLimit } from '../../../lib/hi-store';
import { clientIp, issueVisitor, json, placeOf, visitorId } from '../../../lib/hi-visitor';

export const prerender = false;

/**
 * The one request /hi makes when it loads.
 *
 * It answers everything the page needs at once — your number, the total, the
 * wall, and your own line if you left one — because the reader is on a phone on
 * mobile data and four round-trips is three too many.
 *
 * POST rather than GET on purpose: this assigns a number the first time it is
 * called, and a GET that changes something will eventually be prefetched,
 * preloaded or retried by something that assumed otherwise.
 */
export const POST: APIRoute = async (context) => {
  /*
   * Reading the wall is free; being counted is not. The browser decides whether
   * this visit is a real one — it knows about the host, the opt-out and the
   * webdriver flag, exactly as analytics does — and says so here. A crawler
   * runs no script and so never arrives at all.
   */
  let join = false;
  try {
    const body = await context.request.json();
    join = body?.join === true;
  } catch {
    /* no body is simply "don't count me" */
  }

  const existing = visitorId(context);
  /* Held in a local rather than read back off the cookie jar, because the id
     issued below belongs to the response and re-reading the request for it is
     a bug waiting for the day that behaviour changes. */
  let visitor = existing;

  /*
   * A returning visitor keeps whatever number they were given, and it costs a
   * read rather than a write. This is the property the whole feature rests on:
   * the number in someone's screenshot is still their number next month.
   */
  let n = existing ? await ordinalFor(existing) : null;

  if (n === null && join) {
    if (!(await withinLimit('scan', clientIp(context.request), 20, 3600))) {
      /*
       * Out of new numbers for this address this hour. The wall still loads —
       * a shared office IP hitting the ceiling should not look like an outage.
       */
      const [count, lines] = await Promise.all([scanCount(), wall()]);
      return json({ n: null, count, wall: lines, mine: null });
    }

    visitor = existing ?? issueVisitor(context);
    n = await claimOrdinal(visitor);

    /*
     * Counted once, against the area, at the moment a new person arrives — never
     * for a returning one, so this measures people rather than page loads. It is
     * written to a different key space than the wall and shares no id with it.
     */
    await countArea(placeOf(context.request));
  }

  const [count, lines, mine] = await Promise.all([
    scanCount(),
    wall(),
    visitor ? lineBy(visitor) : Promise.resolve(null),
  ]);

  return json({ n, count, wall: lines, mine });
};
