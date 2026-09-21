import { Redis } from '@upstash/redis';
import { WALL_SIZE, type WallLine } from './hi-text';

/* ---------------------------------------------------------------------------
   Everything the /hi counter and wall keep between visits.

   Server only. One Redis, in Dubai, because that is where the shirt is.

   The shape of the data is the privacy policy of this feature, so it is worth
   stating plainly:

     - A visitor is a random id in an HttpOnly cookie and a number. Nothing else
       about them is stored, and the id is not derived from anything — not their
       IP, not their user agent — so it cannot be worked backwards.
     - A wall line holds a name only if one was typed, and no location, no IP,
       and no id of the person who left it. `hi:mine:<vid>` maps a visitor to
       their own line so they can take it down, and it is the only join between
       the two, never read in the direction of "who wrote this".
     - Where scans happen is counted per area and nowhere else. There is no row
       anywhere that says a person was in a place at a time, so no such row can
       leak, be subpoenaed, or be joined back to the wall.
   --------------------------------------------------------------------------- */

/**
 * The people who scanned before there was anything counting them.
 *
 * /hi went up on 17 Sep 2026 and this counter four days later, so there is a
 * short history the page would otherwise throw away. Starting at 1 would tell
 * the next person they were the first, which is both untrue and the least
 * impressive thing the page could say.
 *
 * 104 is Vercel Analytics' visitor count for the /hi route, and it is the
 * all-time figure rather than a window: the route is younger than the shortest
 * range the dashboard offers, so its seven-day number already covers its whole
 * life. The site-wide 233 over thirty days is a different and wrong number for
 * this — it counts /work and /story readers who never saw a shirt, across days
 * when this page did not exist.
 *
 * Read it as a floor, not a census. Vercel counts a visitor once per day, so
 * someone who came back on two days is two of these, and a few early ones are
 * me before there was an opt-out.
 *
 * Changing it later moves only people who have not been given a number yet.
 * Everyone already counted keeps theirs, because the offset is added when the
 * number is handed out and then stored — see claimOrdinal. That is deliberate:
 * a number someone has already screenshotted must never quietly become a
 * different one.
 */
const SCANS_BEFORE_THE_COUNTER = 104;

const KEY = {
  /** How many people have scanned. The number a visitor gets is their INCR of this. */
  count: 'hi:n',
  /** vid -> the number that visitor was given, for as long as they keep the cookie. */
  who: (vid: string) => `hi:who:${vid}`,
  /** Message id -> the line itself. */
  msg: (id: string) => `hi:msg:${id}`,
  /** Sorted set of message ids, scored by the time they were posted. */
  wall: 'hi:wall',
  /** vid -> the one message that visitor has posted. */
  mine: (vid: string) => `hi:mine:${vid}`,
  /** "country|region|city" -> scans. Counts only; no visitor is recorded here. */
  areas: 'hi:areas',
  /** The same area -> "lat,lon", rounded, written once, so a map has somewhere to draw. */
  areaPin: 'hi:areapin',
  /** Fixed-window rate limit buckets. */
  rate: (bucket: string, who: string, window: number) => `hi:rate:${bucket}:${who}:${window}`,
} as const;

let client: Redis | null = null;

/**
 * Built on first use rather than at module scope. These routes are the only
 * on-demand ones in a site that is otherwise prerendered, and a client
 * constructed at import time would throw during `astro build`, where no Upstash
 * credentials exist and none are needed.
 *
 * A plain function, not a Proxy: a Proxy around a client looks like the tidier
 * version right up to the point something introspects the object.
 */
function redis(): Redis {
  if (client) return client;

  /*
   * Vercel's Upstash integration has shipped these under both names. Reading
   * either means the feature survives the integration being reconnected, which
   * is otherwise a silent outage nobody would think to look for.
   */
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'hi-store: no Upstash credentials. Run `vercel env pull .env.local` — ' +
        'the counter and the wall need UPSTASH_REDIS_REST_URL and _TOKEN.',
    );
  }

  client = new Redis({ url, token });
  return client;
}

/** True when the store is configured at all, so a page can degrade rather than error. */
export function storeReady(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN),
  );
}

/**
 * Upstash decodes JSON for you when it can, which means a value comes back as an
 * object sometimes and as a string other times depending on what was written.
 * Both are handled rather than assumed.
 */
function revive(value: unknown): WallLine | null {
  if (!value) return null;
  if (typeof value === 'object') return value as WallLine;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as WallLine;
  } catch {
    return null;
  }
}

/* --- counting people ------------------------------------------------------ */

/** The number a returning visitor already holds, or null if this cookie is new to us. */
export async function ordinalFor(vid: string): Promise<number | null> {
  const seen = await redis().get<number | string>(KEY.who(vid));
  if (seen === null || seen === undefined) return null;
  const n = Number(seen);
  return Number.isFinite(n) ? n : null;
}

/**
 * Hand out the next number and remember it against this visitor.
 *
 * The INCR is the source of truth, so two people scanning at the same moment
 * get two different numbers without coordinating. Writing the mapping second
 * means the worst case is a number that was issued and never claimed — a gap in
 * the sequence, which nobody can see, rather than two people holding the same
 * number, which they would both screenshot.
 */
export async function claimOrdinal(vid: string): Promise<number> {
  const n = SCANS_BEFORE_THE_COUNTER + (await redis().incr(KEY.count));
  await redis().set(KEY.who(vid), n);
  return n;
}

/** How many people have scanned, for the wall header. Never increments. */
export async function scanCount(): Promise<number> {
  const n = await redis().get<number | string>(KEY.count);
  return SCANS_BEFORE_THE_COUNTER + (Number(n ?? 0) || 0);
}

/* --- where, loosely ------------------------------------------------------- */

/**
 * One scan, counted against an area. Called once per new visitor and never for
 * a returning one, so this counts people rather than page loads.
 *
 * Deliberately lossy. The coordinates are rounded to two decimals — a little
 * over a kilometre — and are stored against the area rather than the scan, so
 * the finest thing this can ever draw is "somewhere in this district, N people".
 * That is the map worth having and it is not a record of anyone's movements.
 */
export async function countArea(place: {
  country?: string;
  region?: string;
  city?: string;
  lat?: string;
  lon?: string;
}): Promise<void> {
  const country = (place.country ?? '').trim().toUpperCase();
  if (!country) return;

  const city = (place.city ?? '').trim();
  const region = (place.region ?? '').trim();
  const field = `${country}|${region}|${city}`;

  await redis().hincrby(KEY.areas, field, 1);

  /*
   * HSETNX, so the pin is whatever the first scan in an area reported and never
   * drifts afterwards. Later scans in the same district must not nudge the dot
   * toward whoever scanned most recently.
   */
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    await redis().hsetnx(KEY.areaPin, field, `${lat.toFixed(2)},${lon.toFixed(2)}`);
  }
}

export interface Area {
  country: string;
  region: string;
  city: string;
  scans: number;
  lat: number | null;
  lon: number | null;
}

/** Every area that has seen a scan, busiest first. Aggregate rows only. */
export async function areas(): Promise<Area[]> {
  const [counts, pins] = await Promise.all([
    redis().hgetall<Record<string, number | string>>(KEY.areas),
    redis().hgetall<Record<string, string>>(KEY.areaPin),
  ]);
  if (!counts) return [];

  return Object.entries(counts)
    .map(([field, value]) => {
      const [country = '', region = '', city = ''] = field.split('|');
      const [lat, lon] = (pins?.[field] ?? '').split(',').map(Number);
      return {
        country,
        region,
        city,
        scans: Number(value) || 0,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
      };
    })
    .sort((a, b) => b.scans - a.scans);
}

/* --- the wall ------------------------------------------------------------- */

export async function wall(): Promise<WallLine[]> {
  const ids = await redis().zrange<string[]>(KEY.wall, 0, WALL_SIZE - 1, { rev: true });
  if (!ids.length) return [];

  const raw = await redis().mget<unknown[]>(...ids.map(KEY.msg));
  /*
   * A id can outlive its message: the admin deletes the body and the index entry
   * in that order, and a read landing between the two would otherwise render a
   * hole. Dropping nulls here is what makes that interval invisible.
   */
  return raw.map(revive).filter((line): line is WallLine => line !== null);
}

/** The line this visitor has already left, if they have left one. */
export async function lineBy(vid: string): Promise<WallLine | null> {
  const id = await redis().get<string>(KEY.mine(vid));
  if (!id) return null;
  return revive(await redis().get(KEY.msg(id)));
}

/** Post a line. The caller has already run it past the guards. */
export async function addLine(
  vid: string,
  line: Omit<WallLine, 'id'>,
): Promise<WallLine> {
  const id = crypto.randomUUID();
  const record: WallLine = { id, ...line };

  await redis().set(KEY.msg(id), JSON.stringify(record));
  await redis().zadd(KEY.wall, { score: record.at, member: id });
  await redis().set(KEY.mine(vid), id);

  return record;
}

/**
 * Remove a line. `vid` is passed when a visitor is taking down their own, and
 * omitted when it is the admin — the ownership check lives here so that no
 * caller can forget it.
 */
export async function removeLine(id: string, vid?: string): Promise<boolean> {
  if (vid) {
    const owned = await redis().get<string>(KEY.mine(vid));
    if (owned !== id) return false;
  }

  await redis().zrem(KEY.wall, id);
  await redis().del(KEY.msg(id));
  if (vid) await redis().del(KEY.mine(vid));

  return true;
}

/* --- holding the line ----------------------------------------------------- */

/**
 * A fixed window, which is the cheapest limiter that actually works: INCR the
 * bucket, set its expiry the first time, refuse past the ceiling. Its known
 * weakness is that someone timing a burst across a window boundary gets up to
 * twice the allowance, and at these limits twice is still nothing.
 *
 * The window is part of the key, so buckets expire on their own and there is no
 * cleanup anywhere.
 */
export async function withinLimit(
  bucket: string,
  who: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = KEY.rate(bucket, who, window);

  const used = await redis().incr(key);
  if (used === 1) await redis().expire(key, windowSeconds);

  return used <= limit;
}
