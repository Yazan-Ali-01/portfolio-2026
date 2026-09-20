import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
const BASE = (process.argv[2] || 'http://localhost:4321/').replace(/\/$/, '');
const URL = BASE + '/story';
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail.push(m); };

// --- 1. No JavaScript at all -------------------------------------------------
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // innerText omits collapsed <details>, so read the DOM: native <details> opens
  // without JavaScript, which is what "readable with JS disabled" requires.
  const text = await page.evaluate(() => document.body.textContent);
  console.log('\nNo JavaScript');
  // Two of these encode the timeline constraint from SPEC.md: one month of
  // hunting, then another, matching the Feb-to-Apr 2023 gap on the CV.
  for (const s of ['Eighty-three percent', 'illiterate engineer', 'One month of hunting',
                   'Another month of hunting', 'arithmetic', 'propels any team to new heights',
                   'why I became a software engineer', 'Latakia, Syria · 2019', 'CS50', 'This is what happened in between']) {
    ok(text.includes(s), `story text present: "${s}"`);
  }
  ok(await page.locator('nav[aria-label="Chapters"] a').count() === 10, 'rail degrades to a 10-link table of contents');
  ok((await page.locator('details.aside').count()) === 1, 'info badge is a native <details>');
  await page.locator('summary.aside__summary').click();
  ok((await page.locator('details.aside[open]').count()) === 1, 'info badge opens with JS disabled');
  await ctx.close();
}

// --- 2. Reduced motion -------------------------------------------------------
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  const requested = [];
  page.on('request', r => requested.push(r.url()));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(1500);
  console.log('\nReduced motion');
  ok(!requested.some(u => /ScrollTrigger|gsap/i.test(u)), 'GSAP is never downloaded');
  ok(requested.some(u => /renderer|three/i.test(u)), 'scene still loads (simplifies, does not disappear)');
  await ctx.close();
}

// --- 3. Breakpoints ----------------------------------------------------------
console.log('\nBreakpoints');
for (const w of [390, 600, 768, 1024, 1280, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const gateOver = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (gateOver > 1) { ok(false, `${w}px gate: overflow ${gateOver}px`); }
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 1, `${w}px: no horizontal overflow (${over}px)`);
  await ctx.close();
}

// --- 3b. The gate and the work routes ---------------------------------------
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nGate and work routes (no JavaScript)');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  ok((await page.locator('a[href="/story"]').count()) >= 1, 'gate links to the story');
  ok((await page.locator('a[href="/work"]').count()) >= 1, 'gate links to the work');
  const gateH1 = await page.evaluate(() => document.querySelectorAll('h1').length);
  ok(gateH1 === 1, `gate has exactly one h1 (${gateH1})`);
  // Analytics means the gate is no longer JS-free, so the assertion moved from
  // "zero scripts" to "nothing that blocks the parser". Every executable script
  // must be a module, or explicitly defer/async.
  const blocking = await page.evaluate(
    () =>
      [...document.scripts].filter((s) => {
        const executable = !s.type || /javascript|module/i.test(s.type);
        if (!executable) return false;
        return !(s.type === 'module' || s.defer || s.async);
      }).length,
  );
  ok(blocking === 0, `gate ships no render-blocking scripts (${blocking})`);

  for (const slug of ['driven', 'complytude', 'jeem']) {
    const r = await page.goto(`${BASE}/work/${slug}`, { waitUntil: 'domcontentloaded' });
    ok(r.status() === 200, `/work/${slug} renders`);
    const words = (await page.evaluate(() => document.body.textContent)).split(/\s+/).length;
    ok(words > 400, `/work/${slug} has real content (${words} words)`);
  }
  await page.goto(BASE + '/work', { waitUntil: 'domcontentloaded' });
  ok((await page.locator('a[href^="/work/"]').count()) === 3, 'work index reaches all three projects without JS');

  // Both worlds reachable from anywhere inside either one.
  for (const from of ['/story', '/work', '/work/driven', '/work/complytude', '/work/jeem']) {
    await page.goto(BASE + from, { waitUntil: 'domcontentloaded' });
    const hasStory = (await page.locator('nav[aria-label="Sections"] a[href="/story"]').count()) === 1;
    const hasWork = (await page.locator('nav[aria-label="Sections"] a[href="/work"]').count()) === 1;
    const hasGate = (await page.locator('nav[aria-label="Sections"] a[href="/"]').count()) === 1;
    const marked = (await page.locator('nav[aria-label="Sections"] a[aria-current="page"]').count()) === 1;
    ok(hasStory && hasWork && hasGate && marked, `${from}: both worlds and the gate one click away`);
  }
  await ctx.close();
}

// --- 3c. No analytics off the production host -------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const beacons = [];
  await page.route(/clarity\.ms|\/_vercel\/(insights|speed-insights)/, (r) => {
    beacons.push(r.request().url());
    return r.abort();
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  console.log('\nAnalytics containment');
  ok(beacons.length === 0, `no analytics beacons off the production host (${beacons.length})`);
  await ctx.close();
}

// --- 4. Semantics and keyboard ----------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('\nSemantics and keyboard');
  const h1s = await page.evaluate(() => document.querySelectorAll('h1').length);
  ok(h1s === 1, `exactly one h1 (${h1s})`);
  ok(await page.locator('.stage[aria-hidden="true"]').count() === 1, 'canvas stage is aria-hidden');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.className || document.activeElement?.tagName);
  ok(String(focused).includes('skip'), `first tab reaches the skip link (got "${focused}")`);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor);
  ok(outline !== 'rgba(0, 0, 0, 0)', `focus ring is painted (${outline})`);
  // the badge must open by keyboard alone
  await page.locator('summary.aside__summary').focus();
  await page.keyboard.press('Enter');
  ok(await page.locator('details.aside[open]').count() === 1, 'info badge opens by keyboard');
  await ctx.close();
}

// --- 5. Crawlability and share cards ----------------------------------------
// Only meaningful against a build: robots.txt and the sitemap are emitted at
// build time, so run this against `astro preview`, not `astro dev`.
{
  const ctx = await browser.newContext();
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nCrawlability and share cards');

  const robots = await page.goto(BASE + '/robots.txt');
  const robotsText = robots.status() === 200 ? await robots.text() : '';
  ok(robots.status() === 200, `robots.txt is served (${robots.status()})`);
  ok(robotsText.includes('Sitemap:'), 'robots.txt points at the sitemap');
  ok(robotsText.includes('Disallow: /og'), 'robots.txt keeps crawlers out of /og');

  const index = await page.goto(BASE + '/sitemap-index.xml');
  ok(index.status() === 200, `sitemap-index.xml is served (${index.status()})`);

  const map = await page.goto(BASE + '/sitemap-0.xml');
  const xml = map.status() === 200 ? await map.text() : '';
  for (const route of ['/', '/story/', '/work/', '/work/driven/', '/work/complytude/', '/work/jeem/']) {
    ok(xml.includes(`<loc>https://www.yazan-ali.net${route}</loc>`), `sitemap lists ${route}`);
  }
  ok(!xml.includes('/og'), 'sitemap excludes the card-render pages');

  // A shared case study has to show the case study, not the generic site card.
  const cards = new Set();
  for (const slug of ['driven', 'complytude', 'jeem']) {
    await page.goto(`${BASE}/work/${slug}`, { waitUntil: 'domcontentloaded' });
    const card = await page.getAttribute('meta[property="og:image"]', 'content');
    cards.add(card);
    ok(card?.endsWith(`/og/${slug}.jpg`), `/work/${slug} shares its own card (${card?.split('/').pop()})`);
    // The tag is absolute and points at production; check the file on the build
    // under test, not on the live site.
    const img = await page.goto(`${BASE}/og/${slug}.jpg`);
    ok(img.status() === 200, `that card file is in the build (${img.status()})`);
  }
  ok(cards.size === 3, `the three case studies share three different cards (${cards.size})`);

  // A real unknown route, not /404 itself: requesting the page directly is a
  // hit on a file that exists, and answers 200.
  const lost = await page.goto(BASE + '/this-route-does-not-exist');
  ok(lost.status() === 404, `unknown routes answer 404 (${lost.status()})`);
  ok((await page.locator('.lost__doors a').count()) === 2, '404 offers both worlds');
  await ctx.close();
}

// --- 6. The way out ----------------------------------------------------------
// A reader who finishes a case study has to be able to reach him from there.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nContact path');

  for (const route of ['/work', '/work/driven', '/work/complytude', '/work/jeem']) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    const mail = page.locator('.close__mail');
    ok(await mail.count() === 1, `${route} offers an address`);
    const href = await mail.getAttribute('href');
    ok(href === 'mailto:yazan.ali.dev@gmail.com', `${route} address is a mailto (${href})`);
  }

  await page.goto(BASE + '/story', { waitUntil: 'domcontentloaded' });
  ok(await page.locator('a[href^="mailto:"]').count() >= 1, '/story still closes with an address');
  await ctx.close();
}

// --- 7. Keyboard into the room -----------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('\nKeyboard into the room');

  let reached = false;
  for (let i = 0; i < 8 && !reached; i++) {
    await page.keyboard.press('Tab');
    const cls = await page.evaluate(() => document.activeElement?.className || '');
    reached = String(cls).includes('studio__keys');
  }
  ok(reached, 'tabbing reaches the room');

  await page.waitForTimeout(400);
  ok(await page.locator('.studio__legend').isVisible(), 'focus explains the keys it took');

  const card = page.locator('.studio__label').first();
  const first = (await card.innerText()).split('\n')[0];
  ok(await card.isVisible(), `focus lands on something (${first})`);

  // Ten stops: three projects, then seven desk notes, each named once.
  const walk = new Set([first]);
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(140);
    walk.add((await card.innerText()).split('\n')[0]);
  }
  ok(walk.size === 10, `every item is its own stop (${walk.size} of 10)`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok(!(await card.isVisible()), 'Escape leaves the room');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  // `URL` is taken at module scope, so compare the string.
  const landed = page.url().replace(BASE, '');
  ok(landed.startsWith('/work/driven'), `Enter opens a project (${landed})`);
  await ctx.close();
}

// --- 8. Arrows without tabbing -----------------------------------------------
// The shipped first version answered nothing until five invisible tab stops had
// been cleared, and this suite passed the whole time because it only ever tested
// the tabbed path. These check what a reader actually does.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('\nArrows without tabbing');

  const card = page.locator('.studio__label').first();
  const scrollY = () => page.evaluate(() => window.scrollY);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  ok(await card.isVisible(), 'an arrow answers on a page nobody has tabbed into');

  const first = (await card.innerText()).split('\n')[0];
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(220);
  ok((await card.innerText()).split('\n')[0] !== first, 'arrows walk the room');

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(220);
  ok((await card.innerText()).split('\n')[0] === first, 'and walk back');

  // The vertical arrows belong to the page until the room is focused on purpose.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  ok((await scrollY()) > 0, `the page still scrolls (${await scrollY()}px)`);

  // A control the reader is operating keeps its own keys.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.focus('a[href="/story"]');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  ok(!(await card.isVisible()), 'arrows are left alone while a link has focus');
  await ctx.close();
}

// --- 9. The shirt page (/hi) -------------------------------------------------
// A stranger, on a phone, one-handed, fifteen seconds. Everything has to be in
// reach without scrolling, and the contact card has to be complete.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/hi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  console.log('\nThe shirt page');

  const box = await page.evaluate(() => ({
    scrolls: document.documentElement.scrollHeight > window.innerHeight + 1,
    x: document.documentElement.scrollWidth - window.innerWidth,
    ground: getComputedStyle(document.body).backgroundColor,
    face: getComputedStyle(document.querySelector('.hi__name')).fontFamily,
  }));
  ok(!box.scrolls, 'nothing is below the fold at 390x844');
  ok(box.x === 0, `no sideways overflow (${box.x}px)`);
  ok(box.ground === 'rgb(14, 17, 22)', `the shirt's ground colour (${box.ground})`);
  ok(/plex mono/i.test(box.face), 'IBM Plex Mono is the face');

  // Every action, primary and secondary, has to clear a fingertip.
  const actions = await page.evaluate(() =>
    [...document.querySelectorAll('.hi__save, .hi__wa, .hi__more a')].map((a) => ({
      label: a.textContent.trim().split('\n')[0],
      h: Math.round(a.getBoundingClientRect().height),
      bottom: Math.round(a.getBoundingClientRect().bottom),
      href: a.getAttribute('href'),
    })),
  );
  /*
   * The stack. Three layers, because the grouping is the claim: a flat list
   * says "knows some tools". It still has to fit without costing the actions
   * their place on the screen.
   */
  const stack = await page.evaluate(() => {
    const dl = document.querySelector('.hi__stack');
    const rows = [...dl.querySelectorAll('.hi__layer')];
    const items = [...dl.querySelectorAll('.hi__layer dd span')];
    return {
      rows: rows.length,
      labels: rows.map((r) => r.querySelector('dt').textContent.trim()),
      count: items.length,
      // A wrap means the label column has lost and a line has been spent.
      wrapped: rows.some((r) => r.querySelector('dd').getBoundingClientRect().height > 30),
      svgs: dl.querySelectorAll('svg').length,
      marks: new Set(items.map((i) => getComputedStyle(i.querySelector('svg')).color)).size,
      // AWS is a wordmark and carries its own name, so it has no text label.
      unlabelled: items.filter((i) => !i.textContent.trim()).length,
      label: dl.getAttribute('aria-label') || '',
      hidden: rows.every((r) => r.getAttribute('aria-hidden') === 'true'),
    };
  });
  /*
   * Structure, not counts. The stack changes often, and a hardcoded "eight
   * things" just fails on the next edit without catching anything real.
   */
  ok(stack.rows >= 3, `grouped into layers (${stack.labels.join(', ')})`);
  ok(stack.count >= stack.rows * 2, `every layer carries more than one thing (${stack.count} in ${stack.rows})`);
  ok(!stack.wrapped, 'no layer wraps onto a second line');
  ok(stack.svgs === stack.count, `every item has a real mark (${stack.svgs} of ${stack.count})`);
  ok(stack.marks >= stack.count - 2, `tinted with its own colour (${stack.marks} distinct of ${stack.count})`);
  ok(stack.unlabelled === 1, `only the AWS wordmark goes unlabelled (${stack.unlabelled})`);
  ok(/TypeScript/.test(stack.label) && /Docker/.test(stack.label), 'and reads as one sentence for a screen reader');
  ok(stack.hidden, 'with the layer rows hidden from it');

  ok(actions.length === 5, `five actions and nothing else (${actions.length})`);

  /*
   * The three places to read come first and the two ways to make contact come
   * last, nearest the thumb. The card holds its weight by being the only
   * filled element, not by being first.
   */
  const reads = actions.slice(0, 3).map((a) => a.label).join(', ');
  ok(reads === 'My work, My story, LinkedIn', `the places to read lead, in order (${reads})`);
  ok(actions[4].label.includes('WhatsApp'), `WhatsApp is last (${actions[4].label})`);
  ok(actions.every((a) => a.h >= 44), `every target clears 44px (smallest ${Math.min(...actions.map((a) => a.h))}px)`);
  ok(actions.every((a) => a.bottom <= 844), 'every target is inside the viewport');

  ok(actions[3].href === '/hi.vcf', `the contact card sits above WhatsApp (${actions[3].href})`);

  const wa = actions.find((a) => a.href.includes('wa.me')).href;
  ok(/^https:\/\/wa\.me\/971528556635\?text=/.test(wa), `wa.me deep link, digits only (${wa.split('?')[0]})`);
  ok(decodeURIComponent(wa).includes('Hi Yazan, I scanned your shirt.'), 'and the message is prefilled');

  // The card itself: every field the brief named has to be in it.
  const vcf = await page.goto(BASE + '/hi.vcf');
  const text = await vcf.text();
  ok(vcf.status() === 200, `/hi.vcf is served (${vcf.status()})`);
  for (const field of ['FN:Yazan Ali', 'TEL', 'EMAIL', 'URL:https://www.yazan-ali.net', 'linkedin.com/in/']) {
    ok(text.includes(field), `the card carries ${field.split(':')[0]}`);
  }
  ok(!/\n[A-Z-]+:\s*$/m.test(text), 'the card has no empty fields');
  ok(text.includes('\r\n'), 'CRLF line endings, as vCard asks');

  // A QR destination has no business in search results.
  const map = await page.goto(BASE + '/sitemap-0.xml');
  ok(!(await map.text()).includes('/hi'), 'and it stays out of the sitemap');
  await ctx.close();
}

// --- 10. The portrait showroom -----------------------------------------------
// On a phone the room is a landscape composition in a portrait window. These
// check that one artifact is framed at a time and that a swipe moves along the
// desk without stealing the page's own scroll.
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  console.log('\nThe portrait showroom');

  const name = () => page.locator('.studio__shotname').innerText().then((t) => t.trim());
  const href = () => page.locator('.studio__shotcta').getAttribute('href');

  ok(await page.locator('.studio__shot').isVisible(), 'a caption names what is in shot');
  ok((await page.locator('.studio__dots span').count()) === 3, 'three shots, three dots');

  /*
   * The swipe was invisible: a gesture leaves no mark on the page, so nobody
   * knew it was there. These controls are the affordance, and they are also
   * the way in for anyone who would never think to swipe.
   */
  const steps = page.locator('.studio__step');
  ok((await steps.count()) === 2, 'there are visible previous and next controls');
  const sb = await steps.first().boundingBox();
  ok(sb.width >= 44 && sb.height >= 44, `they clear 44px (${Math.round(sb.width)}x${Math.round(sb.height)})`);
  ok((await page.locator('.studio__count').innerText()).trim() === '1 of 3', 'and a count says how many there are');

  await steps.last().click();
  await page.waitForTimeout(800);
  ok((await name()) === 'Jeem', `the next control moves a shot (${await name()})`);
  ok(!page.url().includes('/work/'), 'and does not fall through to the room underneath');
  await steps.first().click();
  await page.waitForTimeout(800);
  ok((await name()) === 'Driven Properties', 'the previous control moves back');

  // The posters are desktop dressing; on a phone they only crowd the shot.
  const posters = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => /umm-kulthum|death-note/.test(r.name)).length,
  );
  ok(posters === 0, `the wall posters are not fetched on a phone (${posters})`);
  ok((await name()) === 'Driven Properties', `opens on the first artifact (${await name()})`);

  // The screenshot has to be readable, which is the whole reason for this mode.
  const wide = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return Math.round(c.getBoundingClientRect().width);
  });
  ok(wide >= 360, `the stage uses the full width (${wide}px)`);

  const swipe = async (dx) => {
    const b = await page.locator('.studio').boundingBox();
    const y = b.y + b.height * 0.42;
    const x = b.x + b.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(x + (dx * i) / 6, y);
    await page.mouse.up();
    await page.waitForTimeout(800);
  };

  await swipe(-140);
  ok((await name()) === 'Jeem', `a swipe moves along the desk (${await name()})`);
  ok((await href()) === '/work/jeem', `and the link follows (${await href()})`);

  await swipe(-140);
  ok((await name()) === 'Complytude', `and again (${await name()})`);

  // Wraps rather than clamping: a swipe that does nothing reads as broken.
  await swipe(-140);
  ok((await name()) === 'Driven Properties', `past the end it wraps (${await name()})`);

  await swipe(140);
  ok((await name()) === 'Complytude', 'and wraps backwards too');

  // Vertical gestures still belong to the page.
  const before = await name();
  const b = await page.locator('.studio').boundingBox();
  await page.mouse.move(b.x + 195, b.y + 200);
  await page.mouse.down();
  await page.mouse.move(b.x + 195, b.y + 60);
  await page.mouse.up();
  await page.waitForTimeout(400);
  ok((await name()) === before, 'a vertical drag scrolls rather than changing shot');

  // The heading and the section links must not stack on top of each other.
  const layout = await page.evaluate(() => {
    const nav = document.querySelector('.studio__nav').getBoundingClientRect();
    const head = document.querySelector('.work__head').getBoundingClientRect();
    return { clear: head.top >= nav.bottom - 1, caption: !!document.querySelector('.studio__shot') };
  });
  ok(layout.clear, 'the heading sits clear of the section links');
  await ctx.close();
}

// --- 11. The room on a wide screen is untouched ------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('\nThe room on a wide screen');
  const m = await page.evaluate(() => ({
    caption: !!document.querySelector('.studio__shot'),
    stage: Math.round(document.querySelector('.studio').getBoundingClientRect().height),
    head: getComputedStyle(document.querySelector('.studio__head')).position,
  }));
  ok(!m.caption, 'no showroom caption: the whole room fits');
  ok(m.stage > 700, `the stage still fills the screen (${m.stage}px)`);
  ok(m.head === 'absolute', 'the heading still sits over the room');
  await ctx.close();
}

// --- 12. Arrival, transitions and reading progress ---------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nArrival and polish');

  // The scene used to appear in one frame: black rectangle, then a room.
  await page.goto(BASE + '/work', { waitUntil: 'domcontentloaded' });
  const pre = await page.evaluate(() => {
    const c = document.querySelector('.studio__canvas');
    return c ? { lit: c.hasAttribute('data-lit'), t: getComputedStyle(c).transitionDuration } : null;
  });
  ok(pre && !pre.lit, 'the canvas starts unlit');
  ok(pre && parseFloat(pre.t) > 0, `and is faded up rather than popped (${pre?.t})`);
  await page.waitForSelector('.studio__canvas[data-lit]', { timeout: 30000 });
  ok(true, 'the scene marks itself lit once it exists');

  // One continuous surface between the two worlds, with no router.
  const vt = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => {
      try {
        return [...sheet.cssRules].some((r) => /@view-transition/.test(r.cssText));
      } catch {
        return false;
      }
    }),
  );
  ok(vt, 'cross-document view transitions are declared');

  // A duplicate name silently cancels the whole transition.
  for (const route of ['/story', '/work', '/work/driven']) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    const n = await page.evaluate(
      () => [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).viewTransitionName === 'worlds').length,
    );
    ok(n === 1, `${route} names the nav exactly once (${n})`);
  }

  // Reading progress, driven by the scroll timeline rather than a listener.
  await page.goto(BASE + '/work/driven', { waitUntil: 'networkidle' });
  const width = () =>
    page.evaluate(() => Math.round(document.querySelector('.cs__progress').getBoundingClientRect().width));
  ok((await width()) === 0, `the progress line starts empty (${await width()}px)`);
  await page.evaluate(() => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * 0.5));
  await page.waitForTimeout(400);
  const half = await width();
  ok(half > 400 && half < 900, `it tracks the scroll (${half}px of 1280)`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  ok((await width()) >= 1270, `and fills at the end (${await width()}px)`);
  await ctx.close();
}

// --- 13. None of it runs under reduced motion --------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nReduced motion');

  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForSelector('.studio__canvas[data-lit]', { timeout: 30000 });
  const t = await page.evaluate(() => getComputedStyle(document.querySelector('.studio__canvas')).transitionDuration);
  ok(parseFloat(t) < 0.01, `the canvas does not fade (${t})`);

  await page.goto(BASE + '/work/driven', { waitUntil: 'domcontentloaded' });
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('.cs__progress')).display);
  ok(d === 'none', `and there is no progress line (${d})`);
  await ctx.close();
}

// --- 14. Nothing 404s, and every target is thumb-sized -----------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  console.log('\nBroken requests and tap targets');

  const routes = ['/', '/story', '/work', '/work/driven', '/work/complytude', '/work/jeem', '/hi'];

  /*
   * Every case study used to request /lib/analytics and get a 404, so scroll
   * depth was never recorded once. `define:vars` emits a script inline, and the
   * browser then resolved the relative import against the page URL instead of
   * Astro resolving it at build time. Cheap to check for every page at once.
   */
  const failed = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(BASE, '')}`);
  });

  let undersized = [];
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a,button')]
        .map((el) => ({ el, b: el.getBoundingClientRect() }))
        // Links inside running prose are exempt: WCAG 2.5.8 covers standalone
        // targets, not words in a sentence.
        .filter(({ el, b }) => b.width > 0 && b.height > 0 && b.height < 24 && !el.closest('.prose'))
        .map(({ el, b }) => `${Math.round(b.height)}px "${(el.textContent || '').trim().slice(0, 18)}"`),
    );
    if (small.length) undersized.push(`${route}: ${small.join(', ')}`);
  }

  ok(failed.length === 0, `no request fails across all ${routes.length} pages (${failed.slice(0, 3).join(', ') || 'none'})`);
  ok(undersized.length === 0, `every standalone target clears 24px (${undersized.slice(0, 2).join(' | ') || 'all pass'})`);

  // The number on a case study has to match its place in the list.
  for (const [route, want] of [['/work/complytude', '01'], ['/work/driven', '02'], ['/work/jeem', '03']]) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    const n = (await page.locator('.cs__index').innerText()).trim();
    ok(n === want, `${route} is numbered ${n}`);
  }

  // The depth tracking has to actually ship with the page it measures.
  await page.goto(BASE + '/work/driven', { waitUntil: 'domcontentloaded' });
  const wired = await page.evaluate(() =>
    [...document.querySelectorAll('script[src]')].some((s) => s.src.includes('CaseStudy.astro')),
  );
  ok(wired, 'the case study script is bundled rather than inlined');
  await ctx.close();
}

await browser.close();
console.log(`\n${fail.length === 0 ? 'ALL CHECKS PASS' : fail.length + ' FAILURES'}`);
