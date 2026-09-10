import { chromium } from 'playwright';
import { blockAnalytics } from './_no-analytics.mjs';
import { readFileSync } from 'node:fs';

/**
 * Texture budget (E10-T9). The full-size captures are 1.1 MB and 414 KB. As WebGL
 * textures they only ever fill a small quad, so they are re-rendered at 1024px
 * wide and written as JPEG. The originals stay for the case study pages.
 *
 * Files are read from disk and inlined as data URIs: page.setContent() produces an
 * about:blank document, which cannot fetch from the dev server.
 */
const jobs = [
  { src: 'public/work/driven-listings.png', out: 'driven', mime: 'image/png' },
  { src: 'public/work/jeem-answer.png', out: 'jeem', mime: 'image/png' },
  { src: 'public/work/complytude-architecture.svg', out: 'complytude', mime: 'image/svg+xml' },
  // The generated diorama sits in the middle of a lot of white; crop to it.
  {
    src: 'public/work/desk-miniature.jpg',
    out: 'miniature',
    mime: 'image/jpeg',
    crop: { x: 0.13, y: 0.19, w: 0.81, h: 0.6 },
  },
  // Wall posters. Smaller on screen than the artifacts, so smaller textures.
  { src: 'public/work/umm-kulthum.png', out: 'umm-kulthum', mime: 'image/png', width: 512 },
  { src: 'public/work/death-note.png', out: 'death-note', mime: 'image/png', width: 576 },
];

const DEFAULT_WIDTH = 1024;
const browser = await chromium.launch();

for (const job of jobs) {
  const WIDTH = job.width ?? DEFAULT_WIDTH;
  const data = readFileSync(job.src).toString('base64');
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 768 } });
  await blockAnalytics(page);
  await page.setContent(
    `<style>html,body{margin:0;background:#0B0B0C}` +
      `img{display:block;width:${WIDTH}px;height:auto}</style>` +
      `<img src="data:${job.mime};base64,${data}">`,
  );
  await page.waitForFunction(() => {
    const el = document.querySelector('img');
    return el && el.complete && el.naturalWidth > 0;
  });

  if (job.crop) {
    const nat = await page.evaluate(() => {
      const el = document.querySelector('img');
      return { w: el.naturalWidth, h: el.naturalHeight };
    });
    const c = job.crop;
    const scale = WIDTH / (c.w * nat.w);
    const outH = Math.round(c.h * nat.h * scale);
    await page.setContent(
      `<style>html,body{margin:0;background:#0B0B0C}` +
        `#w{position:relative;overflow:hidden;width:${WIDTH}px;height:${outH}px}` +
        `#w img{position:absolute;width:${nat.w * scale}px;height:auto;` +
        `left:${-c.x * nat.w * scale}px;top:${-c.y * nat.h * scale}px}</style>` +
        `<div id="w"><img src="data:${job.mime};base64,${data}"></div>`,
    );
    await page.waitForFunction(() => {
      const el = document.querySelector('img');
      return el && el.complete && el.naturalWidth > 0;
    });
    await page
      .locator('#w')
      .screenshot({ path: `public/work/tex/${job.out}.jpg`, type: 'jpeg', quality: 84 });
    console.log(`${job.out}.jpg  ${WIDTH}x${outH}  (cropped)`);
    await page.close();
    continue;
  }

  const img = page.locator('img');
  await img.screenshot({ path: `public/work/tex/${job.out}.jpg`, type: 'jpeg', quality: 82 });
  const box = await img.boundingBox();
  console.log(`${job.out}.jpg  ${Math.round(box.width)}x${Math.round(box.height)}`);
  await page.close();
}

await browser.close();
