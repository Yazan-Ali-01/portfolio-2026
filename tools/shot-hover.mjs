import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4321/work', { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await p.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
// Probe for a monitor rather than guessing a pixel.
const probes = [[520, 390], [520, 430], [600, 400], [430, 380], [900, 420], [880, 430]];
let hit = null;
for (const [x, y] of probes) {
  await p.mouse.move(x, y);
  await p.waitForTimeout(450);
  const t = await p.evaluate(() => {
    const el = document.querySelector('.studio__label');
    return el && !el.hidden ? el.textContent.trim() : null;
  });
  if (t) { hit = [x, y, t]; break; }
}
console.log('hit:', JSON.stringify(hit));
await p.waitForTimeout(900);
await p.screenshot({ path: 'shots/studio-hover.png' });
const label = await p.evaluate(() => {
  const el = document.querySelector('.studio__label');
  return el ? { text: el.textContent.trim(), hidden: el.hidden, transform: getComputedStyle(el).transform } : null;
});
console.log('label:', JSON.stringify(label));
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
