# SEO STRATEGY — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

---

## 1. Foundation

Static, fully server-rendered HTML on every route. No content depends on
client-side JavaScript to be crawlable. This is the single biggest technical SEO
advantage of the chosen architecture (`TECH_ARCHITECTURE.md`).

## 2. Technical checklist

| Item | Requirement |
|---|---|
| Rendering | Pre-rendered HTML per route |
| Title | Unique per page, ≤ 60 chars, primary term front-loaded |
| Meta description | Unique per page, 140–160 chars, action-oriented |
| Canonical | Absolute, self-referencing, on every page |
| Headings | Exactly one `<h1>`; no skipped levels |
| URLs | Lowercase, hyphenated, stable, descriptive |
| Internal linking | Descriptive anchors; no "click here"; no orphans |
| `sitemap.xml` | Generated at build; excludes `demo:true` and `noindex` pages |
| `robots.txt` | Allows crawl; references sitemap |
| Structured data | Per §4 |
| Images | Descriptive filenames, `alt`, explicit dimensions, modern formats |
| Core Web Vitals | Budgets in `PERFORMANCE_PLAN.md` |
| Mobile | Responsive, no horizontal overflow, tap targets ≥ 44px |
| HTTPS | Enforced, HSTS |
| 404 | Real 404 status, useful recovery page |
| Pagination | `rel=next/prev` semantics via real links, crawlable |
| Filter URLs | `noindex` on query-string combinations; canonical to `/properties` |

## 3. Keyword architecture

Real keyword research requires the client's actual city and service areas, which
are `[CONTENT REQUIRED]`. The **structure** below is committed; the terms are
filled once those are known.

| Intent | Pattern | Target page |
|---|---|---|
| Transactional — buy | `[property type] for sale in [locality]` | `/properties?…` → promoted landing page |
| Transactional — rent | `[property type] for rent in [locality]` | `/rent`, filtered results |
| Transactional — sell | `sell my [property type] in [locality]` | `/sell` |
| Transactional — valuation | `property valuation [locality]` | `/property-valuation` |
| Commercial | `real estate agent in [locality]` | `/`, `/about` |
| Commercial | `best realtor [city]` | `/about` |
| Investigational | `is [locality] good for investment` | `/market-insights/*` |
| Informational | `how to buy property in [city]` | `/blog/*` |
| Informational | `documents needed to sell property` | `/blog/*`, `/faq` |
| Navigational | `realtor shamraiz` | `/` |

**Rule:** one primary intent per page. Two pages competing for the same term is a
defect to be fixed by consolidation, not by more content.

## 4. Structured data (JSON-LD)

| Schema | Where | Notes |
|---|---|---|
| `RealEstateAgent` | `/`, `/about` | Extends `LocalBusiness`. Requires real name, address, geo, phone |
| `Organization` | `/` | Brokerage, logo, social profiles |
| `WebSite` + `SearchAction` | `/` | Enables sitelinks search box |
| `BreadcrumbList` | All nested pages | Mirrors visible breadcrumbs |
| `RealEstateListing` | `/properties/[slug]` | ⚠️ Only on real listings. **Never on `demo:true`** |
| `Residence` / `Apartment` / `House` | Property detail | Typed to `category` |
| `Offer` | Property detail | Only when a real price exists |
| `FAQPage` | `/faq`, landing FAQ blocks | Only for genuinely visible Q&A |
| `Article` | `/blog/*`, `/market-insights/*` | With real author and dates |
| `Person` | `/about` | The agent |
| `ContactPage` | `/contact` | |

### 4.1 Structured data integrity rule

**Structured data must describe only what is real and visible on the page.**

- No `aggregateRating` or `review` markup without genuine, attributable reviews.
- No `Offer` price on a sample listing.
- No `RealEstateAgent` markup with a fabricated address or geo.
- Sample content is `noindex` and carries no listing schema.

Marking up fabricated data is both a search-guideline violation and a false
claim about the client's business. This gate is enforced in `QA_PLAN.md`.

## 5. Content plan

### Pillar → cluster

**Pillar: Buying** (`/buy`)
→ how to buy in [city] · documents required · financing basics · viewing checklist ·
common first-time mistakes · area comparison guides

**Pillar: Selling** (`/sell`)
→ how to price · preparing a property · marketing that works · negotiating ·
paperwork · timeline expectations

**Pillar: Investing** (`/invest`)
→ evaluating an area · rental yield explained · plot vs. built property ·
holding-period considerations · risk factors

**Pillar: Renting** (`/rent`)
→ tenant guide · landlord guide · tenancy agreements · deposits · management

**Pillar: Areas** (area guides)
→ one page per service area, cross-linked to listings in that locality

### Publishing standard
- One primary intent per article
- Answer the query in the first 100 words
- Scannable: descriptive H2/H3, short paragraphs, tables where comparative
- Genuine expertise, first-hand framing
- At least one internal link to a conversion route
- Real author attribution and dates
- No unattributed statistics

## 6. E-E-A-T

| Signal | Implementation |
|---|---|
| **Experience** | First-hand agent voice; real transaction context (client-supplied only) |
| **Expertise** | Credentials on `/about`, consistent depth in area/market content |
| **Authoritativeness** | Named brokerage, license number, consistent NAP, real social profiles |
| **Trustworthiness** | Contactable, transparent process, honest AI disclosure, privacy policy, zero fabricated claims |

The content-integrity rules in this project are not just ethics — they are the
E-E-A-T strategy. Fabricated credentials are the fastest way to lose the
trustworthiness signal entirely.

## 7. Measurement

Google Search Console + Bing Webmaster Tools from day one.

Track: impressions and clicks by query cluster · average position for target
terms · pages indexed vs. submitted · Core Web Vitals field data · organic
entrances to conversion routes · crawl errors.

**Review cadence:** monthly, first review one month post-launch.
