/**
 * Section 9. Two recommendations, no carousel, no auto-rotation.
 *
 * `full` is the verbatim LinkedIn text. `display` is what renders. Keeping both
 * means the editorial cut is reviewable rather than invisible.
 *
 * On the Luis trim: the opening paragraph is cut rather than reworded. It is the
 * only place the title "Principal Software Engineer" appears, and cutting it
 * resolves the mismatch with the CV without altering a word of what he wrote. The
 * byline carries the attribution instead. The closing paragraph is cut as boilerplate.
 */

export type Recommendation = {
  id: string;
  author: string;
  title: string;
  relationship: string;
  date: string;
  display: string[];
  full: string[];
};

export const recommendations: Recommendation[] = [
  {
    id: 'luis-beltran',
    author: 'Luis Beltran',
    title: 'Chief Marketing Officer, Driven | Forbes Global Properties',
    relationship: 'Managed Yazan directly',
    date: 'October 2025',
    display: [
      `Yazan is an exceptionally hard-working and self-driven individual who consistently demonstrates a rare combination of technical depth and business knowledge. He approaches every project with a clear sense of purpose and precision, balancing technical excellence with a mature understanding of business objectives. Yazan’s decisions are always thoughtful and well-guided, and his pursuit of perfection ensures that every deliverable meets the highest standards. Beyond his individual strengths, he is also highly collaborative — always open to feedback, ready to support others, and genuinely invested in collective success.`,
      `On a personal level, Yazan is a truly pleasant colleague to work with. He is friendly, approachable, and brings a good sense of humor that helps create a positive and balanced work environment.`,
    ],
    full: [
      `I had the pleasure of working with Yazan during our time at Driven | Forbes Global Properties, where he served as Principal Software Engineer. Collaborating with him was both professionally rewarding and personally enjoyable.`,
      `On the professional side, Yazan is an exceptionally hard-working and self-driven individual who consistently demonstrates a rare combination of technical depth and business knowledge. He approaches every project with a clear sense of purpose and precision, balancing technical excellence with a mature understanding of business objectives. Yazan’s decisions are always thoughtful and well-guided, and his pursuit of perfection ensures that every deliverable meets the highest standards. Beyond his individual strengths, he is also highly collaborative—always open to feedback, ready to support others, and genuinely invested in collective success.`,
      `On a personal level, Yazan is a truly pleasant colleague to work with. He is friendly, approachable, and brings a good sense of humor that helps create a positive and balanced work environment.`,
      `Working with Yazan was a privilege, and I would not hesitate to recommend him to any organization looking for a seasoned professional who blends technical mastery with integrity, empathy, and professionalism.`,
    ],
  },
  {
    id: 'mohamed-arab',
    author: 'Mohamed Arab',
    title: 'Founder & CEO, BeIn Media',
    relationship: 'Managed Yazan directly',
    date: 'September 2023',
    display: [
      `Yazan’s resilience and ability to transform every challenge into an opportunity are unparalleled. Yazan is a fearless risk-taker, always ready with insightful questions to ensure every move is strategic and effective. In him, you’ll find a team member who exceeds expectations and propels any team to new heights.`,
    ],
    full: [
      `Yazan’s resilience and ability to transform every challenge into an opportunity are unparalleled. Yazan is a fearless risk-taker, always ready with insightful questions to ensure every move is strategic and effective. In him, you’ll find a team member who exceeds expectations and propels any team to new heights.`,
    ],
  },
];
