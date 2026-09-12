# PHASE 04 — UX & JOURNEY DESIGN

**Status:** ⬜ Not started — blocked by Phase 03

---

## Objective

Turn the five documented journeys into concrete page compositions, interaction
specifications, and conversion placements — before writing page code.

## Reference
`docs/USER_JOURNEYS.md`, `docs/LEAD_GENERATION.md`, `docs/INFORMATION_ARCHITECTURE.md` §4

## Tasks

### 4A. Page composition
For each of the 19 routes, specify:
- [ ] Section order and purpose of each section
- [ ] The single page-level primary CTA
- [ ] Secondary and tertiary actions
- [ ] Content requirements per section (and which are `[CONTENT REQUIRED]`)
- [ ] Mobile section order where it differs from desktop
- [ ] Empty, loading, and error states

### 4B. Home page — highest-stakes composition
The first screen must answer, without scrolling: who is this · what do they do ·
where · who do they help · why trust them · what do I do next.

- [ ] Hero: identity statement + property search + primary CTA + secondary CTA
- [ ] Trust strip immediately below the fold
- [ ] Intent router — four cards mapping to the four audiences
- [ ] Featured properties
- [ ] About preview → `/about`
- [ ] Service areas → area guides
- [ ] Process — what working with this agent actually involves
- [ ] Insights preview
- [ ] FAQ preview
- [ ] Final conversion block

**Constraint:** the hero must work while the agent's name, city, and areas are
`[CONTENT REQUIRED]` — the layout cannot depend on copy that does not exist yet.

### 4C. Property detail — highest-converting page
- [ ] Gallery interaction spec (open, navigate, close, keyboard, touch)
- [ ] Sticky enquiry panel behaviour: desktop sidebar → mobile bottom sheet
- [ ] Key-facts hierarchy
- [ ] "Price on application" handling when `price` is `null`
- [ ] Similar-properties selection logic
- [ ] Sample-listing badge treatment

### 4D. Search and filter UX
- [ ] Filter layout: desktop sidebar vs. mobile drawer
- [ ] Applied-filter chips with individual removal
- [ ] Result count placement and live-region announcement
- [ ] Sort control
- [ ] Empty state that converts
- [ ] URL state sync and back-button behaviour
- [ ] Loading/skeleton treatment during filtering

### 4E. Form UX
- [ ] Field order and grouping per form
- [ ] Progressive disclosure of optional fields
- [ ] Validation timing and message copy
- [ ] Error summary placement and focus movement
- [ ] Success state content and onward links
- [ ] WhatsApp alternative placement

### 4F. Microcopy
- [ ] Every CTA label — specific and outcome-shaped
- [ ] Every form label, helper text, and error message
- [ ] Every empty state
- [ ] Success and confirmation copy
- [ ] Assistant disclosure copy (from `AI_AGENT_SPEC.md` §2, verbatim)
- [ ] 404 copy

## Gate

- [ ] All 19 pages composed with a defined primary CTA
- [ ] All five journeys walk end-to-end on paper with no dead ends
- [ ] Every interactive behaviour specified before implementation
- [ ] Every state (empty, loading, error, success) specified
- [ ] No composition depends on fabricated content
- [ ] Mobile composition specified wherever it differs
