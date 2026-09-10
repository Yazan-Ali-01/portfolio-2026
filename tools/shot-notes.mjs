import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
 await blockAnalytics(p);
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4321/work', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await p.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());

// Sweep the desk surface and record which note each point reveals.
const found = {};
// Desk surface, then the wall above the left screen.
const bands = [575, 590, 605, 200, 230, 265];
for (let x = 180; x <= 1300; x += 22) {
  for (const y of bands) {
    await p.mouse.move(x, y);
    await p.waitForTimeout(70);
    const t = await p.evaluate(() => {
      const el = document.querySelector('.studio__label');
      if (!el || el.hidden) return null;
      return { kind: el.dataset.kind, name: el.querySelector('.studio__name')?.textContent };
    });
    if (t && t.kind === 'note' && !found[t.name]) found[t.name] = [x, y];
  }
}
console.log('notes reachable:', JSON.stringify(found, null, 1));

const shots = [['Umm Kulthum','umm-kulthum'], ['Death Note','death-note'], ['Mate','mate'], ['The keyboard','keyboard']];
for (const [name, file] of shots) {
  if (!found[name]) { console.log('MISS', name); continue; }
  const [x, y] = found[name];
  await p.mouse.move(x, y);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `shots/note-${file}.png` });
}
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
