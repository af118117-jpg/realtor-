# PHASE 03 — VISUAL DESIGN SYSTEM

**Status:** ⬜ Not started — blocked by Phase 02

---

## Objective

Formalise the design system into implemented, documented, reusable components
with every state built and verified.

## Reference
`docs/DESIGN_SYSTEM.md` — tokens, contrast table, scale, component contracts.

## Tasks

### 3A. Token layer
- [ ] Extract all tokens into `styles/tokens.css` as the single source
- [ ] Add missing tokens: fluid type scale, z-index scale, transition durations
- [ ] Re-verify every contrast pair; update `DESIGN_SYSTEM.md` §2.2
- [ ] Audit existing CSS for hard-coded values outside the scale; replace

### 3B. Base layer
- [ ] Reset and normalisation
- [ ] Typography defaults with fluid clamps
- [ ] Focus-visible defaults meeting 3:1
- [ ] Reduced-motion global block
- [ ] Container and section rhythm utilities

### 3C. Components — every state from `DESIGN_SYSTEM.md` §7
- [ ] Button — primary, secondary, ghost × 6 states
- [ ] Header / nav — top, scrolled, mobile-open
- [ ] Footer — 4-column, responsive collapse
- [ ] Property card — including the "Sample listing" badge
- [ ] Section header
- [ ] Form field — all 6 states
- [ ] Accordion
- [ ] Modal / lightbox
- [ ] Toast
- [ ] Empty state and loading skeleton
- [ ] Pagination
- [ ] Badge / chip
- [ ] Breadcrumbs

### 3D. Component gallery
- [ ] Build an internal `/_styleguide` route rendering every component in every
      state — the artefact that makes drift visible and reviewable

## Decisions to make

| Decision | Options |
|---|---|
| Light mode | Dark-only, or a light variant? Dark-only is recommended — it suits the premium positioning and halves the surface area. A light variant doubles the contrast-verification work |
| Hero treatment | Full-bleed image, split layout, or video? Video is discouraged on the performance budget |
| Photography direction | Requires real photography — `[CONTENT REQUIRED]` |
| Logo / wordmark | Does one exist? `[CONTENT REQUIRED]` |

## Gate

- [ ] Every component has every state implemented and visible in the gallery
- [ ] Zero hard-coded colour, spacing, radius, or duration outside tokens
- [ ] Every contrast pair verified and documented
- [ ] Every interactive component keyboard-operable with visible focus
- [ ] `prefers-reduced-motion` honoured throughout
- [ ] Gallery renders correctly at 320 · 768 · 1440
- [ ] Zero console errors
