# PHASE 06 — PROPERTY DISCOVERY

**Status:** ⬜ Not started — blocked by Phase 05

---

## Objective

Build the search, filter, and property detail experience — the core product
surface and the path to the highest-value lead (the viewing request).

## Reference
`docs/DATA_MODEL.md` §2, `docs/INFORMATION_ARCHITECTURE.md`, `PHASE_04_UX.md` §4C–4D

## Tasks

### 6A. Data layer
- [ ] Implement the `Listing` schema in full, with build-time validation
- [ ] Slug generation — stable, collision-checked
- [ ] Build fails on: missing required field, broken image path, `locality` with
      no matching area guide
- [ ] `demo: true` listings excluded from the sitemap and marked `noindex`

### 6B. Listing grid
- [ ] Server-rendered card grid — all listings present in the HTML
- [ ] Responsive 3 → 2 → 1 collapse
- [ ] Lazy-loaded images with explicit dimensions and reserved aspect ratio
- [ ] "Sample listing" badge on every `demo: true` card
- [ ] Progressive loading or pagination beyond ~12 cards

### 6C. Filtering
- [ ] Filters: type · category · price range · beds · baths · locality
- [ ] Combined filters behave as AND
- [ ] Sort: newest · price ascending · price descending
- [ ] Free-text search across title, category, locality
- [ ] Applied-filter chips with individual removal, plus clear-all
- [ ] Result count in an `aria-live="polite"` region
- [ ] URL state sync; back/forward/refresh restore filters
- [ ] URL parameters validated against an allowlist before use (`SECURITY_PLAN.md` §5)
- [ ] Filtering reorders/toggles existing nodes — it does not rebuild the DOM
- [ ] Debounced text input (150ms)
- [ ] Empty state offering a lead-capture path

### 6D. Property detail page
- [ ] Generated per listing at a stable URL
- [ ] Gallery with keyboard navigation, focus trap, `Esc`, position announcement
- [ ] Key facts, description, features
- [ ] Price formatting; `null` → "Price on application"
- [ ] Sticky enquiry panel (desktop sidebar → mobile bottom sheet)
- [ ] WhatsApp link pre-filled with the property reference
- [ ] Similar properties
- [ ] Area guide cross-link
- [ ] Agent card
- [ ] `status` handling — sold/let pages retained, marked, `noindex`

### 6E. Structured data
- [ ] `RealEstateListing` on real listings only
- [ ] `Offer` only where a real price exists
- [ ] `BreadcrumbList`
- [ ] **Zero listing schema on `demo: true` pages**

## Standing constraints

- **No invented property data.** Prices, sizes, features, and localities are real
  or `[CONTENT REQUIRED]`.
- Sample listings are unmistakably marked in the UI and excluded from search
  indexing and schema.
- Full listing content renders without JavaScript; filtering is the enhancement.

## Gate

- [ ] Every functional check in `QA_PLAN.md` §4 (Property discovery, Property detail) passes
- [ ] Zero axe violations on grid and detail pages
- [ ] Filter announcements verified with a screen reader
- [ ] `/properties` meets the performance budget with the full listing set
- [ ] Zero layout shift during filtering
- [ ] Schema validates; zero schema on sample data
- [ ] Zero console errors
