// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';

// Preact exists solely to host the three.js island (E03). Nothing else hydrates.
export default defineConfig({
  site: 'https://www.yazan-ali.net',
  integrations: [preact()],
  vite: {
    optimizeDeps: {
      // These are only reached through dynamic imports, so Vite discovers them
      // late and re-optimizes mid-flight, killing the in-progress fetch.
      // Pre-bundling them at startup removes the race in dev.
      include: ['gsap', 'gsap/ScrollTrigger', 'three'],
    },
  },
  fonts: [
    {
      // Narrative voice. Serif, because the reader is here for six years of story.
      provider: fontProviders.fontsource(),
      name: 'Newsreader',
      cssVariable: '--font-narrative',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
    {
      // Metadata voice: orgs, periods, bylines, links.
      provider: fontProviders.fontsource(),
      name: 'Archivo',
      cssVariable: '--font-meta',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      // Work world display. Signal: engineered, tight, confident.
      provider: fontProviders.fontsource(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-grotesque',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      // Story world display. Oxblood: high-contrast, cinematic.
      provider: fontProviders.fontsource(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
