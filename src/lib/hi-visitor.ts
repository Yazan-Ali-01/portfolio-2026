import type { APIContext } from 'astro';

/* ---------------------------------------------------------------------------
   Who is asking, and roughly where from.

   The /hi endpoints all need the same three things — a visitor id, an IP to
   rate limit against, and a response that no cache will ever hold on to — so
   they are settled once here rather than four slightly different ways.
   --------------------------------------------------------------------------- */

/** Two years. A shirt outlives a browser session, and so should someone's number. */
const COOKIE_LIFE = 60 * 60 * 24 * 730;

const COOKIE = 'hi_v';

/**
 * The visitor id is a random UUID and nothing else. It is not derived from an
 * IP or a user agent, so it identifies a browser that has been here before and
 * cannot be turned back into a person.
 *
 * HttpOnly because no script needs to read it, and reading it is the only way
 * it leaks. It also keeps the cookie out of reach of the seven-day cap Safari
 * puts on anything written from JavaScript, which would otherwise quietly reset
 * someone's number every week.
 */
export function visitorId(context: APIContext): string | null {
  const value = context.cookies.get(COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

/** Mint a new id and put it on the response. */
export function issueVisitor(context: APIContext): string {
  const vid = crypto.randomUUID();
  context.cookies.set(COOKIE, vid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: COOKIE_LIFE,
  });
  return vid;
}

/**
 * For rate limiting only, and never stored. `x-forwarded-for` can carry a chain;
 * on Vercel the client is the first entry and the header cannot be spoofed
 * because the platform overwrites it at the edge.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * The area a request came from, as the platform already knows it. No permission
 * prompt is involved because nothing is asked of the device — this is what the
 * IP resolves to, which is a district at best.
 *
 * The city arrives percent-encoded per RFC3986, so "Abu%20Dhabi" has to be
 * decoded or the map grows two entries for one place.
 */
export function placeOf(request: Request): {
  country: string;
  region: string;
  city: string;
  lat: string;
  lon: string;
} {
  const read = (name: string) => {
    const raw = request.headers.get(name) ?? '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  return {
    country: read('x-vercel-ip-country'),
    region: read('x-vercel-ip-country-region'),
    city: read('x-vercel-ip-city'),
    lat: request.headers.get('x-vercel-ip-latitude') ?? '',
    lon: request.headers.get('x-vercel-ip-longitude') ?? '',
  };
}

/**
 * Every one of these responses is specific to the person asking, or changes the
 * moment someone posts. `private, no-store` keeps it out of the CDN and out of
 * the browser's own cache, so nobody is ever shown another visitor's number.
 */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}
