import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await blockAnalytics(ctx);
const page = await ctx.newPage();
const failed = [];
page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });

let small = 0;
for (const r of ['/', '/story', '/work', '/work/complytude', '/work/driven', '/work/jeem', '/hi']) {
  await page.goto('https://www.yazan-ali.net' + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  small += await page.evaluate(() => [...document.querySelectorAll('a,button')]
    .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 24 && !el.closest('.prose'); }).length);
}
console.log('  failed requests    :', failed.length ? failed.join(', ') : 'none');
console.log('  undersized targets :', small);
for (const [r, w] of [['/work/complytude','01'],['/work/driven','02'],['/work/jeem','03']]) {
  await page.goto('https://www.yazan-ali.net' + r, { waitUntil: 'domcontentloaded' });
  const n = (await page.locator('.cs__index').innerText()).trim();
  console.log(`  ${r.padEnd(18)} numbered ${n} ${n === w ? '' : '<-- WRONG'}`);
}
await browser.close();
