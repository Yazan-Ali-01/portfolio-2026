import { embedSrc } from '../content/intro';
import { track } from '../lib/analytics';

/**
 * The two ways the video introduction is opened, sharing one player.
 *
 * Viddler ships a script-tag embed that builds the player for you. This
 * deliberately does not use it: that script would run on every page load, can
 * change under us without notice, and would put a third party on the critical
 * path of the two pages that have to be fast. Markup and one listener instead,
 * and nothing reaches viddler.com until a click.
 */
function player(): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.src = embedSrc;
  frame.className = 'intro__frame';
  frame.title = 'Video introduction';
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  frame.setAttribute('frameborder', '0');
  return frame;
}

/** The gate: the poster becomes the player in place. */
export function initIntroPanel(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-intro-panel]')) {
    // `once`, because the button is gone the moment it has fired.
    button.addEventListener('click', () => button.replaceWith(player()), { once: true });
  }
}

/**
 * /hi: the portrait opens the player over the page.
 *
 * Over, not in. That first screen is exactly one screen and every row on it is
 * load-bearing; there is nowhere to put a 9:16 frame without moving the
 * contact card out from under a thumb already aimed at it. A dialog also means
 * closing returns the reader to that card rather than to a back button.
 */
export function initIntroFilm(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-intro-dialog]');
  const open = document.querySelector<HTMLButtonElement>('[data-intro-open]');
  const slot = document.querySelector<HTMLElement>('[data-intro-slot]');
  const close = document.querySelector<HTMLButtonElement>('[data-intro-close]');
  if (!dialog || !open || !slot || !close) {
    throw new Error('intro: the film needs an opener, a dialog, a slot and a close');
  }

  open.addEventListener('click', () => {
    slot.replaceChildren(player());
    dialog.showModal();
    /*
     * Focus the close button rather than letting the dialog pick. Left alone
     * it lands on the iframe, and from inside a cross-origin frame Escape
     * belongs to viddler.com: the dialog stays open and the page is stuck.
     */
    close.focus();
    track('hi_action', { page: location.pathname, channel: 'intro' });
  });

  /*
   * Emptying the slot is what stops the sound: the embed exposes no API to ask
   * it to pause, so the player is built on each open and thrown away on each
   * close.
   *
   * Escape is the browser's, and it only reaches this dialog while focus is
   * still in this document. Once someone has pressed play, focus is inside
   * viddler.com and the key goes there instead — which is why Close is a real
   * button across the full width rather than a hint.
   */
  dialog.addEventListener('close', () => slot.replaceChildren());

  // A click that lands on the dialog itself landed on the backdrop.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  close.addEventListener('click', () => dialog.close());
}
