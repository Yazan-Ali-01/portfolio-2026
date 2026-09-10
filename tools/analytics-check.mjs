import { chromium } from 'playwright';

/**
 * The analytics contract. Deliberately does NOT import _no-analytics.mjs — its
 * job is to exercise the loader. Every outbound request is aborted at the
 * browser, so the requests are counted but nothing reaches Clarity or Vercel.
 *
 * `?analytics=force` is what lets the loader run at all on localhost: the site
 * otherwise refuses to run analytics off its production hosts.
 */
const BASE = process.argv[2] || 'http://localhost:4331';
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail.push(m); };
const BEACON = /clarity\.ms|\/_vercel\/(insights|speed-insights)/;

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hits = [];
  // Count the attempt, then kill it. Nothing leaves this machine.
  await page.route(BEACON, (route) => { hits.push(route.request().url()); return route.abort(); });
  return { ctx, page, hits };
}

// --- 1. the default: a non-production host must count nothing ---------------
{
  const { ctx, page, hits } = await newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  console.log('\nOff the production host');
  ok(hits.length === 0, `localhost loads no analytics at all (${hits.length} requests)`);
  await ctx.close();
}

// --- 2. forced: loads, but only after idle ----------------------------------
{
  const { ctx, page, hits } = await newPage();
  await page.goto(BASE + '/?analytics=force', { waitUntil: 'domcontentloaded' });
  const atPaint = hits.length;
  await page.waitForTimeout(4000);
  console.log('\nLoading order (forced)');
  ok(atPaint === 0, `nothing fetched at DOMContentLoaded (${atPaint})`);
  ok(hits.length >= 1, `fetched once idle (${hits.length} requests)`);
  await ctx.close();
}

// --- 3. events carry their properties ---------------------------------------
{
  const { ctx, page } = await newPage();
  await page.addInitScript(() => {
    window.va = (...a) => {
      const log = JSON.parse(sessionStorage.getItem('__ev') ?? '[]');
      log.push(a);
      sessionStorage.setItem('__ev', JSON.stringify(log));
    };
  });
  await page.goto(BASE + '/?analytics=force', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('a[data-ev="gate_choice"][data-ev-door="work"]').click();
  await page.waitForLoadState('domcontentloaded');
  const events = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__ev') ?? '[]'));
  const gate = events.find((e) => e[0] === 'event' && e[1]?.name === 'gate_choice');
  console.log('\nEvents');
  ok(!!gate, `gate_choice carries its door (${gate ? JSON.stringify(gate[1]) : 'none'})`);
  await ctx.close();
}

// --- 4. self-exclusion beats the force flag ---------------------------------
{
  const { ctx, page, hits } = await newPage();
  await page.goto(BASE + '/?analytics=off', { waitUntil: 'networkidle' });
  await page.goto(BASE + '/?analytics=force', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  console.log('\nSelf-exclusion');
  ok(hits.length === 0, `?analytics=off wins over ?analytics=force (${hits.length})`);

  await page.goto(BASE + '/?analytics=on', { waitUntil: 'networkidle' });
  await page.goto(BASE + '/?analytics=force', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  ok(hits.length > 0, `?analytics=on resumes counting (${hits.length})`);
  await ctx.close();
}

await browser.close();
console.log(`\n${fail.length === 0 ? 'ANALYTICS CHECKS PASS' : fail.length + ' FAILURES'}`);
