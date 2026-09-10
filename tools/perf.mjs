import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4331/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

// Slow 4G + 4x CPU slowdown, roughly a mid-range phone.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: Math.round((1.6 * 1024 * 1024) / 8),
  uploadThroughput: Math.round((750 * 1024) / 8),
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

const res = [];
page.on('response', async r => {
  const t0 = Date.now();
  let size = 0;
  try { size = Number((await r.headerValue('content-length')) || 0); } catch {}
  res.push({ url: r.url(), size, at: t0 });
});

const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load' });
const marks = await page.evaluate(() => new Promise(resolve => {
  const out = {};
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.name === 'first-contentful-paint') out.fcp = e.startTime;
      if (e.entryType === 'largest-contentful-paint') { out.lcp = e.startTime; out.lcpEl = e.element?.tagName + '.' + (e.element?.className || ''); }
    }
  }).observe({ type: 'paint', buffered: true });
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) { out.lcp = e.startTime; out.lcpEl = e.element?.tagName + '.' + (e.element?.className || ''); }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  setTimeout(() => resolve(out), 2500);
}));
await page.waitForTimeout(2500);

const kind = u => /\.woff2/.test(u) ? 'font' : /\.css/.test(u) ? 'css' : /renderer|three/.test(u) ? 'three' :
  /gsap|ScrollTrigger/.test(u) ? 'gsap' : /\.js/.test(u) ? 'js' : /\.(jpg|png)/.test(u) ? 'image' : 'doc';
const by = {};
for (const r of res) { const k = kind(r.url); by[k] = (by[k] || 0) + r.size; }

console.log('\nThrottled: slow 4G + 4x CPU, 390px viewport');
console.log(`  FCP  ${Math.round(marks.fcp || 0)} ms`);
console.log(`  LCP  ${Math.round(marks.lcp || 0)} ms  (${marks.lcpEl})`);
console.log('\nTransferred by kind (content-length):');
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(6)} ${(v / 1024).toFixed(1)} KB`);
}
const three = res.find(r => /three\.module|renderer\./.test(r.url));
console.log('\nOrdering:');
console.log(`  three.js request started ${three ? Math.round(three.at - t0) : 'n/a'} ms after navigation`);
console.log(`  three.js starts after FCP: ${three && (three.at - t0) > (marks.fcp || 0) ? 'YES' : 'no'}`);
const html = await (await fetch(URL)).text();
console.log(`  three chunk referenced in initial HTML: ${/(three\.module|renderer)\.[A-Za-z0-9_-]+\.js/.test(html) ? 'YES (bad)' : 'no'}`);
const preloads = (html.match(/rel="preload"[^>]*/g) || []).length;
console.log(`  font preload links in HTML: ${preloads}`);
await browser.close();
