/**
 * The video introduction.
 *
 * Two places show it — the gate as a panel beside the statement, /hi as a
 * portrait that opens the player over the page — and this is the only file
 * that knows which recording that is.
 */
export const intro = {
  id: 19297,
  duration: '1:11',
  /** ISO 8601, for the VideoObject. Keep in step with `duration`. */
  iso: 'PT1M11S',
  title: 'A minute, to camera',
  /*
   * A frame of the video, cropped square and rotated level by tools/_face.mjs.
   * The rotation left the four corners of the file black, so every use clips
   * it to a circle. That is a requirement, not a style.
   */
  poster: '/video/intro-face.jpg',
} as const;

/**
 * What he says, as text.
 *
 * Lifted from the caption track on the asset behind the player, then corrected:
 * the machine heard "Yasan" for Yazan, "Folving" for solving, "Next.js" for
 * NestJS and "yazan-alli.net" for the domain, and it repeated two lines where
 * its thirty-second segments overlapped. Nothing else is changed — this is a
 * transcript, not a rewrite, so the spoken repetition and the sign-off stay.
 *
 * It exists for two reasons. Somebody who cannot or will not play a video can
 * still read what is in it, and it is two hundred words of him describing his
 * own work in the page rather than inside a third-party player, where no
 * search engine can reach it.
 */
export const transcript = [
  "Hi, I'm Yazan, a software engineer based in Dubai, with around six years of experience building web applications and scalable products. I'm self-taught. I work with startups and established companies across different industries.",
  'I work mainly with TypeScript, Node.js, React, Next.js and NestJS. Most of my experience has been around building products from requirements to production: solving technical challenges, improving performance, and building systems that are maintainable as they grow.',
  'I enjoy being hands-on with engineering, taking ownership of systems, discussing technical decisions, and working closely with engineers to build things the right way.',
  "At this stage, I'm looking to join a strong engineering team, where I can contribute to real products, take ownership, learn from other engineers, and continue growing as a software engineer.",
  "If you want to know more about me, my story, or the things I've built, you can find me at yazan-ali.net, where you can explore my work, check out my story, and find some of the things I've built. Thank you for watching, and see you around.",
] as const;

/**
 * Viddler's own embed, deliberately without `autoplay`.
 *
 * Asking for autoplay is what silences it. The player mutes itself whenever
 * autoplay is set and ignores `muted=0` alongside it — measured with the
 * browser's own autoplay policy disabled, so that is the player's choice and
 * not a permission we can delegate. A muted talking head is worth nothing, so
 * the player comes up paused instead and the viewer's press is the gesture
 * that starts it with sound.
 *
 * The alternative was to drop Viddler and play the Mux source directly, but
 * the asset publishes HLS only, with no MP4 rendition, and HLS outside Safari
 * needs a library this page is specified not to have.
 */
export const embedSrc = `https://viddler.com/embed/player?id=${intro.id}&color=default`;
