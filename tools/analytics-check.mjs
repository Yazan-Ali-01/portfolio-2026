import { chromium } from 'playwright';

/**
 * Verifies the analytics contract: nothing before first paint, everything after
 * idle, events actually fire, and the opt-out switch really excludes.
 */
const BASE = process.argv[2] || 'http://localhost:4331';
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail.push(m); };

const watch = (page) => {
  const hits = [];
  page.on('request', r => {
    const u = r.url();
    if (/_vercel\/insights|_vercel\/speed-insights|clarity\.ms/.test(u)) hits.push(u);
  });
  return hits;
};

// --- 1. nothing fetched before LCP ------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hits = watch(page);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const atPaint = hits.length;
  await page.waitForTimeout(4000);
  console.log('\nLoading order');
  ok(atPaint === 0, `nothing analytics-related fetched at DOMContentLoaded (${atPaint})`);
  ok(hits.length >= 1, `analytics fetched once idle (${hits.length} requests)`);
  await ctx.close();
}

// --- 2. events fire ----------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Stub `va` into sessionStorage: clicking a door navigates, and anything held
  // in a page variable dies with the document before it can be read.
  await page.addInitScript(() => {
    window.va = (...a) => {
      const log = JSON.parse(sessionStorage.getItem('__ev') ?? '[]');
      log.push(a);
      sessionStorage.setItem('__ev', JSON.stringify(log));
    };
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('a[data-ev="gate_choice"][data-ev-door="work"]').click();
  await page.waitForLoadState('domcontentloaded');
  const events = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__ev') ?? '[]'));
  console.log('\nEvents');
  const gate = events.find(e => e[0] === 'event' && e[1]?.name === 'gate_choice');
  ok(!!gate, `gate_choice fires with the door recorded (${gate ? JSON.stringify(gate[1]) : 'none'})`);
  await ctx.close();
}

// --- 3. opt-out really excludes ---------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hits = watch(page);
  await page.goto(BASE + '/?analytics=off', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const afterOptOut = hits.length;
  await page.goto(BASE + '/story', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  console.log('\nSelf-exclusion');
  ok(afterOptOut === 0, `?analytics=off loads nothing (${afterOptOut})`);
  ok(hits.length === 0, `exclusion persists to the next page (${hits.length})`);

  await page.goto(BASE + '/?analytics=on', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  ok(hits.length > 0, `?analytics=on resumes counting (${hits.length})`);
  await ctx.close();
}

await browser.close();
console.log(`\n${fail.length === 0 ? 'ANALYTICS CHECKS PASS' : fail.length + ' FAILURES'}`);
