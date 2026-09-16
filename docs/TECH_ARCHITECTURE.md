# TECH ARCHITECTURE — REALTOR SHAMRAIZ

**Last updated:** 2026-09-13
**Status:** ⚠️ **FRONTEND DECISION STILL PENDING** — see §3.
A backend now exists and is documented in §9; it is **independent of** the
Astro-vs-static-HTML question below, which remains open.

This architecture was derived independently from the master requirements. No
architectural assumption was carried over from any other project.

---

## 1. Requirements that drive the decision

| Driver | Implication |
|---|---|
| 19 static routes + `/properties/[slug]` dynamic pattern | Needs generated pages from a data source; hand-authoring is not viable |
| SEO / AEO / GEO / Local SEO are first-class objectives | Every route must ship **fully rendered HTML** with per-page `<head>` and JSON-LD |
| Performance budget (LCP ≤ 2.5s, CLS ≤ 0.1) | Minimal client-side JavaScript; no client-side routing/rendering for content |
| No backend, no database, no auth | Static output; forms via third-party endpoint + WhatsApp deep links |
| Blog + market insights | Needs a content authoring pipeline (Markdown) with schema validation |
| Shared shell across 19 routes | Needs layout/component reuse — duplicated headers across 19 files is a defect waiting to happen |
| Client will maintain listings | Property data must live in one editable, versioned file |
| Accessibility to WCAG 2.1 AA | Semantic server-rendered HTML, progressive enhancement |

**Verified available toolchain:** Node v26.7.0, npm 11.19.0, git 2.55.0.

## 2. Options considered

### Option A — Hand-authored multi-page static HTML (no build step)
- ✅ Zero tooling, zero dependencies, opens in a browser directly
- ✅ Trivially deployable anywhere
- ❌ **19 copies of the header/footer/nav** — every nav change is a 19-file edit
- ❌ `/properties/[slug]` cannot be generated; each property needs a hand-written file
- ❌ No content pipeline for blog/insights
- ❌ Per-page JSON-LD and meta duplicated by hand → drift is near-certain
- **Verdict: rejected.** It fails the maintainability and dynamic-route requirements.

### Option B — Astro, static output ✅ **RECOMMENDED**
- ✅ File-based routing maps 1:1 onto the route map in `INFORMATION_ARCHITECTURE.md`
- ✅ `getStaticPaths()` generates every `/properties/[slug]` page from the data file
- ✅ Layouts and components eliminate shell duplication
- ✅ **Ships zero JavaScript by default** — directly serves the performance budget
- ✅ Islands (`client:visible` / `client:idle`) for the few interactive parts (filters, concierge, forms) and nothing else
- ✅ Content Collections give typed, schema-validated Markdown for blog/insights
- ✅ Per-page `<head>`, canonical, and JSON-LD as composable components
- ✅ `astro build` emits pure static HTML/CSS/JS — deployable to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or plain shared hosting
- ⚠️ Introduces npm dependencies and a build step
- ⚠️ Client edits require running a build to publish

### Option C — Next.js (static export)
- ✅ Capable, well-known
- ❌ Ships a React runtime for content that needs none — works against the performance budget
- ❌ Heavier dependency surface than the requirements justify
- **Verdict: rejected as over-specified** for a no-backend marketing/discovery site.

### Option D — Eleventy
- ✅ Genuinely excellent for this shape of site; lighter than Astro
- ⚠️ Component/island model is less ergonomic for the interactive parts (filters, concierge)
- **Verdict: viable runner-up.** Choose it over Astro if the client's priority is
  minimal dependencies over developer ergonomics.

## 3. ⚠️ Recommendation — requires approval

**Recommended: Option B — Astro with `output: 'static'`.**

This is a **material change** from the current single-page vanilla structure and
introduces a build toolchain. Under the checkpoint process it must not be acted
on without explicit approval.

**If approved**, existing work is carried forward rather than discarded:
- `css/style.css` → becomes the global design-system stylesheet (tokens intact)
- `js/config.js` → becomes `src/config.ts`, still the single source of business truth
- `js/listings-data.js` → becomes `src/data/listings.ts`, feeding `getStaticPaths`
- `js/ai-concierge.js`, `js/forms.js`, `js/listings.js` → become island components
- `index.html` → decomposes into `src/layouts/Base.astro` + `src/pages/index.astro`

**If declined**, the fallback is Option A with a strict constraint: a documented
shared-partial convention and an accepted ceiling on the number of property
detail pages. The route map would need trimming, and I would flag which
requirements become unachievable.

## 4. Proposed structure (Option B)

```
src/
  config.ts                  # single source of business truth (REALTOR_CONFIG)
  data/
    listings.ts              # property records
    areas.ts                 # service-area guides
    faq.ts                   # Q&A pairs (feeds /faq + FAQPage schema)
    concierge-intents.ts     # rule-based assistant intent set
  layouts/
    Base.astro               # <head>, nav, footer, skip-link
    Page.astro               # standard content page
    Article.astro            # blog / insights
  components/
    seo/    Meta.astro  JsonLd.astro  Breadcrumbs.astro
    nav/    Header.astro  Footer.astro  MobileBar.astro
    property/ Card.astro  Grid.astro  Gallery.astro  Facts.astro
    forms/  LeadForm.astro  ValuationForm.astro  Field.astro
    ui/     Button.astro  Section.astro  Accordion.astro  EmptyState.astro
  islands/
    PropertyFilters.ts       # client:visible
    Concierge.ts             # client:idle
    FormRuntime.ts           # client:visible
  pages/
    index.astro
    properties/index.astro
    properties/[slug].astro
    buy.astro  sell.astro  rent.astro  invest.astro
    services.astro  about.astro  contact.astro
    market-insights/index.astro
    blog/index.astro  blog/[...slug].astro
    book-consultation.astro  property-valuation.astro
    submit-property.astro  ai-assistant.astro  faq.astro
    privacy.astro  terms.astro  404.astro
    sitemap.xml.ts  robots.txt.ts
  styles/
    tokens.css  base.css  components.css  utilities.css
public/
  assets/images/…
docs/  plans/
```

## 5. Data model boundary

All property, area, and FAQ data lives in `src/data/` as typed modules. Pages
import from there; **no page defines its own data**. See `DATA_MODEL.md`.

Business facts live only in `src/config.ts`. Any component needing a phone
number, address, or name imports it — never hard-codes it. This is what makes
the `[CONTENT REQUIRED]` policy enforceable by grep.

## 6. Progressive enhancement contract

| Layer | Without JS | With JS |
|---|---|---|
| Content & navigation | ✅ Fully readable and navigable | Same |
| Contact details | ✅ Visible, `tel:`/`mailto:`/`wa.me` links work | Same |
| Property listings | ✅ All rendered server-side | Same |
| Property filtering | Server-rendered full list; filters degrade to plain links | Interactive filtering |
| Forms | Native HTML validation + standard POST to endpoint | Inline validation, async submit, success state |
| AI Concierge | Hidden; `/ai-assistant` shows contact routes instead | Interactive |

## 7. Deployment

- Build: `npm run build` → `dist/`
- Host: static host with custom headers support (Netlify / Cloudflare Pages / Vercel)
- Headers, CSP, and redirects: see `SECURITY_PLAN.md`
- Domain: `[CONTENT REQUIRED]`
- Version control: git. **This directory is not yet a git repository** — see
  `PHASE_00_AUDIT.md`. Initialising it is a prerequisite for any further work.

## 8. Dependency policy

- Every dependency must be justified in writing in this document before being added.
- No UI/component library. The design system is bespoke (`DESIGN_SYSTEM.md`).
- No analytics or third-party script without an entry in `SECURITY_PLAN.md` and
  a corresponding CSP allowance.
- **Frontend** production runtime dependencies: **zero** (unchanged). Astro,
  if adopted, is a build-time dependency only. The zero-dependency pledge was
  always scoped to what ships to the browser; the backend in §9 is a separate
  Node process and has its own justified dependency list.

## 9. Backend (added 2026-09-13)

A real backend replaced the client-side-only admin data layer. See
`plans/MASTER_PLAN.md` D-28 and `server/README.md`.

**Shape:** a standalone Node.js + TypeScript REST API in `server/`, running as
its own process on its own port. The repo-root `server.js` (the zero-dependency
static dev server) is untouched and still serves the frontend.

| Concern | Choice | Why |
|---|---|---|
| Framework | Express 4 | Minimal, well-understood, no framework lock-in for a ~25-route API |
| ORM / DB | Prisma + PostgreSQL | Typed schema and migrations; provider-portable through `DATABASE_URL` alone |
| Validation | Zod | One schema per endpoint, shared error shape, no hand-rolled guards |
| Auth | JWT access cookie (15 min) + rotating opaque refresh cookie (14 days), both `httpOnly`/`SameSite=Lax` | Six independent static admin pages share a session with no token plumbing, and no token is readable by JavaScript |
| CSRF | Required `X-Admin-Request` header on state-changing requests | A cross-site form or script cannot set a custom header; no extra dependency |
| Passwords | bcrypt via `bcryptjs` (12 rounds) | Standard and deliberately slow; the pure-JS build avoids a node-gyp step and keeps a critical-severity `tar` chain out of the tree |
| Media | `multer` → local disk behind the API | Only `src/modules/media` touches the filesystem, so S3/R2 later changes one module and zero frontend code |
| Logging | pino / pino-http | Structured, silent in tests |
| Docs | swagger-jsdoc + swagger-ui-express at `/api/docs` | Route annotations stay next to the routes |
| Tests | Jest + Supertest against a real Postgres | Integration and e2e coverage, not mocks |

**Runtime dependencies (backend only):** express, @prisma/client, zod,
bcryptjs, jsonwebtoken, cookie-parser, helmet, cors, express-rate-limit,
multer, pino, pino-http, swagger-jsdoc, swagger-ui-express, dotenv. Each is
load-bearing for a row in the table above. `npm audit` reports **0
vulnerabilities**; two transitive advisories (`qs` via express, `deepmerge-ts`
via the Prisma CLI) are resolved by pinned `overrides` in
`server/package.json`, each with a comment explaining why.

**Database portability:** nothing in the code names a provider. Local
development can use Docker (`server/docker-compose.yml`), a native Postgres
install, a managed provider (Neon/Supabase/Railway), or the zero-install
PGlite dev server (`npm run dev:db`) for machines with neither Postgres nor
Docker. Production hosting is still `[CONTENT REQUIRED]`.

**Relationship to §3:** the backend serves JSON and files. It does not decide,
and is not affected by, whether the frontend stays hand-authored static HTML or
moves to Astro — either consumes the same endpoints.
