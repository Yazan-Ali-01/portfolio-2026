import { meta } from '../content/meta';

/**
 * Vercel Web Analytics, Vercel Speed Insights, and Microsoft Clarity.
 *
 * Nothing is fetched until the browser goes idle, so first paint stays exactly
 * as measured: HTML, CSS and two fonts, nothing else. The trade is that a
 * visitor who leaves inside a second may not be counted, which is a bounce
 * rather than a reader.
 *
 * Three independent gates, because one of them failing should not put test
 * traffic into real analytics:
 *
 *   1. Host allowlist. Only `meta.analyticsHosts` count. Localhost, preview
 *      deployments and anything else are silently excluded.
 *   2. `navigator.webdriver`. Playwright, Puppeteer and Selenium all set it.
 *   3. Self-exclusion: load any page with `?analytics=off` once on a browser to
 *      stop counting your own visits there, `?analytics=on` to resume. Stored in
 *      localStorage, so it survives across the whole site. Also wired into
 *      Vercel's `beforeSend`, so an event cannot escape even if one slips past.
 *
 * `?analytics=force` bypasses gates 1 and 2 for the duration of the tab, so
 * tools/analytics-check.mjs can exercise the loader locally. It never bypasses
 * self-exclusion, and it does not persist.
 */

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    // va and vaq are declared by @vercel/analytics; redeclaring them conflicts.
    clarity?: (...args: unknown[]) => void;
  }
}

const OPT_OUT_KEY = 'yz_optout';
const FORCE_KEY = 'yz_force_analytics';
const seen = new Set<string>();
let excluded = false;
let ready = false;
/** Events fired before the scripts land, flushed once they do. */
const pending: [string, Props | undefined][] = [];

function resolveOptOut(): boolean {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get('analytics') === 'off') localStorage.setItem(OPT_OUT_KEY, '1');
    if (qs.get('analytics') === 'on') localStorage.removeItem(OPT_OUT_KEY);
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    // Private windows and blocked storage both throw. Counting is the default.
    return false;
  }
}

/** True only on the real site, in a real browser. */
function isCountableVisit(): boolean {
  let forced = false;
  try {
    if (new URLSearchParams(location.search).get('analytics') === 'force') {
      sessionStorage.setItem(FORCE_KEY, '1');
    }
    forced = sessionStorage.getItem(FORCE_KEY) === '1';
  } catch {
    /* storage can throw; forced stays false */
  }
  if (forced) return true;

  if (navigator.webdriver) return false;
  return (meta.analyticsHosts as readonly string[]).includes(location.hostname);
}

/** Fire an event. Safe to call before the scripts land — Vercel queues on `vaq`. */
export function track(name: string, props?: Props): void {
  if (excluded) return;
  if (!ready) {
    pending.push([name, props]);
    return;
  }
  try {
    window.va?.('event', { name, ...props });
  } catch {
    /* never let analytics break the page */
  }
  try {
    window.clarity?.('event', name);
  } catch {
    /* ignore */
  }
}

/** Fire at most once per page view, for depth and hover events that repeat. */
export function trackOnce(key: string, name: string, props?: Props): void {
  if (seen.has(key)) return;
  seen.add(key);
  track(name, props);
}

function flush(): void {
  ready = true;
  const queued = pending.splice(0, pending.length);
  for (const [name, props] of queued) track(name, props);
}

function loadScript(src: string): void {
  const el = document.createElement('script');
  el.src = src;
  el.defer = true;
  document.head.appendChild(el);
}

function loadClarity(id: string): void {
  window.clarity =
    window.clarity ??
    function (...args: unknown[]) {
      ((window.clarity as unknown as { q?: unknown[] }).q ??= []).push(args);
    };
  loadScript(`https://www.clarity.ms/tag/${id}`);
}

function whenIdle(fn: () => void): void {
  // Safari only shipped requestIdleCallback recently; a timeout is the fallback.
  // Checked via a local so the `else` branch does not narrow `window` to never.
  const idle: typeof window.requestIdleCallback | undefined = window.requestIdleCallback;
  if (typeof idle === 'function') idle(fn, { timeout: 3000 });
  else window.setTimeout(fn, 1200);
}

/** Reads `data-ev` and any `data-ev-*` on the clicked link. */
function propsFrom(el: HTMLElement): Props {
  const out: Props = { page: location.pathname };
  for (const name of el.getAttributeNames()) {
    if (name.startsWith('data-ev-')) out[name.slice(8)] = el.getAttribute(name) ?? '';
  }
  return out;
}

function wireClicks(): void {
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLElement | null;
      if (!link) return;

      const label = link.getAttribute('data-ev');
      const href = link.getAttribute('href') ?? '';

      if (label) track(label, propsFrom(link));
      else if (href.startsWith('mailto:')) track('contact_click', { channel: 'email' });
      else if (/^https?:\/\//i.test(href) && !href.includes(location.host))
        track('outbound', { href, page: location.pathname });
    },
    { passive: true },
  );
}

/** Scroll depth for long pages. Fires at each quarter, once. */
export function trackDepth(label: string): void {
  if (excluded) return;
  const marks = [25, 50, 75, 100];
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.min(100, Math.round(((window.scrollY / max) * 100) / 25) * 25);
    for (const mark of marks) {
      if (pct >= mark) trackOnce(`${label}:${mark}`, 'read_depth', { label, percent: mark });
    }
    if (pct >= 100) window.removeEventListener('scroll', onScroll);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function initAnalytics(): void {
  excluded = resolveOptOut() || !isCountableVisit();
  if (excluded) return;

  wireClicks();

  whenIdle(() => {
    /*
     * Vercel's own injectors, not a hand-rolled script tag. The raw
     * /_vercel/insights/script.js loads happily on its own and then tracks
     * nothing: it needs the data-sdkn and data-sdkv attributes that inject()
     * sets. That cost a day of "why are there no page views".
     *
     * Dynamically imported so neither package is on the critical path.
     */
    void Promise.all([import('@vercel/analytics'), import('@vercel/speed-insights')])
      .then(([analytics, speed]) => {
        analytics.inject({ beforeSend: (event) => (excluded ? null : event) });
        speed.injectSpeedInsights();
      })
      .catch(() => {
        /* analytics must never break the page */
      })
      .finally(flush);

    if (meta.clarityId) loadClarity(meta.clarityId);
  });
}
