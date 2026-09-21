import { ANON, MAX_MESSAGE, ordinal, type WallLine } from '../lib/hi-text';
import { track } from '../lib/analytics';

/* ---------------------------------------------------------------------------
   The live half of /hi: the scan number and the wall.

   Everything here is an upgrade to a page that already works. The markup ships
   with "You scanned the shirt." and the wall hidden; if this script never runs,
   never loads, or the endpoint is down, a stranger still gets the name, the
   contact card and the WhatsApp button, which is what the page is actually for.
   Nothing below is allowed to throw its way out of that guarantee.
   --------------------------------------------------------------------------- */

/** Mirrors analytics: the real site, in a real browser, for someone who has not opted out. */
const COUNTABLE_HOSTS = ['yazan-ali.net', 'www.yazan-ali.net'];
const OPT_OUT_KEY = 'yz_optout';
/** The last number we were told, so the line paints before the network answers. */
const CACHE_KEY = 'yz_hi_n';

function countsAsAScan(): boolean {
  try {
    if (localStorage.getItem(OPT_OUT_KEY) === '1') return false;
  } catch {
    /* blocked storage is not a reason to stop counting */
  }
  if (navigator.webdriver) return false;
  /* localhost included on purpose: the feature has to be testable before it ships. */
  return COUNTABLE_HOSTS.includes(location.hostname) || location.hostname === 'localhost';
}

function remember(n: number | null): void {
  try {
    if (n) localStorage.setItem(CACHE_KEY, String(n));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function remembered(): number | null {
  try {
    const cached = Number(localStorage.getItem(CACHE_KEY));
    return Number.isFinite(cached) && cached > 0 ? cached : null;
  } catch {
    return null;
  }
}

/** "just now", "6m ago", "3d ago" — short, because it sits in a corner. */
function ago(at: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface ScanReply {
  n: number | null;
  count: number;
  wall: WallLine[];
  mine: WallLine | null;
}

export function initHiWall(): void {
  const root = document.querySelector<HTMLElement>('[data-wall-root]');
  const line = document.querySelector<HTMLElement>('[data-scan-line]');
  const jump = document.querySelector<HTMLElement>('[data-wall-jump]');
  const list = document.querySelector<HTMLUListElement>('[data-wall-list]');
  const tally = document.querySelector<HTMLElement>('[data-wall-tally]');
  const form = document.querySelector<HTMLFormElement>('[data-say]');
  const text = document.querySelector<HTMLTextAreaElement>('[data-say-text]');
  const name = document.querySelector<HTMLInputElement>('[data-say-name]');
  const left = document.querySelector<HTMLElement>('[data-say-left]');
  const error = document.querySelector<HTMLElement>('[data-say-error]');
  const submit = document.querySelector<HTMLButtonElement>('[data-say-submit]');
  const mineBox = document.querySelector<HTMLElement>('[data-mine]');
  const mineText = document.querySelector<HTMLElement>('[data-mine-text]');
  const unsay = document.querySelector<HTMLButtonElement>('[data-unsay]');

  if (!root || !line || !list || !form || !text || !submit) return;

  let mineId: string | null = null;

  /* --- painting ----------------------------------------------------------- */

  /**
   * The counter line. Built from nodes rather than a template string: the only
   * dynamic part is a number we produced, but this file also renders text a
   * stranger typed, and having exactly one way to put text on the page is how
   * that stays true a year from now.
   */
  function paintNumber(n: number | null): void {
    if (!n) return;
    line!.textContent = "You're the ";
    const strong = document.createElement('strong');
    strong.className = 'hi__n';
    strong.textContent = ordinal(n);
    line!.append(strong, document.createTextNode(' person to scan this.'));
  }

  function paintTally(count: number, posts: number): void {
    if (tally) {
      tally.textContent =
        posts === 0
          ? 'Nobody has left a line yet. Go first.'
          : `${posts} of ${count} left a line.`;
    }
    if (jump) {
      /* Toggled through an attribute the stylesheet owns, so the reserved line
         stays reserved and only its contents ever change. */
      if (posts === 0) jump.removeAttribute('data-shown');
      else jump.setAttribute('data-shown', '');
      jump.textContent = posts === 1 ? '1 person left a line ↓' : `${posts} people left a line ↓`;
    }
  }

  function paintWall(lines: WallLine[]): void {
    list!.replaceChildren();

    for (const entry of lines) {
      const item = document.createElement('li');
      item.className = 'wall__line';
      if (entry.id === mineId) item.dataset.own = '';

      const meta = document.createElement('p');
      meta.className = 'wall__meta';

      const who = document.createElement('span');
      who.className = 'wall__who';
      who.textContent = entry.name || ANON;

      const when = document.createElement('time');
      when.dateTime = new Date(entry.at).toISOString();
      when.textContent = ago(entry.at);

      meta.append(who);
      if (entry.n) {
        const n = document.createElement('span');
        n.className = 'wall__n';
        n.textContent = ordinal(entry.n);
        meta.append(n);
      }
      meta.append(when);

      const said = document.createElement('p');
      said.className = 'wall__said';
      /* textContent, always. This is a stranger's text on someone else's site. */
      said.textContent = entry.text;

      item.append(meta, said);
      list!.append(item);
    }
  }

  /** Their own line, and the offer to take it back down. */
  function paintMine(entry: WallLine | null): void {
    mineId = entry?.id ?? null;
    if (!mineBox) return;

    if (!entry) {
      mineBox.hidden = true;
      form!.hidden = false;
      return;
    }

    form!.hidden = true;
    mineBox.hidden = false;
    if (mineText) mineText.textContent = entry.text;
  }

  function apply(data: ScanReply): void {
    paintNumber(data.n);
    remember(data.n);
    paintMine(data.mine ?? null);
    paintWall(data.wall ?? []);
    paintTally(data.count ?? 0, (data.wall ?? []).length);
    root!.hidden = false;
  }

  function fail(message: string): void {
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  /* --- talking to the server ---------------------------------------------- */

  /*
   * Paint the cached number immediately so a returning visitor sees their own
   * line rather than a flash of the generic one. Overwritten by the real answer
   * a moment later, which is the authority.
   */
  paintNumber(remembered());

  void fetch('/api/hi/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ join: countsAsAScan() }),
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data: ScanReply) => apply(data))
    .catch(() => {
      /*
       * Left exactly as it shipped: "You scanned the shirt." and no wall. A
       * contact page that half-loads is worse than one that never offered.
       */
    });

  /* --- leaving a line ------------------------------------------------------ */

  const countdown = () => {
    if (left) left.textContent = String(MAX_MESSAGE - text.value.length);
  };
  text.addEventListener('input', countdown);
  countdown();

  /* Enter sends it. This is one line, not a paragraph, and the button is a reach. */
  text.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (error) error.hidden = true;

    const said = text.value.trim();
    if (!said) return;

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'Sending…';

    void fetch('/api/hi/say', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: said, name: name?.value ?? '' }),
    })
      .then(async (response) => ({ status: response.status, body: await response.json() }))
      .then(({ body }) => {
        if (!body?.ok) {
          fail(body?.reason ?? 'That did not go through.');
          return;
        }
        text.value = '';
        countdown();
        paintMine(body.line);
        paintWall(body.wall ?? []);
        paintTally(body.count ?? 0, (body.wall ?? []).length);
        track('hi_wall_say');
      })
      .catch(() => fail('That did not go through. Try again.'))
      .finally(() => {
        submit.disabled = false;
        submit.textContent = label;
      });
  });

  unsay?.addEventListener('click', () => {
    unsay.disabled = true;
    void fetch('/api/hi/say', { method: 'DELETE' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((body) => {
        paintMine(null);
        paintWall(body.wall ?? []);
        paintTally(body.count ?? 0, (body.wall ?? []).length);
      })
      .catch(() => {
        /* it stays up; the admin can still take it down */
      })
      .finally(() => {
        unsay.disabled = false;
      });
  });
}
