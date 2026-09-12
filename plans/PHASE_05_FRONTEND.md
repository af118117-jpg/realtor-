# PHASE 05 — FRONTEND BUILD

**Status:** ⬜ Not started — blocked by Phase 04

---

## Objective

Build every route as accessible, performant, semantic HTML with the design
system applied. Content pages only — property discovery is Phase 06, assistant
and forms are Phase 07.

## Tasks

### 5A. Layout shell
- [ ] `Base` layout: `<head>`, skip link, header, `<main>`, footer
- [ ] `Meta` component: title, description, canonical, OG, Twitter — per page
- [ ] Header with desktop nav, dropdowns, mobile drawer
- [ ] Footer with the four-column structure
- [ ] Mobile sticky action bar
- [ ] All contact values sourced from config, never hard-coded

### 5B. Home page
- [ ] Every section from `PHASE_04_UX.md` §4B
- [ ] Hero with correct LCP treatment (eager, high priority, explicit dimensions)
- [ ] Search entry point (wires to Phase 06)
- [ ] Featured properties (wires to Phase 06)

### 5C. Audience landing pages
- [ ] `/buy` · `/sell` · `/rent` · `/invest`
- [ ] Each with audience-specific hero, process, proof, FAQ block, lead form slot
- [ ] `/rent` split clearly into tenant and landlord halves

### 5D. Trust and service pages
- [ ] `/about` — bio, credentials, entity statement, service areas
- [ ] `/services` — service catalogue
- [ ] `/contact` — all contact methods, map or static alternative, form slot

### 5E. Content pages
- [ ] `/market-insights` index
- [ ] `/blog` index and article template
- [ ] Area guide template
- [ ] `/faq` with accordion, sourced from FAQ data

### 5F. Conversion pages (structure only; form logic in Phase 07)
- [ ] `/book-consultation` · `/property-valuation` · `/submit-property`

### 5G. Utility pages
- [ ] `/privacy` · `/terms` · `/accessibility` · `/404`
- [ ] 404 returns a real 404 status and offers search + contact

### 5H. Assets
- [ ] Image pipeline: AVIF/WebP, `srcset`, explicit dimensions
- [ ] Fonts self-hosted, subset, preloaded
- [ ] Favicon set and web manifest

## Standing constraints

- Zero fabricated content — `[CONTENT REQUIRED]` renders visibly
- Semantic HTML before ARIA; ARIA only where semantics fall short
- Pages with no interactive island ship zero JavaScript
- Every image has explicit dimensions (CLS defence)
- Every external link carries `rel="noopener noreferrer"`

## Gate

- [ ] All 19 routes render fully
- [ ] Every route: unique title, description, canonical, one `<h1>`
- [ ] Zero console errors or warnings (G2)
- [ ] No horizontal overflow, 320–2560px (G3)
- [ ] Zero axe violations; keyboard-complete (G4)
- [ ] Performance budgets met on every route (G5)
- [ ] Zero broken links or images (G7)
- [ ] Zero fabricated facts (G1)
