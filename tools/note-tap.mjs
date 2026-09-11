import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';

/**
 * Desk notes must open by tap as well as hover. They did not: the card was
 * driven by the render loop's hover state, and touch never hovers.
 */
const BASE = process.argv[2] || 'http://localhost:4321';
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail.push(m); };

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3,
});
await blockAnalytics(ctx);
const page = await ctx.newPage();
await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const read = () => page.evaluate(() => {
  const el = document.querySelector('.studio__label');
  if (!el || el.hidden) return null;
  return { kind: el.dataset.kind, name: el.querySelector('.studio__name')?.textContent?.trim() };
});

const found = new Set();
for (let x = 8; x <= 384; x += 22) {
  for (let y = 250; y <= 620; y += 22) {
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(90);
    // A tap that navigates leaves the scene torn down; a plain goBack is not
    // enough, the island has to re-initialise before the next tap means anything.
    if (!/\/work$/.test(page.url())) {
      await page.goto(BASE + '/work', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1700);
      continue;
    }
    const card = await read();
    if (card?.kind === 'note') found.add(card.name);
  }
}
console.log('\nNotes opened by tap');
for (const n of found) console.log('   ', n);
ok(found.size >= 5, `at least five of the seven notes tappable (${found.size})`);

await ctx.close();
await browser.close();
console.log(`\n${fail.length === 0 ? 'NOTE TAP CHECKS PASS' : fail.length + ' FAILURES'}`);
