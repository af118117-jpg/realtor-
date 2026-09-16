# Frontend Audit — 2026-09-14

Pre-implementation audit for the premium frontend refresh. Nothing was changed while
this was written; the "Fixed in this pass" column records what the refresh that
followed addressed.

## 1. Stack

| Area | Finding |
|---|---|
| Framework | None. Static multi-page HTML + vanilla ES2017 JS, no build step. |
| Package manager | None for the frontend (`server/` backend has its own npm project). |
| Dev server | `node server.js 5273` (zero-dependency static server). |
| Component system | String-template "components" in JS: `js/partials.js` (header, drawer, footer, widgets — one copy for every page), `js/listings.js` `cardTemplate()` (the only property card, shared by home, /buy, /rent, /properties, similar-properties). |
| Styling | One hand-written stylesheet, `css/style.css` (~1,200 lines), CSS custom-property tokens, dark default + `html[data-theme="light"]` override. Also loaded by every `/admin` page. |
| Animation | CSS transitions/keyframes only; `IntersectionObserver` scroll reveal in `js/main.js`. No library. |
| Icons | Inline SVG (Feather-style strokes), duplicated per file. |
| Typography | Google Fonts: Playfair Display (500/600/700) display + Inter (400–700) body, `display=swap`, preconnected. |
| Breakpoints | Ad hoc: 1100 / 980 / 900 / 720 / 640 / 560 / 480 / 420 px (35 media queries). |
| Pages | `/`, `/properties`, `/properties/detail?id=`, `/buy`, `/sell`, `/rent`, `/invest`, `/market-insights`, `/about`, `/contact`, `/ai-assistant`. |
| Data | `js/listings-data.js` (6 sample listings, all `demo:true`, `price:null`), replaced at runtime by `GET /api/v1/public/properties` via `js/admin-bridge.js` when the API is up. |

## 2. Strengths to preserve

- Rigorous content-truthfulness rules (no invented prices, reviews, bios) and loud sample-data badges.
- Contrast-measured token system for both themes, including photo scrims.
- Single source for nav/footer and for the property card — no card duplication.
- Image-failure fallback, skip link, `aria-current` nav, reduced-motion handling, lazy images, desktop-only hero video.

## 3. Issues found

| # | Area | Issue | Severity | Fixed in this pass |
|---|---|---|---|---|
| 1 | Forms / mobile | Inputs render at 15.2px — iOS Safari zooms the page on focus. | High | ✅ |
| 2 | Forms | A **success** message ("Your enquiry has been sent") is written into the red `.form-error` alert, and is shown even when the API call failed. | High | ✅ |
| 3 | Forms / copy | Form notes say "Nothing you type here is stored on this site", but `js/forms.js` now records every lead on the backend. | High | ✅ |
| 4 | Forms | Fields turn red while the visitor is still typing (`:invalid:not(:placeholder-shown)`); no per-field messages, no `aria-invalid`, no loading state on submit, no autocomplete hints. | Medium | ✅ |
| 5 | A11y | Closed mobile drawer, AI panel and mobile filter drawer are only `opacity:0` — their links/inputs stay in the Tab order. No focus management or trap in the drawer. | High | ✅ |
| 6 | A11y | Hero search tabs declare `role="tablist"` without `tab`/`aria-selected` semantics. | Medium | ✅ |
| 7 | A11y | Tap targets under 44px: favourite button (38), footer social (38), chat close (32). | Medium | ✅ |
| 8 | Search | Hero "Property type" and "Budget" selects have no `name` — their values are silently discarded on submit. | Medium | ✅ |
| 9 | Mobile | Home hero is ~1,750px tall at 375px (2.2 screens) before any listing appears. | Medium | ✅ (reduced) |
| 10 | Property detail | A listing with one photo renders as a single square thumbnail at 25% width. Gallery has no "all photos" affordance or mobile swipe. | High | ✅ |
| 11 | Property detail | No sticky contact bar on mobile; the agent card falls below the whole page. | Medium | ✅ |
| 12 | Cards | Only the two small buttons are clickable; the image/title are not links. No featured badge, no sale/rent label, no photo count. | Medium | ✅ |
| 13 | Motion | `[data-reveal]` transition overrides the card's own hover transition (hover lift runs at 0.7s, shadow doesn't animate). Content with `data-reveal` is invisible if JS fails. | Medium | ✅ |
| 13b | Listings | *(found during verification)* On `/properties`, every filter change, sort or reset re-rendered the cards without registering them with the reveal observer — the results went **blank** (opacity 0). Present in the committed code. | High | ✅ |
| 14 | Perf | `backdrop-filter` blur on every card tag and favourite button (costly while scrolling on mobile); several `transition: all`. | Low | ✅ |
| 15 | Design | Pill buttons + gradient fills + large lift/glow hover read as template-like; header brand is a bare circle monogram. | Low | ✅ |
| 16 | Design | Native `<select>` chevrons and date pickers ignore the dark theme (`color-scheme` unset). | Low | ✅ |
| 17 | SEO | `og:image` URLs are relative; no canonical (blocked on live domain — documented); empty `data:,` favicon; footer uses `h4` with no preceding `h2/h3`. | Low | ❌ out of scope (needs domain/brand assets) |
| 18 | Repo | `detail/index.html` (untracked) is a byte-identical copy of `properties/detail/index.html` and nothing links to it. | Low | ❌ left for owner decision |
| 19 | Perf | `assets/video/about-video.mp4` is 19 MB and `property-tour.mp4` 6 MB; no transcoding tool available locally. | Low | ❌ needs ffmpeg |
| 20 | Content | About/agent portrait is a placeholder SVG and bio is `[CONTENT REQUIRED]`. | — | ❌ client content, not a design task |

## 4. Skills

- Already available and used as reference: `ui-ux-pro-max` (UI/UX guidelines).
- No `frontend-design` skill is installed. No additional skill was installed: the only
  install path offered is `npx skills add <github repo>`, i.e. downloading and running
  third-party code, and nothing in this pass needs it.
