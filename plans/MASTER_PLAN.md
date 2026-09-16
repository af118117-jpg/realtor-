# MASTER PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07
**Process:** phase-gated. One phase at a time. **Checkpoint and explicit approval
after every phase.** No batching ahead, no skipping.

---

## Phase sequence

| # | Phase | Plan | Status |
|---|---|---|---|
| 00 | Audit & Reset | `PHASE_00_AUDIT.md` | ✅ Complete — report delivered |
| 01 | Research & Business Architecture | `PHASE_01_RESEARCH.md` | ✅ Complete — documentation delivered |
| 02 | Information & Tech Architecture | `PHASE_02_ARCHITECTURE.md` | ⏸ **Awaiting approval — architecture decision required** |
| 03 | Visual Design System | `PHASE_03_DESIGN.md` | 🟡 **Partial** — design direction (§10) and the full system definition (§11) are documented and implemented on the homepage. Applying it across the other 18 routes is blocked on the architecture decision |
| 04 | UX & Journey Design | `PHASE_04_UX.md` | ⬜ Not started |
| 05 | Frontend Build | `PHASE_05_FRONTEND.md` | ⬜ Not started |
| 06 | Property Discovery | `PHASE_06_PROPERTIES.md` | ⬜ Not started |
| 07 | Assistant & Lead Capture | `PHASE_07_AI.md` | ⬜ Not started |
| 08 | SEO / AEO / GEO / Local | `PHASE_08_SEO.md` | ⬜ Not started |
| 09 | QA & Hardening | `PHASE_09_QA.md` | ⬜ Not started |
| 10 | Launch | `PHASE_10_LAUNCH.md` | ⬜ Not started |

## Rules in force for every phase

1. **One phase at a time.** Work stops at the checkpoint and waits for approval.
2. **Never fabricate business facts.** Unknown values render `[CONTENT REQUIRED]`.
3. **Never overstate the assistant.** It is rule-based and must be described as such.
4. **Never touch files outside this project directory.**
5. **Gates before completion.** A phase with an open S1 or S2 defect is not complete.
6. **Decisions requiring client input are surfaced, not assumed.**

## Checkpoint format

Every phase ends with:
- What was built
- What was decided, and why
- Gates: passed / failed
- Open defects by severity
- `[CONTENT REQUIRED]` items introduced or resolved
- **Decisions needed from the client before the next phase**
- Explicit request to proceed

## Critical path blockers

These block multiple downstream phases and should be resolved as early as possible.

| Blocker | Blocks | Owner |
|---|---|---|
| Architecture approval (Astro vs. static HTML) | 02 → 10 | Client |
| Business facts (name, brokerage, city, areas, contact) | 03, 05, 08, 10 | Client |
| Real listing data | 06, 08, 10 | Client |
| Photography (agent + properties) | 03, 05, 10 | Client |
| Form endpoint choice | 07, 09, 10 | Client |
| AI crawler policy | 08, 10 | Client |
| Assistant naming decision | 07, 10 | Client |
| Domain | 08, 10 | Client |

## Requirements received, scoped, not yet built

Sections §13–§21 of the client's master requirements arrived 2026-09-08: Property
Data Model, Property Detail, Comparison, Favorites, Sell Page, Property Valuation
form, Buy Page, Rent Page, Investment Page. Phase mapping and current state:

| § | Requirement | Phase | State |
|---|---|---|---|
| 13 | Property Data Model | 02/06 | ✅ Schema extended in `docs/DATA_MODEL.md` §2 (address, coordinates, parking, amenities, updatedAt, agentId, sensitive-data exclusion rule) — pure documentation, no routing dependency |
| 15 | Property Comparison | 06 | ✅ Architecture documented, `docs/DATA_MODEL.md` §8 (`rs:compare`, capped at 4, reuses the shortlist pattern) — no page yet |
| 16 | Favorites | 06/07 | ✅ Already covered by `rs:shortlist` (existing); added the "this device only, not synced" constraint the brief explicitly requires |
| 21 | Investment Page | 06 | 🟡 Data contract only — `docs/DATA_MODEL.md` §9 `InvestmentSnapshot` (sourced, dated, ranged figures; no promised ROI). Page itself not built |
| 14 | Property Detail | 05/06 | ⬜ **Blocked** — needs real routes |
| 17 | Sell Page | 04/05 | ⬜ **Blocked** — needs real routes |
| 18 | Property Valuation form | 07 | ⬜ **Blocked** — needs a form endpoint (already an open blocker) and a route |
| 19 | Buy Page | 04/05 | ⬜ **Blocked** — needs real routes |
| 20 | Rent Page | 04/05 | ⬜ **Blocked** — needs real routes |

Six of the nine new sections are full pages. Building them today means either
more standalone `.html` files (the exact sprawl the architecture decision exists
to prevent — D-13) or scaffolding real routes by hand before the client has
chosen Astro vs. static HTML. Holding here rather than building on the wrong
foundation twice.

## Requirements received 2026-09-08: §22–48

The client pasted a further block of their master requirements (About page,
Services, Booking System, Lead System, Shamraiz AI + intents + safety + UI,
WhatsApp/Call CTAs, Content system, SEO/AEO/GEO/Local/Entity SEO, FAQ strategy,
Author authority, Content freshness, Internal linking, Property SEO,
Machine-readable info, Performance) with no additional commentary — same
pattern as §13–21.

**Finding:** unlike §13–21, most of §22–48 is not new scope. Phase 01 research
(dated 2026-09-07, before this paste arrived) already produced dedicated docs
that independently cover nearly all of it:

| §§ | Topic | Already covered by |
|---|---|---|
| 22, 23 | About / Services pages | `INFORMATION_ARCHITECTURE.md` (routes defined, §22/23 content is page copy — blocked same as §14/17/19/20) |
| 24 | Booking system | `INFORMATION_ARCHITECTURE.md` (`/book-consultation` route defined) — blocked on route scaffold + form endpoint |
| 25, 26 | Lead system, qualification | `LEAD_GENERATION.md`, `AI_AGENT_SPEC.md` §4 — **gap found and filled**, see below |
| 27–32 | Shamraiz AI, intents, safety, UI, handoff | `AI_AGENT_SPEC.md` in full — **two gaps found and filled**, see below |
| 33, 34 | WhatsApp / Call CTAs | Already resolved by D-11, D-15 |
| 35, 41, 42 | Content system, GEO, citation-worthy content | `GEO_STRATEGY.md` |
| 36 | Technical SEO | `SEO_STRATEGY.md` §2 |
| 37 | Local SEO | `LOCAL_SEO_STRATEGY.md` (explicitly blocks fabricated service areas and thin location pages — same rule D-21 just enforced) |
| 38 | Entity SEO | `SEO_STRATEGY.md` + `docs/DATA_MODEL.md` §1 (`BusinessConfig` as the single entity source) |
| 39, 40 | AEO, FAQ strategy | `AEO_STRATEGY.md` |
| 43 | Author authority | `SEO_STRATEGY.md` — content blocked on real bio/credentials, same as existing blockers |
| 44 | Content freshness | `docs/DATA_MODEL.md` §6 `Article` — **small gap filled**, `reviewedAt` added |
| 45 | Internal linking | `SEO_STRATEGY.md` |
| 46 | Property SEO / no thin listing pages | `SEO_STRATEGY.md` §hedging + `LOCAL_SEO_STRATEGY.md` — already fully specified (demo/noindex rules) |
| 47 | Machine-readable single source of truth | `js/config.js` (`REALTOR_CONFIG`) already *is* this — no new doc needed |
| 48 | Performance | `PERFORMANCE_PLAN.md` |

**Real gaps found and filled (pure documentation, no routing or fact dependency):**
1. `docs/DATA_MODEL.md` §5 — `ConciergeIntent.id` formalised as a closed 13-value
   enum (was a free string) — master requirements §28.
2. `docs/DATA_MODEL.md` §10 (new) — `Lead`, the CRM-side pipeline record
   (`NEW → QUALIFIED → CONTACTED → VIEWING_BOOKED → NEGOTIATION → CONVERTED`,
   `LOST` from any state), kept explicitly separate from the client-transmitted
   `LeadSubmission` (§7) — master requirements §25.
3. `docs/DATA_MODEL.md` §11 (new) — FACT / ESTIMATE / GENERAL INFORMATION /
   USER-PROVIDED INFORMATION categorisation the assistant must apply to every
   claim — master requirements §30.
4. `docs/DATA_MODEL.md` §6 — `Article.reviewedAt` added — master requirements §44.
5. `docs/AI_AGENT_SPEC.md` §6 — added the exact required zero-inventory
   phrasing ("I don't currently have verified live inventory for that
   request.") and cross-links to the two new `DATA_MODEL.md` sections — master
   requirements §29.

**Not built:** the actual About, Services, and Booking pages (§22–24) — same
architecture blocker as §14/17/19/20. §31 (AI Chat UI redesign to floating
button + panel + property cards) is a UI *build*, not documentation, and is
held for the same reason: building it now means either more standalone HTML
or hand-scaffolding before Astro-vs-static is decided.

## Requirements received 2026-09-08: §49–50

Accessibility and Security. Both are already fully covered by Phase 01's
`docs/ACCESSIBILITY_PLAN.md` and `docs/SECURITY_PLAN.md` (dated 2026-09-07,
predating this paste) — same pattern as most of §22–48. Two real deltas found
and fixed:

1. **`docs/ACCESSIBILITY_PLAN.md`** — target was WCAG 2.1 AA; §49 asks for 2.2.
   Raised the target and added a §10a delta table: of the six criteria new in
   2.2, four were already satisfied by existing rules (Focus Not Obscured,
   Target Size, Consistent Help placement, Accessible Authentication — N/A, no
   login exists), and two are now flagged forward for when they become
   relevant (no drag-only controls; multi-step forms in §18/24, once built,
   must not ask for the same field twice).
2. **`docs/SECURITY_PLAN.md`** §5a (new) — §50's "do not trust AI-generated
   content as verified data" wasn't explicitly stated. Added: any future LLM
   backend's output is untrusted input like any visitor input, and — more
   relevant today — content drafted with AI tooling during this build (copy,
   code, docs) carries no evidentiary weight toward a business fact; only a
   client-supplied source (`C1`, `C2`, `BR`, ...) makes a claim shippable. This
   formalizes a rule the project has been operating under since Phase 00.

No routes, code, or `[CONTENT REQUIRED]` items were touched — pure documentation.

## Requirements received 2026-09-08: hero video + agent picture

User asked to add a picture and a video from the client's YouTube channel, and
a new hero headline "Own your experience."

**Investigated:** the channel (`youtube.com/@propertiesbyShamraiz`) is entirely
Shorts — 240 vertical (9:16) uploads, each a caption for one specific property
listing, no long-form "Videos" tab and no general brand/intro video. Flagged
to the user before building anything, since a vertical listing-specific Short
doesn't suit a wide hero background and would misleadingly spotlight one
(possibly already-sold) property as the site's flagship.

**Decided (user, via `AskUserQuestion`):**
- Hero video: **held.** User wants a proper wide-format video from elsewhere,
  not a channel Short. No video embedded until that's supplied.
- Agent picture: destination confirmed as the About/hero split section
  (replacing `agent-placeholder.svg`), but no actual photo file has been
  supplied yet — also held.
- Hero headline: **changed.** "Exceptional homes, transparently handled." →
  "Own Your Experience." at the client's explicit verbatim request, confirmed
  via `AskUserQuestion`. Logged as source `C3` in `docs/COPY_DECK.md` §3.1 (new
  source code for direct client chat instructions). Trust-building duty that
  H1 used to carry now rests on the hero proof row alone, noted in the same doc.

Gate: 47/47 pass. Verified live in-browser.

## Demo media added 2026-09-09

User asked to add realistic demo property images and a demo property video to
the existing sections (no rebuild, no layout/design changes), stored under
`assets/`, with simple filenames so real photos/video can drop in later
without touching code.

**Sourced** from Pexels and Pixabay (both free-to-use licenses, no attribution
required, verified via each item's own license page before download) — never
fabricated or AI-generated, and nothing here claims to depict a real Shamraiz
property; the existing "Sample listing" badges and `demo: true` flags already
in the data model continue to make that explicit in the UI.

| File | Replaces | Source |
|---|---|---|
| `assets/images/hero.jpg` | `hero-placeholder.svg` | Pexels 4626268 |
| `assets/images/listings/villa.jpg` | `placeholder-1.svg` | Pexels 31817156 |
| `assets/images/listings/penthouse.jpg` | `placeholder-2.svg` | Pexels 4933154 |
| `assets/images/listings/apartment.jpg` | `placeholder-3.svg` | Pexels 6588599 |
| `assets/images/listings/commercial.jpg` | `placeholder-4.svg` | Pexels 8933650 |
| `assets/images/listings/house.jpg` | `placeholder-5.svg` | Pexels 7587880 |
| `assets/images/listings/studio.jpg` | `placeholder-6.svg` | Pexels 6933852 |
| `assets/video/property-tour.mp4` | (new — hero background) | Pixabay 172861 ("Villa, Property, Alanya Mansions") |

Old placeholder SVGs deleted (no longer referenced anywhere). `agent-placeholder.svg`
deliberately **not** replaced — the user's own category list (houses, villas,
apartments, interiors, luxury properties) didn't include a person, and
swapping in a stock photo of a stranger as "Shamraiz's portrait" would
misrepresent who a visitor is dealing with in a way a generic property photo
never could. Left as the existing silhouette placeholder pending a real photo.

**Hero video**: added as a `<video>` alongside the existing `<img>` (which
remains the permanent fallback), active only when `window.innerWidth >= 768`
and `prefers-reduced-motion` is not set — mobile and reduced-motion visitors
always see the static image, matching `ACCESSIBILITY_PLAN.md` §7. Images
served at Pexels' own compressed widths (1920px hero, 1200px cards) rather
than the multi-MB originals, keeping every listing image under ~270KB.

**To replace with real files later**: overwrite the file at the same path with
the same filename (e.g. drop a real photo in as `assets/images/listings/villa.jpg`)
— no code changes needed. Flagged to the user: `assets/images/hero section.jpg`
exists on disk (1138×188px, added 2026-09-08) but is unreferenced anywhere in
the code and wasn't touched — left in place pending the user's confirmation
of what it's for.

## Defect log

| ID | Sev | Description | Status |
|---|---|---|---|
| **D-01** | S1 | Fabricated agent surname ("Shamraiz Ahmed") | ✅ **Fixed** — `[CONTENT REQUIRED]` |
| **D-02** | S1 | Fabricated city and service areas (Lahore) | ✅ **Fixed** — replaced with client-confirmed Islamabad / Bahria Town / DHA Islamabad |
| **D-03** | S1 | Fabricated localities in listings and area guides | ✅ **Fixed** — real areas; area copy `[CONTENT REQUIRED]` |
| **D-04** | S2 | Fabricated email and canonical domain | ✅ **Fixed** — `[CONTENT REQUIRED]` |
| **D-05** | S2 | Project not under version control | ⏸ `.gitignore` written; `git init` awaiting go-ahead |
| **D-06** | S3 | Foreign `WPS Cloud Files/` cache directory | ⏸ Gitignored; deletion awaiting client decision |
| **D-07** | S1 | Three fabricated 5-star testimonials in `index.html` | ✅ **Fixed** — removed from source, section gated |
| **D-08** | S1 | Fabricated FAQ answers (hours, free valuation, financing partners) in `index.html` and `js/ai-concierge.js` | ✅ **Fixed** — unconfirmed answers removed; assistant hands off instead of guessing |
| **D-09** | S2 | Assistant fallback said "I've noted it", implying comprehension | ✅ **Fixed** — states plainly it has no answer |
| **D-10** | S2 | `[X]+ Years` / client-count claims and invented agent bio | ✅ **Fixed** — `[CONTENT REQUIRED]` |
| **D-11** | S2 | WhatsApp CTAs would render dead links once the number became a placeholder | ✅ **Fixed** — CTAs fall back to the confirmed phone lines |
| **D-12** | S3 | `formatPKR` rendered inconsistent decimals ("4.50 Crore" vs "3.5 Lakh") | ✅ **Fixed** |
| **D-13** | S2 | Navigation and footer link to routes that do not exist yet | ⬜ Open — every such link carries `data-route-pending`. Resolved by the Phase 02/05 route scaffold, which is blocked on the architecture decision |
| **D-14** | S1 | "Free valuation" / "Request Free Valuation" in the CTA band and contact form. The price of a valuation was never supplied — "free" is an invented commercial term | ✅ **Fixed** — "Request a Valuation"; fee and turnaround marked `[CONTENT REQUIRED]` |
| **D-15** | S1 | Copy *named* WhatsApp as an available channel in four places (drawer CTA, final CTA, form button, form note, value card, assistant disclaimer). Hiding the link left the false claim in the text | ✅ **Fixed** — all WhatsApp-naming copy rewritten to the confirmed phone lines; see `docs/COPY_DECK.md` §4 |
| **D-16** | S2 | Unverified service claims on the homepage: "vetted, verified listings", "data-backed negotiation", "transfer handled end to end", a four-step process the client never described | ✅ **Fixed** — replaced with four claims and three process steps that trace to client copy |
| **D-17** | S2 | `.nav-toggle` was `display:none` with **no media query ever showing it**, and `.nav-links` had no collapse rule — the mobile menu was unreachable at every width | ✅ **Fixed** — responsive nav added, collapsing at 1100px |
| **D-18** | S2 | `main.js` wrote boolean config flags into the DOM as text, so the sample-data badge rendered the literal string "true" | ✅ **Fixed** — booleans now drive visibility via `data-config-flag` |
| **D-19** | S2 | An anchor carrying both `data-config` and `data-config-href` never had its text set, so footer phone links rendered as the placeholder word "Phone" | ✅ **Fixed** — the text pass and the href pass no longer collide |
| **D-20** | S3 | Hard-coded colour values (`#17130a`, `#e39c5a`, `#b56a5a`, `#14181f`) in component CSS, against the design-system governance rule | ✅ **Fixed** — tokenised as `--color-on-gold`, `--color-warning`, `--color-error` |
| **D-22** | S2 | "View Details" on every property card, and the homepage search form, linked to `property.html?id=...` / `listings.html?...` — filenames that don't exist and aren't part of the IA (`js/listings.js`, apparent leftover from before the route naming was decided). Real 404s, not caught by the gate's `.html` check because it only scanned `index.html` and didn't match a query string after `.html` | ✅ **Fixed** — both now point to the real IA routes (`/properties/[slug]`, `/properties`) with `data-route-pending`, same treatment as every other unbuilt route (D-13). Gate strengthened to scan JS output too and match `.html` regardless of trailing query string |
| **D-23** | S2 | On mobile viewports, the fixed concierge launcher (bottom-left, always visible) sat directly on top of the "Sell or Rent Out Your Property" hero CTA on initial page load — confirmed geometrically (launcher y:712–780 vs. button y:726–783 at 375×812) and visually. Discovered during in-browser verification, not in any spec | ✅ **Fixed** — `css/style.css` (launcher) and `js/main.js` (`updateConciergeLauncher`): on ≤640px viewports the launcher now reveals only after scrolling past the hero (same scroll-reveal pattern already used for `.back-to-top`). No loss of assistant access — the header's `.nav-assistant` icon stays visible throughout. Desktop untouched, confirmed unaffected at 1024px |
| **D-24** | S1 | `js/main.js` (reveal-on-scroll `IntersectionObserver`) loaded and ran *before* `js/listings.js` had created the property cards, because of `<script>` tag order in `index.html`. `document.querySelectorAll("[data-reveal]")` ran too early, so the cards were never registered with the observer — every property card was permanently stuck at `opacity: 0`, invisible to every real visitor, forever. Found while verifying the new demo images actually render (a background/foreground tab quirk in the test browser led to the discovery, but the bug itself is real and reproducible with genuine scroll input) | ✅ **Fixed** — reordered the script tags so `listings.js` (and its synchronous `render()` call) runs before `main.js`. Confirmed with real wheel-scroll input: cards now correctly receive `.in-view` and fade to `opacity: 1` |
| **D-21** | S2 | "Bahria Town" was ambiguous (the name exists in several Pakistani cities) and `city: "Islamabad"` was a derivation the client never stated directly. The client's own YouTube channel confirmed "Bahria Town Rawalpindi" specifically | ✅ **Fixed** — coverage updated to "Bahria Town Rawalpindi" + "DHA Islamabad" everywhere; `city` reverted to `[CONTENT REQUIRED]` until the client states one directly. See `docs/COPY_DECK.md` §1.2 |
| **D-25** | S2 | Header and footer logo (`.brand`) used `href="/"`. There is no dev server or framework in this project (no `package.json`, no Vite/Next/Express config; confirmed no server process was listening on any port at the time of report), so the client was opening `index.html` directly from disk (`file:///C:/Users/hp/REALTOR SHAMRAIZ/index.html`) and calling that "localhost". Under `file://`, a root-relative href of `/` resolves per the URL spec to the *drive root that hosts the current file* (`file:///C:/`), not to any site root — and because `C:/` is a real, browsable directory, the browser rendered its native "Index of C:/" folder listing. This is a `file://`-navigation quirk, not a server misconfiguration — no code in this project serves or exposes the filesystem over HTTP | ✅ **Fixed** — both `.brand` links in `index.html` (header, footer) now use `href="#home"` (the hero section's existing `id="home"`) instead of `href="/"`. Resolves correctly under direct `file://` access, under any static HTTP server (localhost or production) — it never leaves the current document, so there is no root-path resolution to get wrong. Also keeps the gate's "no leftover `.html` page links" rule (added for D-22) honest: `href="index.html"` was tried first and technically fixes the bug too, but it matches that rule's pattern and reintroduces the exact filename-link smell D-22 removed, so it was rejected in favour of the anchor. When the real route scaffold is eventually built, switch back to `href="/"` (or the framework's home-route helper) at the same time all the other `data-route-pending` links are wired up |
| **D-26** | S2 | Found during Admin Panel QA (below): `properties-page.js` and `media-page.js` re-render their list/grid asynchronously (per-row cover-image lookups hit IndexedDB) but re-ran on every filter/tab-switch event with no guard — firing several filter changes in quick succession (or switching Media Library tabs quickly) could let an older, slower render finish *after* a newer one and silently overwrite it, leaving the visible table/grid out of sync with the filter controls and the "N of M" count | ✅ **Fixed** — both render functions now take a monotonically increasing token per call and discard their own output if a newer render started before they finished (same pattern applied to `property-editor-page.js`'s image/video re-renders as a precaution). Confirmed by firing 5 rapid filter changes back-to-back: table and count now always agree |
| **D-27** | — | Decision, not a defect: client supplied real social links (Instagram, Facebook, TikTok, YouTube), email, office address, and business hours ("Always Open") on 2026-09-11 (`docs/CLIENT_COPY.md` Submission 2), and asked that these come from the admin panel "dynamically" rather than being hardcoded. There is still no backend (D-26's constraint stands) | ✅ **Applied** — `js/config.js` updated with the real values; TikTok/YouTube icons added to the footer (Instagram/Facebook/LinkedIn icons already existed — LinkedIn stays hidden, unsupplied); a new `businessHours` object (`{status: "always"\|"custom"\|"closed"}`) replaces the unused flat `openingHours` string, resolved via `formatBusinessHours()` so "always" can never fall through to a fabricated closing time — new "Hours" row added to the contact-info card. **The dynamic-from-admin-panel part:** `js/main.js` now reads `localStorage["rs-admin:settings"]` before populating the page and lets any admin-saved `business` fields (name, phone, phone2, email, address, social, businessHours, currency) override the `js/config.js` defaults; `admin/settings.html`'s Business Information tab gained Social Media and Business Hours sub-sections wired to the same store. This makes "edit in the admin panel → see it on the site" genuinely true, but **only within the one browser that made the edit** — there is no server, so a different device/browser still sees the `js/config.js` defaults. The Settings tab's own disclaimer text was rewritten to say this precisely, replacing the previous (now inaccurate for these fields) "editing here does not publish to the site" wording. Verified: admin edit → public site (same browser) reflects it for an overridden social URL and for all three `businessHours` states (Always Open / custom text / Currently Closed); clearing `localStorage` falls back cleanly to the `js/config.js` defaults |

## Backend added 2026-09-13 (D-28)

| ID | Sev | Description | Status |
|---|---|---|---|
| **D-28** | — | Decision, not a defect: the client approved building a real backend, superseding the "no backend, no database" scope D-26 and D-27 operated under. A Node.js/TypeScript REST API (Express + Prisma + PostgreSQL) now lives in `server/`, running as its own process on its own port. **The repo-root `server.js` static dev server was not touched.** | ✅ **Built and verified** |

**What changed, and what it fixes:**

- **Real authentication.** `admin/js/admin-auth.js`'s client-side hash check —
  which its own header comment described as bypassable from DevTools — is
  replaced by server-side verification: bcrypt-hashed passwords in PostgreSQL,
  a 15-minute JWT access cookie plus a rotating 14-day refresh cookie, both
  `httpOnly` so JavaScript cannot read them, and an `X-Admin-Request` header
  required on every state-changing request as CSRF defense.
- **Cross-device data.** `js/admin-bridge.js` read the admin's own
  localStorage/IndexedDB, so a property was only ever visible in the browser
  that created it (the limitation D-27 documented). It now reads
  `GET /api/v1/public/properties`, and business settings come from
  `GET /api/v1/public/settings` — an edit on one device is live for every
  visitor. Uploaded photos are served from the API instead of blob URLs.
- **Real lead capture.** `js/forms.js` posted nothing anywhere; enquiries
  existed only if the visitor completed the WhatsApp handoff. It now also
  POSTs to `/api/v1/public/leads` (honeypot + submission-timing anti-spam,
  rate-limited) so the enquiry survives a closed tab and appears in the admin
  Leads list. The WhatsApp handoff is unchanged.
- **The seam held.** `AdminStore` / `AdminDB` / `AdminAuth` kept their function
  names and shapes — exactly what their header comments said they existed for
  — so the six admin page scripts needed `await`s and async bootstraps, not
  rewrites. `admin/js/admin-ui.js` was not touched at all.
- **Vocabulary translation** lives in `admin-store.js`: the UI still speaks
  `draft`/`follow-up`/`sale`, the API speaks `DRAFT`/`FOLLOW_UP`/`SALE`.
- **`Lead.status`** deliberately keeps the built 5-value enum
  (`new · contacted · follow-up · interested · closed`) rather than
  `docs/DATA_MODEL.md` §10's aspirational 6-state CRM pipeline, which no page
  renders — least disruption to working UI. The `Lead` table gained nullable
  `intent/budget/timeline/locality/consent/source` columns so real public
  submissions and admin-logged calls share one table.

**Defect found and fixed during verification:**

| ID | Sev | Description | Status |
|---|---|---|---|
| **D-29** | S1 | **D-24 reintroduced through a new path.** Property cards are now rendered *after* the API responds, but `js/main.js`'s reveal-on-scroll `IntersectionObserver` only ever observed the elements present at page load — so every card stayed at `opacity: 0` permanently, invisible to every visitor. Same symptom as D-24, different cause (async data instead of script order). Caught in-browser, not by any test | ✅ **Fixed** — observer registration extracted into `observeReveals()`, which skips already-registered elements and re-runs on `rs:listings-updated`. Verified: cards now reach `opacity: 1` and `.in-view` when scrolled to |
| **D-30** | S2 | The honeypot field was rejected by the Zod schema, so a tripped honeypot returned `400 {"error":"Validation failed","fieldErrors":{"company":["Spam check failed"]}}` — telling a bot exactly which field caught it, and contradicting the documented "silently discard" design | ✅ **Fixed** — the field validates freely and the spam verdict is applied in the service, which returns an ordinary `201`. Verified: honeypot and too-fast submissions both return 201 and store nothing |

**Verified end-to-end** (real browser + real PostgreSQL, not mocks): log in →
create a property → upload a real photo → publish → the property appears on the
public `/properties` page with its photo on a client that never logged in →
submit the public contact form → the lead appears in the admin Leads list →
change its status → delete the media and see the reference warning → log out and
be redirected from a protected page. Automated: 49 tests (unit + integration +
e2e smoke) green against a real database.

**Still open / not built:** production hosting for the API and database is
`[CONTENT REQUIRED]`; media is on local disk (the upload/serve interface is
isolated in one module so S3/R2 is a contained change); the concierge remains
rule-based per `docs/AI_AGENT_SPEC.md` — no LLM backend was added.

## Admin Panel added 2026-09-10

Client-side-only `/admin` area added per explicit request, alongside the existing public site — no existing page, route, asset, or design was changed to build it (only `.brand` hrefs already fixed under D-25 were touched in `index.html`; everything else here is new, under `admin/`).

**Why client-side-only:** `docs/PROJECT_BRIEF.md`'s original scope explicitly excluded "backend server, database, or admin dashboard" for this phase, and `docs/TECH_ARCHITECTURE.md`/`docs/DATA_MODEL.md` establish "no backend, no database, no auth" as the public site's architecture. The admin panel doesn't change that: it's a separate, modular, browser-only layer (`admin/js/admin-store.js` for property/lead/settings data, `admin/js/admin-db.js` for an IndexedDB-backed media store, `admin/js/admin-auth.js` for the login gate) built so every read/write goes through one seam that can be swapped for real `fetch()` calls to a backend later, without touching any page.

**What it does NOT do:**
- It does not write to `js/listings-data.js`, `js/config.js`, or any other public-site file — there is no build/deploy step for a static site to write into, so admin edits live only in this browser's `localStorage`/IndexedDB until a real backend exists. The Dashboard and Settings pages say this explicitly. (Exception: Settings → Business Information *is* read back by the public site at runtime in the same browser — see D-27. That is same-browser localStorage, not a write to any file, and still not a real cross-device database.)
- It does not capture the public site's own lead/contact forms into this browser's storage — `docs/SECURITY_PLAN.md` §3.2 forbids writing real visitor form data to `localStorage`/IndexedDB, and that rule stands. The Leads section is for the admin's own manually-logged inquiries (phone/WhatsApp/email) until a backend can receive real submissions.
- Its login is **not real authentication** — a password hash checked by JavaScript in the browser, easily bypassed via DevTools. It keeps the panel out of casual reach on a shared computer, nothing more. This is disclosed on the login screen and in Settings → Security, and the panel must not be deployed to a public host until a real backend performs login server-side.

**Hosting note for whenever this ships:** `/admin` (no trailing slash) must 301-redirect to `/admin/` before serving its content — otherwise the browser resolves the page's relative `css/`/`js/` paths against the wrong directory and every asset 404s. Every mainstream static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, Apache, nginx) does this by default; it only needs checking if this project ends up on something unusual (e.g. bare S3 without CloudFront).

See `PHASE_00_AUDIT.md`, `docs/CLIENT_COPY.md` and `docs/COPY_DECK.md` for detail.
