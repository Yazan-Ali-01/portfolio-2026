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
  /*
   * A frame of the video, cropped square and rotated level by tools/_face.mjs.
   * The rotation left the four corners of the file black, so every use clips
   * it to a circle. That is a requirement, not a style.
   */
  poster: '/video/intro-face.jpg',
} as const;

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
