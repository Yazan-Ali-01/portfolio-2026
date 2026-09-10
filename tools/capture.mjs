import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const targets = [
  { id: 'driven-listings', url: 'https://www.drivenproperties.com/properties-for-sale-in-dubai', w: 1440, h: 900 },
  { id: 'jeem-home', url: 'https://jeem.ai/', w: 1440, h: 900 },
];

mkdirSync('shots/work', { recursive: true });
const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2 });
  try {
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `shots/work/${t.id}.png` });
    console.log(`${t.id}: ok  title="${(await page.title()).slice(0, 70)}"`);
  } catch (e) {
    console.log(`${t.id}: FAILED ${e.message.split('\n')[0]}`);
  }
  await page.close();
}
await browser.close();
