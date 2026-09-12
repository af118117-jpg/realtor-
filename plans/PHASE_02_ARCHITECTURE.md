# PHASE 02 — INFORMATION & TECH ARCHITECTURE

**Status:** ⏸ Documented — **awaiting client decisions before execution**

---

## Objective

Fix the route map, the data model, and the technical foundation. Remediate the
S1 content-integrity defects. Put the project under version control.

## Deliverables

| Deliverable | File | State |
|---|---|---|
| Route map, navigation, URL conventions, cross-linking | `docs/INFORMATION_ARCHITECTURE.md` | ✅ Written |
| Architecture options, recommendation, structure | `docs/TECH_ARCHITECTURE.md` | ✅ Written — decision pending |
| Entity schemas and integrity rules | `docs/DATA_MODEL.md` | ✅ Written |

## Decisions made

1. **19 routes + `/properties/[slug]`**, each with a stated purpose and a single
   primary conversion action.
2. **`/blog` and `/market-insights` stay separate** — different audiences,
   different schema types. Merge condition documented.
3. **Filter state lives in the query string**, `noindex`, canonical to
   `/properties`. High-value combinations may later be promoted to real
   indexed landing pages once real inventory exists.
4. **Four transaction verbs at top level** (Buy / Sell / Rent / Invest) — they
   are the four business objectives and the four visitor identities.
5. **Business facts live only in one config module.** This is what makes the
   `[CONTENT REQUIRED]` policy enforceable by a grep in CI.
6. **Progressive enhancement contract** defined — content, navigation, contact
   details, and listings all work without JavaScript.

## ⚠️ Decision required — architecture

Full analysis in `docs/TECH_ARCHITECTURE.md` §2–3.

**Recommended: Astro with static output.** Rationale: generates
`/properties/[slug]` from data, eliminates 19 copies of the page shell, ships
zero JavaScript by default (serving the performance budget directly), and
provides a validated content pipeline for blog and insights — while still
emitting pure static HTML deployable anywhere.

**Cost:** introduces npm and a build step. Node v26.7.0 and npm 11.19.0 are
present and verified.

**Alternative:** hand-authored multi-page static HTML, no build. Simpler, but
cannot generate property detail pages and makes the 19-route shell
unmaintainable. Choosing it means trimming the route map and accepting a ceiling
on property pages.

**This is not actioned without explicit approval.**

## Execution tasks — blocked pending approval

### 2A. Content integrity remediation — S1, must happen regardless of architecture

| Defect | File | Action |
|---|---|---|
| D-01 | `js/config.js:11` | `agentName` → `[CONTENT REQUIRED]` |
| D-01 | `js/config.js:12` | `agentTitle` → `[CONTENT REQUIRED]` |
| D-02 | `js/config.js:22` | `city` → `[CONTENT REQUIRED]` |
| D-02 | `js/config.js:23` | `serviceAreas` → `[CONTENT REQUIRED]` |
| D-04 | `js/config.js:19` | `email` → `[CONTENT REQUIRED]` |
| D-04 | `js/config.js:40` | `canonicalUrl` → `[CONTENT REQUIRED]` |
| D-03 | `js/listings-data.js` | All `area` values → `[CONTENT REQUIRED]` |
| D-03 | `js/listings-data.js` | `AREA_GUIDES` → placeholder entries, or removed until real areas are known |
| — | `js/config.js` | Add `responseTime`, `geo`, `openingHours` fields |
| — | `js/listings-data.js` | Add `slug`, `status`, `priceUnit`, `listedAt` per `DATA_MODEL.md` |

### 2B. Version control — D-05
- `git init`
- `.gitignore`: `node_modules/`, `dist/`, `.env*`, `WPS Cloud Files/`, OS/editor artifacts
- Initial commit of the current, remediated state

### 2C. Stray directory — D-06
`WPS Cloud Files/` — recommend removal (it is a WPS Office cache artifact, not
project content). **Client decision required**; it will be gitignored either way.

### 2D. Scaffold (if Astro is approved)
- `npm create astro` with static output
- Port `css/style.css` → `src/styles/`, tokens intact
- Port `js/config.js` → `src/config.ts`
- Port `js/listings-data.js` → `src/data/listings.ts`
- Create all 19 route stubs, each rendering its `<h1>` and primary CTA
- `Base.astro` layout with header, footer, and skip link

## Gate for phase completion

- [ ] Architecture decision approved
- [ ] All six defects resolved or explicitly deferred by the client
- [ ] Zero fabricated business facts remain in the codebase (G1)
- [ ] Every route in the map resolves (even as a stub)
- [ ] Project under version control with a clean initial commit
- [ ] Zero console errors (G2)

## Blocks the next phase on

Architecture approval. Phase 03 cannot begin without knowing whether components
are `.astro` files or hand-authored HTML partials.
