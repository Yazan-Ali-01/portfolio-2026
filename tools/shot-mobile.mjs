import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const total = await page.evaluate(() => document.body.scrollHeight);
let i = 0;
for (const s of [0, 0.5, 0.78]) {
  await page.evaluate(y => window.scrollTo(0, y), Math.round((total - 844) * s));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/m${i}.png` });
  i++;
}
console.log('mobile shots', i, 'height', total);
await browser.close();
