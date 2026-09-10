import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:4321/';
const out = process.argv[3] || '/tmp/shots';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const total = await page.evaluate(() => document.body.scrollHeight);
const vh = 900;
const stops = [0, 0.11, 0.22, 0.33, 0.45, 0.56, 0.67, 0.78, 0.89, 1];
let i = 0;
for (const s of stops) {
  await page.evaluate(y => window.scrollTo(0, y), Math.round((total - vh) * s));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/s${String(i).padStart(2,'0')}.png` });
  i++;
}
console.log('height', total, 'shots', i);
console.log('errors:', errors.length ? errors.slice(0,5).join(' | ') : 'none');
await browser.close();
