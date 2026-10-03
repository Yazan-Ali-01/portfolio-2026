import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

/**
 * The portrait for the video panel.
 *
 * Left in the orientation it was recorded in. The camera saved its mirrored
 * preview, so the poster behind him reads backwards — but the embed plays that
 * same asset, and correcting only the still would flip his face the instant
 * someone pressed play.
 */
const SP = '/private/tmp/claude-501/-Users-yazan-ali-Desktop/7a5e7dbc-e342-449d-9af4-2ee7b5dbad3d/scratchpad';
const src = 'data:image/jpeg;base64,' + readFileSync(`${SP}/final.jpg`).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async (src) => {
  const im = new Image();
  im.src = src;
  await im.decode();

  // A square window on head and shoulders, centred on his face rather than on
  // the frame: he sits left of centre.
  const S = 280;
  const sw = 880;
  const sx = 60;
  const sy = Math.round(im.height * 0.29);
  // He holds his head a few degrees off vertical in the frame.
  const TILT = 4;

  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  // Graded down so it does not glare inside a near-black panel.
  ctx.filter = 'saturate(0.8) brightness(0.88) contrast(1.06)';
  ctx.translate(S / 2, S / 2);
  ctx.rotate((TILT * Math.PI) / 180);
  // Rotating about the centre leaves the corners of the square empty, which
  // costs nothing: the panel clips this to the inscribed circle, and any
  // square at least as wide as the output still covers that circle. The 2%
  // is only to keep the tangent points off the antialiased edge.
  const D = S * 1.02;
  ctx.drawImage(im, sx, sy, sw, sw, -D / 2, -D / 2, D, D);
  return c.toDataURL('image/jpeg', 0.8);
}, src);

const buf = Buffer.from(out.split(',')[1], 'base64');
writeFileSync('public/video/intro-face.jpg', buf);
writeFileSync(`${SP}/face-preview.jpg`, buf);
console.log(`  public/video/intro-face.jpg: ${buf.length} bytes`);
await browser.close();
