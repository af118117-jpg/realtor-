# INFORMATION ARCHITECTURE — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

---

## 1. Route map

19 defined routes plus one dynamic pattern. Every route has a stated purpose, a
primary conversion action, and an owner in the nav structure. Routes are added
beyond this map only when they carry clear business value.

| Route | Page | Purpose | Primary CTA | Indexed |
|---|---|---|---|---|
| `/` | Home | Establish who/what/where/why, route visitors by intent | Find a Property | Yes |
| `/properties` | Property search | Discovery, filtering, comparison | View property | Yes |
| `/properties/[slug]` | Property detail | Convert interest into a viewing | Request a Viewing | Yes |
| `/buy` | Buy | Buyer landing + process explanation | Buyer enquiry | Yes |
| `/sell` | Sell | Seller landing + process explanation | Request a Valuation | Yes |
| `/rent` | Rent | Rental landing (tenants + landlords) | Rental enquiry | Yes |
| `/invest` | Invest | Investor landing | Investor enquiry | Yes |
| `/services` | Services | Full service catalogue | Book a Consultation | Yes |
| `/about` | About | Trust, credentials, personal story | Talk to Shamraiz | Yes |
| `/market-insights` | Market insights | Authority content hub | Subscribe / Consult | Yes |
| `/blog` | Blog | Editorial + long-tail SEO | Related enquiry | Yes |
| `/contact` | Contact | All contact methods | Call / WhatsApp | Yes |
| `/book-consultation` | Consultation booking | Booking capture | Submit booking | Yes |
| `/property-valuation` | Valuation | Seller lead capture | Request valuation | Yes |
| `/submit-property` | Submit property | Owner/landlord listing intake | Submit property | Yes |
| `/ai-assistant` | AI Assistant | Guided assisted discovery | Start assistant | Yes |
| `/faq` | FAQ | Objection handling + AEO surface | Contact | Yes |
| `/privacy` | Privacy | Legal | — | Yes |
| `/terms` | Terms | Legal | — | Yes |
| `/404` | Not found | Recovery, not a dead end | Search properties | No |

### 1.1 Route decisions

- **`/blog` and `/market-insights` are kept separate.** `/market-insights` is
  data- and analysis-led (price trends, area performance, yield commentary) and
  serves the *investor / seller* intent. `/blog` is guidance-led (how-to,
  checklists, process) and serves *first-time buyer / general* intent. They have
  different audiences and different schema types. If content volume proves too
  thin to sustain both, they merge under `/market-insights` — decision deferred
  to `PHASE_08_SEO.md`.
- **`/ai-assistant` exists as a route** in addition to the global widget so the
  assistant is linkable, indexable, and reachable without JavaScript-dependent
  discovery.
- **`/submit-property` is distinct from `/sell`.** `/sell` sells the *service*;
  `/submit-property` is the transactional intake form. `/sell` links to it.

## 2. Navigation structure

### 2.1 Primary navigation (desktop)

```
Logo    Properties ▾    Buy    Sell    Rent    Invest    About    Insights ▾    [Call]  [Book a Consultation]
```

- **Properties ▾** → All Properties · For Sale · For Rent · Commercial · Submit a Property
- **Insights ▾** → Market Insights · Blog · Area Guides · FAQ

Rationale: the four transaction verbs (Buy / Sell / Rent / Invest) are top-level
because they are the four business objectives and the four distinct visitor
identities. Everything else nests.

### 2.2 Primary navigation (mobile)

Slide-in drawer, same hierarchy, plus a persistent bottom action bar:

```
[ Call ]   [ WhatsApp ]   [ Search Properties ]
```

### 2.3 Footer

| Column 1 — Properties | Column 2 — Services | Column 3 — Company | Column 4 — Contact |
|---|---|---|---|
| All Properties | Buy | About | Phone |
| For Sale | Sell | Market Insights | WhatsApp |
| For Rent | Rent | Blog | Email |
| Commercial | Invest | FAQ | Office address |
| Submit a Property | Property Valuation | Privacy | Service areas |
| | Book a Consultation | Terms | Social links |

Footer also carries: license/registration number, and the AI assistant disclosure line.

## 3. URL conventions

- Lowercase, hyphen-separated, no trailing slash inconsistency (pick one; canonicalise the other).
- Property slugs: `/properties/{category}-{locality}-{id}` — e.g. `/properties/villa-[locality]-p1`.
  Slugs are generated from data and must be stable; a changed slug requires a 301.
- Filter state is a query string on `/properties`, not a distinct route:
  `?type=buy&category=villa&min=…&max=…&beds=3&area=…&sort=price-asc`
- Query-string filter combinations are `noindex` beyond the canonical
  `/properties` to avoid index bloat. Curated high-value combinations may be
  promoted to real indexed landing pages later — see `LOCAL_SEO_STRATEGY.md`.

## 4. Content hierarchy per page type

### Home
Hero (identity + search + dual CTA) → Trust strip → Featured properties →
Intent router (Buy/Sell/Rent/Invest cards) → About preview → Service areas →
Process → Insights preview → FAQ preview → Final CTA

### Property detail
Gallery → Title/price/key facts → Sticky enquiry panel → Description →
Features → Location & area context → Similar properties → Agent card → CTA

### Landing pages (`/buy`, `/sell`, `/rent`, `/invest`)
Hero (audience-specific) → Problem framing → How Shamraiz helps → Process steps →
Relevant properties → Proof/trust → FAQ (audience-specific) → Lead form

## 5. Cross-linking rules

- Every property detail links to: its area guide, similar properties, and `/contact`.
- Every landing page links to filtered `/properties` results for its audience.
- Every insight/blog article links to at least one conversion route.
- Every form success state links onward to relevant content — never a terminal page.
- No page is more than **2 clicks** from the home page.
- No orphan pages: every route is linked from nav, footer, or a parent page.
