/**
 * The ten chapters, in order. Single source of truth for every word in the
 * narrative — see SPEC.md.
 *
 * `sceneNote` is carried as data rather than a comment so E03 can assert that
 * every chapter has a corresponding keyframe.
 *
 * The work section that used to sit at index 7 was removed: the studio at /work
 * is where the projects live now. A short bridge chapter took its place, so the
 * recommendations land on a reader who has seen what the work is.
 *
 * TIMELINE CONSTRAINT: chapters 6 and 7 total two months of job hunting, matching
 * BeIn Media ending Feb 2023 and Royal Class starting Apr 2023. If either the CV
 * or this copy changes, the other has to move with it.
 */

export type Chapter =
  | {
      kind: 'prose';
      id: string;
      index: number;
      title: string;
      /**
       * Set on chapter 0 only. Place, and ideally the year — it is the first
       * fact a stranger meets and it is what stops the opening reading as a
       * riddle. TODO: add the year, e.g. 'Latakia, Syria · 2018'.
       */
      dateline?: string;
      /** Set on chapter 0 only. The page's h1 and its LCP element. */
      hero?: string;
      /** A door out of the narrative, for the chapter that points at the work. */
      cta?: { href: string; label: string };
      /**
       * Authored HTML, trusted because it is written here and nowhere else.
       * `<em>` is the only tag used — for emphasis the spec calls for in prose.
       */
      paragraphs: string[];
      sceneNote: string;
      aside?: { summary: string; paragraphs: string[] };
    }
  | { kind: 'recommendations'; id: string; index: number; title: string; sceneNote: string };

export const story: Chapter[] = [
  {
    kind: 'prose',
    id: 'opening',
    index: 0,
    title: 'Opening',
    dateline: `Latakia, Syria`,
    hero: `Eighty-three percent.`,
    paragraphs: [
      `That was my score. It decided what I was allowed to study, and it wasn’t enough for the thing I actually wanted.`,
      `Six years on I’m a senior engineer in Dubai. Self-taught, no degree, never went back for it. This is what happened in between.`,
      `Not that I couldn’t handle the material, by the way. Too many people wanted the same seats, so the cutoff landed wherever the top scores landed that year.`,
      `I wanted computer science. What I got was electrical engineering.`,
    ],
    sceneNote: `Light distant, rings wide and cold.`,
    aside: {
      summary: `How admission works in Syria`,
      paragraphs: [
        `Here’s how it works back home. You hand in a list, ten or so majors ranked by preference, and every major gets a cutoff that year based on grades, how many people applied, and how many seats actually exist.`,
        `Computer science is jammed for reasons that aren’t really academic. Families push their kids toward it because it sounds safe and it sounds impressive, whether or not the kid has any feel for it. Whoever scored highest gets in. That’s the whole mechanism. The cutoff isn’t an opinion about you. It’s arithmetic.`,
      ],
    },
  },
  {
    kind: 'prose',
    id: 'aleppo',
    index: 1,
    title: 'Aleppo',
    paragraphs: [
      `Eighteen years old, and I picked electrical engineering because the word “electric” was sitting in the name and that felt close enough to technology. That was the reasoning. All of it.`,
      `It was also the only engineering my score could actually reach, and I couldn’t take it in Latakia. So my first year happened in Aleppo. Different city, working around the admission rules just to get into engineering at all, with a plan to transfer home afterwards.`,
      `Weekends I’d crack open a CS course for an hour, maybe two. That’s where I ran into CS50. Did I take it seriously? Not even slightly. It sat beside the degree like a hobby.`,
    ],
    sceneNote: `Rings tilt off-axis. Light unchanged.`,
  },
  {
    kind: 'prose',
    id: 'the-room',
    index: 2,
    title: 'The room',
    paragraphs: [
      `Second year, back in Latakia, and something clicked into place. <em>I was not going to be an illiterate engineer.</em>`,
      `Those were the exact words in my head. Not some tidy “time for a career change.” Closer to a refusal, really, to spend four years earning a title I’d be hollow behind.`,
      `So I lived on my own and ran a second schedule underneath the official one. Days went to university. Nights went to Udemy and YouTube, right up until sleep. No bootcamp. No cohort. Nobody checking whether I’d bothered to show up.`,
      `Honestly, I’d wanted CS before I had a name for it. I liked logic, I liked philosophy, and I had this hunch that all the complicated machinery I kept seeing in films had to be running on reasoning underneath, on decisions somebody could argue about. So I finally went and looked.`,
    ],
    sceneNote: `Rings begin to align. Light takes its first step closer.`,
  },
  {
    kind: 'prose',
    id: 'the-message',
    index: 3,
    title: 'The message',
    paragraphs: [
      `Six months in. A DM on LinkedIn.`,
      `I prepped like it was the only shot I’d get, sat the interview, and walked out with my first remote job. Was the market softer then than it is now? Absolutely, and I won’t pretend otherwise. But I was ready when it showed up, and that part had nothing to do with luck.`,
      `Then came the decision that actually cost me something. I left university. Not paused it. Left.`,
      `My family pushed back, hard. They’re traditional, and walking away from a degree is not a small thing in a house like mine, so their reaction was fair enough. I just knew I was never going to end up an electrical engineer, and I trusted the thing I could already feel myself turning into. Never went back. Still don’t have the degree.`,
    ],
    sceneNote: `Light closer. Rings hold steady for the first time.`,
  },
  {
    kind: 'prose',
    id: 'the-ceiling',
    index: 4,
    title: 'The ceiling',
    paragraphs: [
      `By 2023 Syria had stopped being a base and turned into a ceiling.`,
      `Four to six hours of electricity a day. Getting paid for freelance work was its own little engineering project. And whole categories of opportunity were simply shut to me for one reason, which was where I happened to be standing.`,
      `Past all the logistics though, the ambition just wasn’t getting fed. I wanted work that would force me to get better. From there, I was never going to find it.`,
    ],
    sceneNote: `Rings widen — the space opens up before the move.`,
  },
  {
    kind: 'prose',
    id: 'dubai',
    index: 5,
    title: 'Dubai, with nothing',
    paragraphs: [
      `Moved to Dubai with zero connections and no real read on the market. I’ll be straight about it: I didn’t study the thing. I gambled. The whole move happened in a rush.`,
      `Still think moving before you can talk yourself out of it is underrated.`,
      `One month of hunting and I landed a contract. Asked them to adjust a single clause. They said give us two days. What came back two days later was that they’d hired somebody else.`,
      `So there I was. Zero, in a city where I knew nobody.`,
    ],
    sceneNote: `The light drops back and dims. The one reversal in the whole sequence — let it hurt.`,
  },
  {
    kind: 'prose',
    id: 'back-up',
    index: 6,
    title: 'Back up',
    paragraphs: [
      `Another month of hunting, paid for by freelance scraps and whatever side income I could stitch together.`,
      `Then an offer came in. Less money than I wanted, attached to an opportunity worth a good deal more than the number on it. I took it deliberately. That trade has funded everything that came after.`,
    ],
    sceneNote: `Light recovers past its previous position. Rings level out.`,
  },
  {
    kind: 'prose',
    id: 'what-came-of-it',
    index: 7,
    title: 'What came of it',
    paragraphs: [
      `A property search rebuilt around one canonical hierarchy. A multi-tenant legal platform isolated at the database itself. The frontend of an Arabic answer engine, rebuilt around streaming.`,
      `That is the short version. The engineering is next door.`,
    ],
    cta: { href: '/work', label: 'See the work' },
    sceneNote: `Nearly still. The light holds close.`,
  },
  {
    kind: 'recommendations',
    id: 'what-they-say',
    index: 8,
    title: 'What they say',
    sceneNote: `Still. Let the quotes hold the page.`,
  },
  {
    kind: 'prose',
    id: 'now',
    index: 9,
    title: 'Now',
    paragraphs: [
      `Six years in. Self-taught, no degree, still learning every single day, and not as some virtue I’m advertising. It’s a job requirement.`,
      `That’s why I became a software engineer in the first place. Still is.`,
    ],
    sceneNote: `Light arrives at the front, steady. Rings level. Motion stops.`,
  },
];
