import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
import { projects } from '../src/content/projects.ts';

const origin = process.argv[2] || 'http://localhost:4321';

// The site card, plus one per case study so a shared /work/<id> link shows the
// project rather than the generic site image.
const cards = [
  { url: '/og', out: 'public/og.jpg' },
  ...projects.map((p) => ({ url: `/og/${p.id}`, out: `public/og/${p.id}.jpg` })),
];

await mkdir('public/og', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await blockAnalytics(page);

for (const card of cards) {
  await page.goto(origin + card.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  // Astro scopes component <style>, so the dev toolbar can't be hidden from
  // inside the page. Remove the element instead — works in dev and in preview.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await page.waitForTimeout(150);

  const box = await page.locator('.card').boundingBox();
  if (Math.round(box.width) !== 1200 || Math.round(box.height) !== 630) {
    throw new Error(`${card.url} is ${box.width}x${box.height}, expected 1200x630`);
  }

  // JPEG: these are flat dark gradients, and a 2x PNG runs over 1MB each.
  await page.locator('.card').screenshot({ path: card.out, type: 'jpeg', quality: 92 });
  console.log(`wrote ${card.out}`);
}

await browser.close();
