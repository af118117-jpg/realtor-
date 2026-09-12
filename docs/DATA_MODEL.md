# DATA MODEL — REALTOR SHAMRAIZ

**Last updated:** 2026-09-08

No database. All data is static, versioned, and typed. Every entity below has
exactly one authoring location.

---

## 1. `BusinessConfig` — `src/config.ts`

The single source of truth for every business fact on the site.

| Field | Type | Required | Current state |
|---|---|---|---|
| `agentName` | string | ✅ | ⚠️ **`[CONTENT REQUIRED]`** |
| `agentTitle` | string | ✅ | ⚠️ `[CONTENT REQUIRED]` |
| `brokerage` | string | ✅ | `[CONTENT REQUIRED]` |
| `license` | string | conditional | `[CONTENT REQUIRED]` |
| `phone` | E.164 string | ✅ | `[CONTENT REQUIRED]` |
| `whatsapp` | digits only, country code, no `+`/leading `0` | ✅ | `[CONTENT REQUIRED]` |
| `email` | string | ✅ | ranasharisahb27@gmail.com — client-confirmed 2026-09-11 |
| `city` | string | ✅ | ⚠️ `[CONTENT REQUIRED]` |
| `serviceAreas` | string[] | ✅ | ⚠️ `[CONTENT REQUIRED]` |
| `officeAddress` | string | conditional | client-confirmed 2026-09-11 — see `docs/CLIENT_COPY.md` Submission 2 |
| `geo` | `{ lat: number, lng: number }` | for LocalBusiness schema | `[CONTENT REQUIRED]` |
| `mapEmbedUrl` | url | optional | `[CONTENT REQUIRED]` |
| `mapDirectionsUrl` | url | optional | `[CONTENT REQUIRED]` |
| `businessHours` | `{ status: "always"\|"custom"\|"closed", customText: string }` | optional | client-confirmed 2026-09-11 (`status: "always"`) — resolve with `formatBusinessHours()`, never render the raw object. Replaces the previously-unused flat `openingHours` string |
| `social` | `Record<channel, url \| "">` | optional | empty = hidden. instagram/facebook/tiktok/youtube client-confirmed 2026-09-11; linkedin still unsupplied |
| `siteName` | string | ✅ | Realtor Shamraiz |
| `tagline` | string | ✅ | editorial copy, not a factual claim |
| `canonicalUrl` | url | ✅ | `[CONTENT REQUIRED]` |
| `currency` | ISO 4217 | ✅ | `[CONTENT REQUIRED]` |
| `currencySymbol` | string | ✅ | `[CONTENT REQUIRED]` |
| `responseTime` | string | ✅ | `[CONTENT REQUIRED]` |
| `demoDataNotice` | boolean | ✅ | `true` until real listings land |

**Rule:** a field whose value is unknown holds the literal string
`[CONTENT REQUIRED]`. It renders visibly. `npm run check:content` fails the build
if any remain when `demoDataNotice` is `false`.

## 2. `Listing` — `src/data/listings.ts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✅ | Stable, never reused |
| `slug` | string | ✅ | Generated; stable. Change requires a 301 |
| `demo` | boolean | ✅ | `true` ⇒ visible "Sample listing" badge + `noindex` |
| `title` | string | ✅ | |
| `type` | `"buy" \| "rent" \| "commercial"` | ✅ | Drives filters and landing pages |
| `category` | string | ✅ | Villa, House, Apartment, Penthouse, Studio, Plot, Commercial Plot, Office, Shop |
| `status` | `"available" \| "under-offer" \| "sold" \| "let"` | ✅ | Sold/let are retained and `noindex`, never deleted (preserves inbound links) |
| `price` | number \| null | ✅ | **Real prices only.** `null` ⇒ renders "Price on application" |
| `priceUnit` | `"total" \| "per-month"` | ✅ | Rentals are per-month |
| `beds` | number \| null | conditional | `null` for plots/commercial |
| `baths` | number \| null | conditional | |
| `areaValue` | number \| null | ✅ | |
| `areaUnit` | string | ✅ | Client's local convention — `[CONTENT REQUIRED]` |
| `locality` | string | ✅ | Must match an `AreaGuide.name` for cross-linking |
| `address` | string | optional | Street-level. Omit for privacy unless the client confirms it may be public |
| `coordinates` | `{ lat: number, lng: number }` \| null | optional | Map pin on the detail page. `null` ⇒ map section hidden, not faked |
| `parking` | number \| null | conditional | `null` for listings where it doesn't apply (plots) |
| `amenities` | string[] | optional | Building/society-level (e.g. security, park, mosque) — distinct from `features`, which is unit-level |
| `featured` | boolean | ✅ | Home page selection |
| `listedAt` | ISO date | ✅ | Powers "newest" sort |
| `updatedAt` | ISO date | ✅ | Set on every edit; shown on the detail page so a stale listing is visible as stale |
| `agentId` | string | ✅ | Foreign key into an internal agent list. **Never** the raw source of the public-facing name/contact — those render from `BusinessConfig` (§1) |
| `image` | path | ✅ | Card/hero image |
| `gallery` | path[] | ✅ | Detail page |
| `summary` | string | ✅ | 1–2 sentences, card + meta description |
| `description` | string | ✅ | Full detail copy |
| `features` | string[] | optional | Unit-level bullet list |
| `reference` | string | optional | Client's own listing reference |

**Derived, never stored:** formatted price string, `pricePerUnit`, "similar
properties" set, filter facet counts.

**Currency:** single-currency site. Every price uses `BusinessConfig.currency` —
there is no per-listing `currency` field. If the client ever lists a property
priced in a different currency, this is the field to add; until then it would be
dead schema no listing uses.

**Integrity rules**
- No listing ships without either a real price or `price: null`.
- Every `demo: true` listing is excluded from sitemap and marked `noindex`.
- Images must exist on disk; the build fails on a broken reference.
- **Sensitive data never reaches the client bundle:** owner name/contact, internal
  notes, acquisition cost, commission terms, and raw `agentId` → personal-contact
  mappings are never present in `src/data/listings.ts` or any file shipped to the
  browser. They live only in whatever system the client uses to manage listings
  (a spreadsheet or CMS, TBD — see `TECH_ARCHITECTURE.md`) and are never imported
  into the frontend data layer.

## 3. `AreaGuide` — `src/data/areas.ts`

| Field | Type | Required |
|---|---|---|
| `name` | string | ✅ |
| `slug` | string | ✅ |
| `blurb` | string | ✅ |
| `description` | string | ✅ |
| `image` | path | ✅ |
| `highlights` | string[] | optional |
| `demo` | boolean | ✅ |

Area names are the join key to `Listing.locality`. A mismatch breaks
cross-linking and must fail validation.

**No invented market statistics.** Yield figures, price trends, and demand
claims are `[CONTENT REQUIRED]` until client-supplied and attributable.

## 4. `FaqItem` — `src/data/faq.ts`

| Field | Type | Required |
|---|---|---|
| `id` | string | ✅ |
| `question` | string | ✅ |
| `answer` | string | ✅ |
| `audience` | `"buyer" \| "seller" \| "investor" \| "landlord" \| "general"` | ✅ |
| `featured` | boolean | ✅ |

Feeds `/faq`, per-landing-page FAQ blocks, `FAQPage` JSON-LD, and the concierge
knowledge base. Answers are authored once here — never duplicated in page copy.

## 5. `ConciergeIntent` — `src/data/concierge-intents.ts`

| Field | Type | Required |
|---|---|---|
| `id` | intent enum (below) | ✅ |
| `patterns` | string[] | ✅ | Keyword/phrase triggers |
| `audience` | audience enum | ✅ |
| `response` | string | ✅ | Pre-authored. Never generated |
| `followUp` | string[] | optional | Suggested next questions |
| `action` | `{ label, href }` | optional | Handoff CTA |

There is **no generative layer**. Unmatched input returns the fallback intent.
See `AI_AGENT_SPEC.md`.

**`id` — closed enum, per master requirements §28:**

`BUY_PROPERTY` · `SELL_PROPERTY` · `RENT_PROPERTY` · `INVEST` ·
`PROPERTY_DETAILS` · `PROPERTY_SEARCH` · `PROPERTY_COMPARISON` ·
`PROPERTY_VIEWING` · `PROPERTY_VALUATION` · `CONSULTATION` ·
`CONTACT_AGENT` · `GENERAL_QUESTION` · `UNKNOWN`

`UNKNOWN` is the fallback intent (`NO_MATCH` in `AI_AGENT_SPEC.md` §4) — it is
not an absence of a row, it is a real intent with its own handoff response, so
the assistant's behaviour on unrecognised input is itself data-driven and
auditable rather than a hard-coded special case.

## 6. `Article` — Astro content collection (`src/content/`)

Frontmatter schema (Zod-validated at build time):

| Field | Type | Required |
|---|---|---|
| `title` | string | ✅ |
| `description` | string | ✅ |
| `publishedAt` | date | ✅ |
| `updatedAt` | date | optional |
| `author` | string | ✅ |
| `collection` | `"blog" \| "market-insights"` | ✅ |
| `tags` | string[] | optional |
| `image` | path | ✅ |
| `draft` | boolean | ✅ |
| `reviewedAt` | date | optional | Master requirements §44 (freshness). Set when a fact is re-verified without new content being written — distinct from `updatedAt`, which implies the text itself changed |

## 7. `LeadSubmission` — transient, not persisted

Never stored client-side. Assembled, sent to the form endpoint or encoded into a
WhatsApp deep link, then discarded.

| Field | Type | Required |
|---|---|---|
| `intent` | `"buyer" \| "seller" \| "investor" \| "rental" \| "viewing" \| "valuation" \| "consultation" \| "general"` | ✅ |
| `name` | string | ✅ |
| `phone` | string | ✅ |
| `email` | string | optional |
| `message` | string | optional |
| `propertyRef` | string | conditional (viewing) |
| `budget` / `timeline` / `locality` | string | optional qualifiers |
| `consent` | boolean | ✅ — must be explicitly checked |
| `submittedAt` | ISO datetime | ✅ |

**Privacy:** no lead data in `localStorage`, `sessionStorage`, cookies, URL
parameters, or analytics events. See `SECURITY_PLAN.md`.

## 8. Client-side persisted state (non-personal only)

| Key | Type | Purpose |
|---|---|---|
| `rs:shortlist` | string[] of listing ids | Saved properties (§16 Favorites) |
| `rs:compare` | string[] of listing ids, max 4 | Comparison tray (§15) |
| `rs:filters` | filter object | Restores last search |
| `rs:concierge-dismissed` | boolean | Suppresses the widget prompt |

All are non-personal, expire-able, and the site functions correctly when they are
absent or unreadable.

**Favorites (§16) — explicit constraint:** this is `localStorage` only, scoped to
one browser on one device. The UI must not claim or imply cross-device sync ("your
saved properties, everywhere") unless real authentication backs it — there is none
today. Copy says "saved on this device."

**Comparison (§15) — architecture, not yet a page:**
- Reuses `rs:compare`, the same pattern as `rs:shortlist` — a listing-id array, so
  favoriting and comparing don't duplicate storage logic.
- Comparable fields are exactly the ones already structured for it: `price`,
  `areaValue`/`areaUnit`, `beds`, `baths`, `type`, `category`, `locality`,
  `parking`, `amenities`. No new fields are needed on `Listing` to support
  comparison — this is a read/render concern, not a data-model gap.
- "Investment information" (§15) means whatever `investmentSnapshot` (see below)
  eventually holds — comparison never fabricates a number `Listing` doesn't carry.
- Capped at 4 properties, enforced client-side, to keep the comparison table
  legible at the `sm` breakpoint (`DESIGN_SYSTEM.md` §5.2).

## 9. `InvestmentSnapshot` — optional, per-locality (§21)

Investment-page and comparison claims about yield, appreciation, demand, or
liquidity must trace to a structured, sourced field — never freehand copy. Until
the client supplies sourced figures, every field below is absent, and the
educational sections it would feed render their explanatory framing only (see
`docs/COPY_DECK.md` for the "educational, not advice" disclosure language).

| Field | Type | Required | Notes |
|---|---|---|---|
| `locality` | string | ✅ | Joins to `AreaGuide.name` |
| `rentalYieldRange` | `{ low: number, high: number }` \| null | optional | A range, never a single promised figure |
| `source` | string | required if yield/appreciation present | Attribution — never "market data" unstated |
| `asOf` | ISO date | required if any figure present | Figures without a date read as evergreen guarantees |
| `notes` | string | optional | Client's own caveats |

**Never:** a projected return, an "expected ROI", or any number without `source`
and `asOf`. Master rule 02 applies here at full force — this is the section most
likely to accidentally read as financial advice. See `docs/AI_AGENT_SPEC.md` for
the matching constraint on how the assistant discusses investment questions.

## 10. `Lead` — CRM-side record (master requirements §25–26)

**Not part of the frontend data layer.** `LeadSubmission` (§7) is what the
browser assembles and sends; `Lead` is what the receiving system (a CRM, a
spreadsheet, TBD — see `TECH_ARCHITECTURE.md`) stores once a submission lands.
Documented here so the two aren't conflated: the frontend never reads, lists,
or displays `Lead` records — that would mean shipping other visitors' contact
data to the browser, which the sensitive-data rule in §2 already forbids.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Assigned by the receiving system |
| `name` | string | |
| `phone` | string | |
| `whatsapp` | string | optional — only if collected separately from `phone` |
| `email` | string | optional |
| `intent` | intent enum (§5) | |
| `budget` | string | optional qualifier |
| `location` | string | optional qualifier |
| `property_type` | string | optional qualifier |
| `timeline` | string | optional qualifier |
| `requirements` | string | free text |
| `source` | string | which surface generated it (`LEAD_GENERATION.md` §1) |
| `property_id` | string | optional — set for viewing/valuation requests tied to a listing |
| `created_at` | ISO datetime | |
| `status` | status enum (below) | |

**`status` — closed enum, per master requirements §25:**

`NEW` → `QUALIFIED` → `CONTACTED` → `VIEWING_BOOKED` → `NEGOTIATION` →
`CONVERTED`, with `LOST` reachable from any state.

This is a pipeline, not a checklist — a lead can skip stages (e.g. `NEW` →
`LOST`) but never moves backward except through explicit correction. The
website has no UI for this pipeline; it exists so that whatever system the
client chooses to manage leads in has a defined shape to receive `LeadSubmission`
payloads into, rather than each integration inventing its own.

## 11. AI response information categories (master requirements §30)

Every substantive claim the assistant surfaces belongs to exactly one category,
and which one governs how it may be phrased:

| Category | Source | Example |
|---|---|---|
| **FACT** | `BusinessConfig`, `Listing`, `AreaGuide`, `FaqItem` — data the client supplied and confirmed | "This listing has 3 bedrooms." |
| **ESTIMATE** | `InvestmentSnapshot` only, always with `source` + `asOf` | "Rental yield in this locality has ranged 5–7%, per [source], as of [date]." |
| **GENERAL INFORMATION** | Educational framing not tied to a specific property or number — how a process works, what a term means | "Registry refers to the legal transfer document for a property." |
| **USER-PROVIDED INFORMATION** | Restated only, never validated or acted on as fact | "You mentioned a budget of 5 crore — here's what's available near that." |

The assistant never blends categories in one sentence without marking the
shift (e.g. stating a FACT, then separately flagging an ESTIMATE as such). This
sits alongside, not instead of, the capability rules in `AI_AGENT_SPEC.md` §3.
