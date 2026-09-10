/**
 * The things in the room, and why they're there.
 *
 * Hovering one in the studio shows the note. This is Yazan's voice, drafted:
 * the mate, the books and the posters are about his life rather than his code,
 * so he should keep editing until they sound like him saying them.
 */

export type DeskNote = {
  id: string;
  title: string;
  body: string;
};

export const deskNotes: DeskNote[] = [
  {
    id: 'mate',
    title: 'Mate',
    body: "Syrians drink more of this than anyone else on earth, which throws people until they hear why. Families who'd emigrated to Argentina came home, and the habit came home with them. I go through a lot of it. The thermos isn't decoration, it's the whole operation, and the first round is usually gone before I've properly woken up.",
  },
  {
    id: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    body: "Picked this up during the night sessions, back when nobody was checking whether I'd studied. Plenty of it is very 1937. One idea stuck though: get specific about what you want before you go asking anybody for it. That's what made leaving university feel like a decision instead of a mistake. Dubai, later, was the same move.",
  },
  {
    id: 'beyond-good-and-evil',
    title: 'Beyond Good and Evil',
    body: "Philosophy came before code for me. This is the one I keep going back to, and honestly not for the famous lines. It's the reflex it builds. Who decided this was true, and on whose authority? Reading it while half my family was telling me not to drop out turned out to be good timing.",
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    body: "Nothing special, honestly. Aula F75. That's the whole story.",
  },
  {
    id: 'mouse',
    title: 'MX Anywhere 3S',
    body: "Logitech MX Anywhere 3S. The wheel free spins at something like a thousand lines a second, which sounds like marketing copy right up until you're eight hundred lines into a file hunting for one function. Then it stops sounding like marketing.",
  },
  {
    id: 'umm-kulthum',
    title: 'Umm Kulthum',
    body: "Egyptian singer, and for most of the Arab world she is simply the voice. Songs that ran an hour, sometimes longer, and whole cities would stop to listen. I put her on when my head gets too loud. Something in it clears the noise out and leaves everything sharper. Classic, classy, and in no hurry whatsoever.",
  },
  {
    id: 'death-note',
    title: 'Death Note',
    body: "I'm not an anime person. Nothing against it, I just never got pulled in. This one is the exception. I think it might be the most brilliant thing anybody has put together, two impossibly clever people trying to out think each other, and you never quite settle on who you want to win.",
  },
];
