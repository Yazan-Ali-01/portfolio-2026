Case study

# Driven Properties: rebuilding a property search that did not filter

The filtering on a Dubai real estate portal was not working at all — . The URLs had no consistent hierarchy, the filtering logic was split across three mechanisms, and the data lived in two disconnected places. I led a rebuild from scratch around an SEO-first URL architecture, one unified filtering system, and layered caching for speed.
Senior Engineer, rebuild lead — / Next.js, TypeScript, SSR / Live in production / View the live site →
The problem

## A search system that did not search

On a property portal, search is — the product. Buyers filter by location, type, price, and beds, and search engines rank you on how cleanly that inventory is exposed. On this site, almost none of that worked.
- Filtering was broken — Applying a filter often returned wrong or empty results. The core function of the page did not function.
- No URL hierarchy — Dubai real estate has a natural tree: city, then area, then community, then building, and sometimes sub-communities. The links did not follow it, and there was no symmetry or consistency from page to page.
- Three ways to filter — Some filters used query params, some used URL search params, some used dynamic route segments. There was no single source of truth for what a filter meant.
- Split data sources — Some content lived in the CMS, some in the backend database, with no unified layer reading across them.
- Dead code — Large parts of the codebase were unused or unreachable, which made every change slow and risky.
- SEO damage — Inconsistent, non-canonical URLs meant search engines could not crawl or rank the inventory properly. For a property portal, that is lost revenue.
The rebuild

## One canonical hierarchy, built for how Dubai real estate is searched

Before writing code, we studied how property search and SEO actually work in the Dubai market, looked at what ranks and why, and designed a single canonical URL hierarchy that mirrors how buyers and search engines think about location. Every listing page now maps to exactly one address in that tree.
Before, representative of the patterns found
After, one canonical shape
What changed under the hood

## Three fixes that made search work

Filtering

### From three filtering mechanisms to one contract

Query params, URL search params, and dynamic segments were all doing overlapping jobs. I collapsed them into one clear contract: location lives in the path — as canonical, indexable segments, and refinements — like type, price, and beds live as well-defined query params. One place decides how a filter maps to a query, so the same input always produces the same result.
Data

### One access layer over two sources

Content was split between the CMS and the backend database, and code reached into both directly. I put a single access layer — in front of them, so the search system reads from one consistent interface no matter where a given field actually lives. That removed a whole class of inconsistency bugs.
SEO architecture

### Canonical URLs the crawler can trust

Because every page now resolves to exactly one canonical URL in the hierarchy, duplicate and conflicting paths disappeared. The structure follows the SEO patterns that actually rank — for Dubai real estate, which we researched rather than guessed, giving search engines a clean, symmetric map of the inventory.
Performance

## Two layers of caching, and a fast first paint

A search page that renders slowly loses both buyers and rankings. I rendered on the server and cached at two levels, so most requests never touch the underlying data sources.
- Next.js server-side rendering with a server cache. — Pages arrive pre-rendered and fast, which crawlers and buyers both reward.
- Backend in-memory caching. — Repeated queries are served from memory instead of hitting the CMS and database every time.
- Prefetching and preloading. — Likely-next pages are fetched ahead of the click, so navigation feels instant.
- Real loading states and fast pagination. — The UI never looks frozen, and paginated results stay shareable and crawlable.
Outcome

## What changed

- Filtering works end to end — on a single, consistent system. The same input reliably returns the same, correct results.
- One canonical URL hierarchy — that search engines can crawl and rank, with the duplicate and inconsistent paths gone.
- One access layer — over the CMS and the database, instead of code reaching into two disconnected sources.
- Faster pages — through server-side rendering and two layers of caching, plus prefetching and proper loading states.
- A codebase without the dead weight — , so future changes are safe and quick rather than fragile.
Role

## What I owned

I led the rebuild: I audited the broken system, ran the research into Dubai real estate SEO, and designed the URL architecture and the unified filtering contract. I built the data-access and caching layers, and set the direction the rest of the work followed.
- Audited the broken filtering and URL structure
- Researched and applied Dubai real estate SEO patterns
- Designed the canonical URL hierarchy
- Unified filtering into one contract
- Built the single data-access layer
- Implemented the two-layer caching strategy