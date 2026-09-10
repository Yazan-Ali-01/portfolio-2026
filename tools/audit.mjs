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

await browser.close();
console.log(`\n${fail.length === 0 ? 'ALL CHECKS PASS' : fail.length + ' FAILURES'}`);
