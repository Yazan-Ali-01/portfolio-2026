import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';

/**
 * Opening a project from the room must work by mouse AND by touch. It did not:
 * picking read hover state, and a tap never hovers, so taps resolved to nothing.
 *
 * The test locates the artifacts rather than hardcoding pixels, so it keeps
 * working when the room is recomposed.
 */
const BASE = process.argv[2] || 'http://localhost:4321';
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail.push(m); };
const PROJECT = /\/work\/(driven|complytude|jeem)$/;

async function open(ctx, point, touch) {
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (touch) await page.touchscreen.tap(point[0], point[1]);
  else await page.mouse.click(point[0], point[1]);
  await page.waitForTimeout(900);
  const url = page.url();
  await page.close();
  return PROJECT.test(url) ? url.split('/').pop() : null;
}

// --- desktop: hover tells us exactly where each artifact is -----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await blockAnalytics(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const found = {};
  for (let x = 240; x <= 1300; x += 30) {
    for (let y = 260; y <= 620; y += 40) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(45);
      const name = await page.evaluate(() => {
        const el = document.querySelector('.studio__label');
        return el && !el.hidden && el.dataset.kind === 'project'
          ? el.querySelector('.studio__name')?.textContent?.trim()
          : null;
      });
      if (name && !found[name]) found[name] = [x, y];
    }
  }
  await page.close();
  console.log('\nDesktop');
  ok(Object.keys(found).length === 3, `all three artifacts hoverable (${Object.keys(found).join(', ')})`);

  let opened = 0;
  for (const point of Object.values(found)) if (await open(ctx, point, false)) opened += 1;
  ok(opened === Object.keys(found).length, `clicking opens the case study (${opened}/${Object.keys(found).length})`);
  await ctx.close();
}

// --- phone: no hover, so sweep taps and see which projects are reachable ----
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3,
  });
  await blockAnalytics(ctx);
  const reached = new Set();
  for (let x = 60; x <= 330; x += 45) {
    for (let y = 260; y <= 440; y += 45) {
      const id = await open(ctx, [x, y], true);
      if (id) reached.add(id);
      if (reached.size === 3) break;
    }
    if (reached.size === 3) break;
  }
  console.log('\nPhone');
  ok(reached.size === 3, `all three reachable by tap (${[...reached].join(', ') || 'none'})`);
  await ctx.close();
}

await browser.close();
console.log(`\n${fail.length === 0 ? 'STUDIO CLICK CHECKS PASS' : fail.length + ' FAILURES'}`);
