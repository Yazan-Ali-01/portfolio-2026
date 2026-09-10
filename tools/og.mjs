import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
 await blockAnalytics(page);
 await blockAnalytics(page);
await page.goto((process.argv[2] || 'http://localhost:4321') + '/og', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// Astro scopes component <style>, so the dev toolbar can't be hidden from inside
// the page. Remove the element instead — works in dev and in preview.
await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
await page.waitForTimeout(150);
const box = await page.locator('.card').boundingBox();
if (Math.round(box.width) !== 1200 || Math.round(box.height) !== 630) {
  throw new Error(`card is ${box.width}x${box.height}, expected 1200x630`);
}
// JPEG: the card is a flat dark gradient, and a 2x PNG of it runs over 1MB.
await page.locator('.card').screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 92 });
console.log('wrote public/og.jpg');
await browser.close();
