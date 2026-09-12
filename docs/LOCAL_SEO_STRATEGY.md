# LOCAL SEO STRATEGY — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

Real estate is a local business. Most valuable queries carry geographic intent.
This is the highest-ROI channel in the project.

---

## 1. Prerequisites — all currently blocked

Local SEO cannot be meaningfully executed until these are supplied:

| Input | Status |
|---|---|
| Primary city | ⚠️ `[CONTENT REQUIRED]` |
| Exact service areas (localities/phases/sectors) | ⚠️ `[CONTENT REQUIRED]` |
| Office address (and whether it is public) | ⚠️ `[CONTENT REQUIRED]` |
| Business phone (local, consistent) | ⚠️ `[CONTENT REQUIRED]` |
| Geo coordinates | ⚠️ `[CONTENT REQUIRED]` |
| Business hours | ⚠️ `[CONTENT REQUIRED]` |
| Google Business Profile — exists? claimed? | ⚠️ `[CONTENT REQUIRED]` |
| Brokerage name | ⚠️ `[CONTENT REQUIRED]` |
| License / registration number | ⚠️ `[CONTENT REQUIRED]` |

**Nothing in this section may be invented.** A wrong address or phone number in
local search actively damages the business — it sends real people to the wrong
place and creates NAP inconsistency that suppresses rankings.

## 2. NAP consistency

**Name, Address, Phone** must be byte-identical across the website, Google
Business Profile, social profiles, and every directory listing.

Implementation: all three come from `config.ts`. No component hard-codes them.
A single canonical formatting of each is decided once and used everywhere
(including punctuation and abbreviation style).

Audit before launch: every on-site occurrence + every known external profile.

## 3. On-site local signals

| Signal | Implementation |
|---|---|
| City in title tags | Where genuinely relevant — not stuffed |
| City + areas in `/about` | Natural prose, part of the entity statement |
| Area guide pages | One per service area, genuinely distinct content |
| Locality on every listing | `Listing.locality`, joined to its area guide |
| Embedded map | On `/contact` — lazy-loaded, CSP-approved |
| `LocalBusiness`/`RealEstateAgent` schema | With real address, geo, hours, phone |
| `areaServed` in schema | Enumerated service areas |
| Local internal linking | Area guide ⇄ listings in that area ⇄ relevant articles |
| Directions link | Real Google Maps place link |

## 4. Area guide pages

The core local-SEO asset. One page per service area.

**Required content per guide** (each item real or `[CONTENT REQUIRED]`):
- What the area is actually like — character, layout, who lives there
- Who it suits (families, professionals, investors)
- Typical property types available
- Connectivity and access
- Amenities: schools, healthcare, retail, parks
- Live listings in the area (from data, auto-linked)
- Enquiry CTA scoped to the area

**Quality bar:** a guide must contain observations a resident would recognise as
true and a competitor's template page would not contain. Four near-identical
guides with the locality name swapped are worse than one genuine guide — they
read as doorway pages to both users and search engines.

**Forbidden:** invented price averages, invented growth percentages, invented
rental yields, invented demand claims, invented crime or school statistics.

## 5. Google Business Profile

Owned by the client, not the website, but the highest-impact local asset.

Recommended actions (client-executed):
- Claim and verify the profile
- Category: *Real Estate Agent* (+ relevant secondary categories)
- Complete NAP matching the site exactly
- Set service areas
- Real photos — agent, office, properties
- Complete the services list
- Link to the website
- Post regularly (new listings, market notes)
- Answer the Q&A section using the site's FAQ content
- Solicit genuine reviews from real past clients — **never fabricate or incentivise**
- Respond to every review

Reviews are the strongest local ranking factor and cannot be manufactured. This
is a client responsibility that no amount of site work substitutes for.

## 6. Citations and directories

Consistent listings on: local real-estate portals, the brokerage's own site,
relevant business directories, and professional/industry bodies.

Audit for existing inconsistent citations before creating new ones — duplicate
or conflicting entries suppress rankings more than missing ones.

## 7. Local content plan

| Content type | Example shape |
|---|---|
| Area guide | "Living in [locality]: a complete guide" |
| Area comparison | "[Locality A] vs [Locality B]: which suits you?" |
| Local process | "How to buy property in [city]: step by step" |
| Local market note | "[City] property market: [period] update" — real data only |
| Local FAQ | "What areas do you cover in [city]?" |

## 8. Landing pages for high-value local queries

Query-string filter combinations on `/properties` are `noindex`. Where a
combination shows genuine, sustained search demand **and** enough real inventory
to justify a page, it is promoted to a real indexed landing page:

```
/properties/[locality]                     e.g. houses in a named locality
/properties/[category]-in-[locality]       e.g. apartments in a named locality
```

**Gate:** a promoted page must have ≥ 3 real listings and unique intro content.
Empty or near-empty landing pages are thin content and are not created. This
work is deferred until real listing data exists.

## 9. Measurement

- Google Business Profile insights: views, searches, calls, direction requests
- Search Console: impressions/clicks filtered to local query patterns
- Local pack visibility for target terms (manual monthly check)
- Calls and WhatsApp clicks attributed to organic local traffic
- Area guide organic entrances and onward conversion
