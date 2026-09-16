# QA PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

---

## 1. Quality gates

No phase is marked complete until its gate passes. No exceptions, no "we'll fix
it at the end".

| Gate | Applies to | Criterion |
|---|---|---|
| **G1 — Content integrity** | Every phase | Zero fabricated business facts |
| **G2 — Console** | Every phase | Zero errors, zero warnings on every route |
| **G3 — Responsive** | Design/build phases | No horizontal overflow, 320–2560px |
| **G4 — Accessibility** | Build phases | Zero axe violations; keyboard-complete |
| **G5 — Performance** | Build phases | Budgets in `PERFORMANCE_PLAN.md` met |
| **G6 — Journey** | Build phases | All five journeys complete without a dead end |
| **G7 — Link integrity** | Pre-launch | Zero broken internal links or images |
| **G8 — SEO** | Pre-launch | Unique title/description/canonical; valid schema |
| **G9 — Security** | Pre-launch | `SECURITY_PLAN.md` §9 checklist passes |

## 2. G1 — Content Integrity Gate (the project's defining check)

Run before every checkpoint.

```bash
# Any remaining placeholders must be intentional and accepted
grep -rn "\[CONTENT REQUIRED\]" src/

# No sample data may reach production
grep -rn "demo: true" src/data/

# Business facts must come from config, never hard-coded
grep -rniE "(\+?[0-9]{1,3}[ -]?[0-9]{3}[ -]?[0-9]{7})" src/ --include="*.astro" --include="*.ts"
```

**Manual review — every factual claim on the site:**

| Claim type | Verified how |
|---|---|
| Agent name, title, credentials | Client-confirmed in writing |
| Brokerage, license number | Client-confirmed in writing |
| Phone, WhatsApp, email, address | Client-confirmed + tested live |
| City and service areas | Client-confirmed |
| Business hours | Client-confirmed |
| Property prices | Real listing data only |
| Property details (beds, area, features) | Real listing data only |
| Testimonials / reviews | Genuine and attributable, or absent |
| Years of experience, client counts, volumes | Client-confirmed, or absent |
| Awards, certifications | Client-confirmed, or absent |
| Market statistics, yields, growth rates | Client-supplied and attributed, or absent |
| Response-time commitment | Client-confirmed |

**Fail condition:** any claim on the site that cannot be traced to a
client-supplied source. Fabrication is a release blocker, not a note.

## 3. Cross-browser and device matrix

| Browser | Versions | Priority |
|---|---|---|
| Chrome (Android + desktop) | Last 2 | Critical |
| Safari (iOS + macOS) | Last 2 | Critical |
| Firefox | Last 2 | High |
| Edge | Last 2 | High |
| Samsung Internet | Latest | Medium |

**Viewports:** 320 · 360 · 390 · 414 · 768 · 1024 · 1280 · 1440 · 1920 · 2560

Verified per viewport: no horizontal scroll · readable text without zoom ·
tap targets ≥ 44px · images correctly sized · nav functional · forms usable ·
sticky elements not obscuring content.

## 4. Functional test matrix

### Navigation
- [ ] Every nav link resolves to a real page
- [ ] Dropdowns work by mouse, keyboard, and touch
- [ ] Mobile drawer opens, closes, traps focus, closes on `Esc`
- [ ] Logo returns to home from every page
- [ ] Every footer link resolves
- [ ] Breadcrumbs accurate on nested pages
- [ ] Sticky mobile bar present and functional on every page

### Property discovery
- [ ] All listings render
- [ ] Each filter narrows results correctly
- [ ] Combined filters behave as AND
- [ ] Each sort order is correct
- [ ] Text search matches title, category, locality
- [ ] Result count accurate and announced
- [ ] Empty state appears and offers a conversion path
- [ ] Clear-filters resets fully
- [ ] Filter state persists in the URL and survives back/forward/refresh
- [ ] Every card links to the correct detail page
- [ ] Sample listings show the "Sample listing" badge

### Property detail
- [ ] Correct data for every listing
- [ ] Gallery opens, navigates by keyboard, closes, returns focus
- [ ] Price formatting correct; `null` renders "Price on application"
- [ ] Enquiry panel sticky on desktop, accessible on mobile
- [ ] WhatsApp link pre-filled with the correct property reference
- [ ] Similar properties are relevant and link correctly
- [ ] Area link resolves to the correct area guide
- [ ] Schema present on real listings, absent on samples

### Forms (each of the 8)
- [ ] Renders correctly at all viewports
- [ ] Required-field validation triggers with a specific message
- [ ] Format validation on phone and email
- [ ] Errors announced; focus moves to the first invalid field
- [ ] Consent required before submission
- [ ] Honeypot rejects bot submissions
- [ ] Successful submission reaches the destination
- [ ] Success state announced and focus-managed
- [ ] Success state offers a next step
- [ ] WhatsApp alternative works and is pre-filled
- [ ] No personal data in storage, URL, or console

### Concierge
- [ ] Disclosure visible and persistent
- [ ] All intent paths reach a result
- [ ] Property matches are real and correct
- [ ] `NO_MATCH` fallback fires on 10+ off-topic inputs, with zero fabricated answers
- [ ] Handoff paths functional and carry context
- [ ] Fully keyboard operable; focus trapped and restored
- [ ] Nothing persisted

### Contact paths
- [ ] Every `tel:` link dials the correct number
- [ ] Every `wa.me` link opens the correct number
- [ ] `mailto:` opens correctly
- [ ] Directions link opens the correct location
- [ ] Contact details identical everywhere they appear

## 5. Automated checks

| Check | Tool | Threshold |
|---|---|---|
| HTML validity | W3C validator | Zero errors |
| Accessibility | axe-core / Lighthouse | Zero violations, score 100 |
| Performance | Lighthouse mobile | ≥ 95 |
| SEO basics | Lighthouse | 100 |
| Broken links | Link checker over the built output | Zero |
| Broken images | Build-time asset validation | Zero |
| Structured data | Google Rich Results Test | Zero errors |
| Dependency audit | `npm audit` | Zero high/critical |
| Content integrity | Custom grep script (§2) | Manual sign-off |
| Backend test suite | `npm test` in `server/` (Jest + Supertest, real PostgreSQL) | All green |
| Backend type safety | `npx tsc --noEmit` in `server/` | Zero errors |
| API uptime | `GET /healthz` (verifies DB connectivity) | 200 before sign-off, monitored after launch |

### 5a. Backend test coverage (added 2026-09-13)

`server/tests/` — run with `npm test`, which applies migrations to the test
database first (`DATABASE_URL_TEST`, never the development one).

| Layer | Covers |
|---|---|
| Unit | Settings deep-merge, public-listing mapping (slug/type/status), JWT sign/verify, bcrypt round-trip, media MIME + filename sanitization (including `../` traversal attempts), honeypot/timing spam verdict |
| Integration | Every module's routes end-to-end: auth (setup → login → `/me` → 401 without a cookie → CSRF header required), properties CRUD + status + duplicate, media upload/serve/references/cascade-delete + private-document gating, leads CRUD + filtering, settings merge, public endpoints (active-only listings, spam handling, consent required) |
| E2E smoke | One realistic walk: setup → upload → publish → public visibility → public lead → admin sees it → media delete → logout |

## 6. Regression protocol

After any change:
1. Re-run automated checks on affected routes
2. Re-walk any journey the change touches
3. Re-verify the content-integrity gate if copy or data changed
4. Re-measure performance if assets or JS changed
5. Re-check the console on every affected route

## 7. Defect severity

| Severity | Definition | Action |
|---|---|---|
| **S1 Blocker** | Fabricated fact · broken conversion path · site-down · data leak | Fix immediately; blocks the phase |
| **S2 Critical** | Broken journey · accessibility violation · console error · budget breach | Fix before phase completion |
| **S3 Major** | Visual break · minor journey friction · missing schema | Fix before launch |
| **S4 Minor** | Cosmetic inconsistency · copy polish | Fix if time allows; log otherwise |

## 8. Sign-off

Each phase checkpoint reports: gates passed · gates failed with reason ·
open defects by severity · content items still `[CONTENT REQUIRED]` ·
anything requiring a client decision.

**No phase is reported complete with an open S1 or S2.**
