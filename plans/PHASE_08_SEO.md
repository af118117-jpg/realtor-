# PHASE 08 — SEO / AEO / GEO / LOCAL SEO

**Status:** ⬜ Not started — blocked by Phase 07

---

## Objective

Implement the four discovery strategies. Most of this phase depends on business
facts that are currently `[CONTENT REQUIRED]` — those must land first.

## Reference
`docs/SEO_STRATEGY.md` · `docs/AEO_STRATEGY.md` · `docs/GEO_STRATEGY.md` · `docs/LOCAL_SEO_STRATEGY.md`

## Hard prerequisite

| Needed | Blocks |
|---|---|
| City and service areas | Keyword architecture, area guides, local schema |
| Address and geo coordinates | `LocalBusiness` schema, map, GBP |
| Name, brokerage, license | Entity statement, `RealEstateAgent` schema |
| Domain | Canonicals, sitemap, OG URLs |
| Real listings | Listing schema, local landing pages |

**Without these, this phase produces scaffolding with placeholders — not a
working SEO implementation.** Attempting it early risks inventing the very facts
the project forbids inventing.

## Tasks

### 8A. Technical SEO
- [ ] Unique title and description per route
- [ ] Self-referencing absolute canonical per route
- [ ] `sitemap.xml` generated at build; excludes `demo` and `noindex` pages
- [ ] `robots.txt` with the sitemap reference
- [ ] `noindex` on filter query-string URLs
- [ ] OG and Twitter Card tags; share previews verified
- [ ] Heading hierarchy audit across all routes
- [ ] Internal linking audit — zero orphans, descriptive anchors
- [ ] Search Console and Bing Webmaster Tools verified; sitemap submitted

### 8B. Structured data
- [ ] `RealEstateAgent` / `LocalBusiness` on `/` and `/about` — real data only
- [ ] `Organization`, `WebSite` + `SearchAction`
- [ ] `BreadcrumbList` on nested routes
- [ ] `RealEstateListing` + `Offer` on real listings only
- [ ] `FAQPage` on `/faq` and landing FAQ blocks
- [ ] `Article` on blog and insights
- [ ] `Person` on `/about`
- [ ] **Integrity check:** every schema property matches visible page content;
      zero `aggregateRating` or `review` without genuine reviews
- [ ] All schema validated with the Rich Results Test — zero errors

### 8C. AEO
- [ ] Answer-first block at the top of every article and landing page
- [ ] FAQ data populated — factual answers `[CONTENT REQUIRED]` until supplied
- [ ] Question headings phrased as users ask them
- [ ] Definition blocks, numbered processes, comparison tables, checklists
- [ ] Canonical entity statement on `/about`
- [ ] Author bylines, `publishedAt` / `updatedAt` dates
- [ ] Passages scoped with place and time so extraction preserves qualifiers

### 8D. GEO
- [ ] Verify all content is crawlable without JavaScript
- [ ] Entity consistency audit — name, brokerage, city identical everywhere
- [ ] **AI crawler policy decision** (`GEO_STRATEGY.md` §7) — client sign-off, then `robots.txt`
- [ ] Baseline probe: query target questions across ChatGPT, Perplexity, Gemini,
      Copilot; record current representation

### 8E. Local SEO
- [ ] NAP audit — on-site and every known external profile
- [ ] Area guide pages with genuinely distinct content per area
- [ ] `areaServed` enumerated in schema
- [ ] Map embed or static alternative on `/contact`
- [ ] Google Business Profile: claim, verify, complete, link (client-executed)
- [ ] Citation audit — fix inconsistencies before creating new listings
- [ ] Local landing pages **only** where ≥ 3 real listings and unique content exist

## Standing constraints

- **No invented statistics, yields, growth rates, or market data.**
- **No schema for content that is not real and visible.**
- **No fabricated reviews or ratings** — the fastest way to lose E-E-A-T and to
  make a false claim on the client's behalf.
- Area guides must be genuinely distinct; four templated pages with swapped
  place names read as doorway pages.

## Gate

- [ ] G8 passes — unique meta, valid canonical, valid schema on every route
- [ ] Lighthouse SEO 100 on every route
- [ ] Zero schema errors
- [ ] Zero schema on sample data
- [ ] NAP consistent everywhere
- [ ] AI crawler policy implemented per client decision
- [ ] Zero fabricated facts (G1)
