---
project: jeem
title: 'Rebuilding the frontend of an Arabic answer engine around streaming'
lede: 'Jeem answers questions in Arabic, English, and the dialects in between. I led the complete frontend rewrite — Pages Router to Next.js 15 — around the one thing that shapes every decision in a product like this: the answer arrives a token at a time.'
role: 'Frontend engineer, rewrite lead'
period: 'Contract'
stack: ['Next.js 15', 'TypeScript', 'SSE', 'React', 'CSS architecture']
status: 'Live in beta'
liveUrl: 'https://jeem.ai/'
order: 3
---

## A rewrite with a moving target

Jeem (formerly Fyler) is an answer engine for the MENA region: you ask in Arabic, in English, or in a mix of both, and it answers with cited, structured results. The existing frontend was a legacy Next.js Pages Router application that had grown without clear seams — UI, business logic, and data access reached into each other freely.

I led the complete rewrite to Next.js 15, rebuilding the codebase around explicit boundaries between those three layers. That much is ordinary modernisation work. What made it interesting is that the product's central interaction is not a page load. It is a response that arrives progressively, over seconds, and mutates the layout the entire time it is arriving.

## Streaming is a rendering problem before it is a network problem

The backend streams answers over Server-Sent Events. SSE is the right shape for this: the traffic is one-directional, it is plain HTTP, it reconnects on its own, and it does not need the operational weight of a WebSocket for a channel the client never writes to.

The hard part is not opening the connection. It is what happens after.

Tokens arrive far faster than a person can read and faster than React needs to paint. Rendering naively — state update per event — turns a stream into a render storm, and on a mid-range phone that is the difference between an answer that feels alive and one that feels broken. The work is in deciding how often the UI is allowed to catch up with the stream, and making sure that decision is made in one place rather than scattered across components.

The same applies to the parsing. An answer is not plain text; it is Markdown that is only *partially* present at any given moment. A table is a table from the first pipe character, but it is not a valid table until the last row lands. Structured content has to render progressively without flickering between "broken" and "correct" as it completes.

## The states a single answer passes through

Looking at one answer in the product, the UI moves through several distinct states, and each one is a design and engineering decision:

- **Thinking steps**, collapsed by default, showing the work before the answer exists.
- **Prose**, streaming in, with **inline citations** that attach to claims as those claims arrive.
- **Structured blocks** — comparison tables in particular — that must render progressively and then settle.
- **Per-block affordances**: copy, download, expand. These only make sense once a block is complete, so they cannot simply be present from the start.
- **Follow-on actions** like *Summarize the answer*, offered against content that already exists.

None of these are separate screens. They coexist, in one growing document, while the user is reading it.

## Why the CSS was a first-class problem

This is the part that surprises people. A streaming interface breaks most of the assumptions ordinary layout CSS is built on.

Content grows while it is being read, so anything anchored to the bottom of the page fights the content above it. The composer stays pinned while the answer expands behind it. Scroll position has to respect the reader — following the stream when they are at the bottom, and *not* yanking them back when they have scrolled up to re-read something. Every block that appears mid-stream is a potential layout shift in a document the user is actively looking at.

Then there is language. Jeem is Arabic-first, and answers mix Arabic and English freely — a product name in Latin script inside an Arabic sentence, a table with Arabic headers and English values. That is bidirectional text, not a `dir="rtl"` attribute on the root. Direction, alignment, logical spacing, and iconography all have to hold in both directions, in the same document, sometimes in the same line. Writing that as a set of consistent rules rather than a pile of overrides is the only way it stays maintainable.

Theming sits on top of all of it: the same components in light and dark, without a second set of rules.

The architecture I built for this was about making those behaviours systematic — spacing, direction, and state expressed as a coherent system, so a new block type inherits correct behaviour instead of needing its own special cases.

## Working the seam with the backend

Some of the friction was not on the frontend at all. I worked with the backend team to define improved V2 API contracts and to draw clearer lines between frontend and backend responsibilities, which addressed limitations in the existing backend architecture. Where the stream's shape made the client's job unnecessarily hard, the right fix was the contract, not another workaround in the component.

## What I owned

The frontend architecture and its rewrite: the layer boundaries, the streaming and rendering strategy, the CSS system that carries bidirectional and themed layout, and the frontend half of the V2 API contract.
