# DESIGN SYSTEM — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07
**Source of truth:** CSS custom properties in `css/style.css` (`:root`)
**Covers:** master requirements §10 (design direction) and §11 (system definition)

This system was designed independently for this project against the brand
qualities in `PROJECT_BRIEF.md` §4. It shares nothing with any other project.

---

## 1. Design direction

**MODERN LUXURY REAL ESTATE.** Deep, quiet, expensive.

A dark editorial base lets property photography carry the visual weight, while a
single restrained gold accent signals premium without tipping into ornament.

### 1.1 The rule that governs everything

> The site must feel expensive because of **typography, spacing, photography,
> layout, detail and consistency** — never because of effects.

Every proposed addition is tested against that sentence. If the answer to
*"what makes this feel premium?"* is a gradient, a glow, a blur or an animation,
the proposal is rejected and the budget goes back into type and space instead.

### 1.2 Use / Avoid

| Use | Avoid |
|---|---|
| Sophisticated typography — one serif for expression, one grotesk for work | Excessive gradients |
| Premium property and architectural photography | Excessive glassmorphism |
| Editorial layouts with a clear reading order | Cartoon-like elements and illustration |
| Generous whitespace — space is the luxury signal | Excessively rounded cards |
| A strong, consistent grid | Neon or high-saturation colour |
| Refined cards with hairline borders | Random or decorative animation |
| Restrained shadows, used only to establish depth | Clutter and competing focal points |
| Subtle borders instead of heavy fills | More than one accent colour |
| High-quality, consistent iconography | Mixed icon styles |
| Elegant, purposeful motion | Motion for its own sake |

### 1.3 Where the budget goes

| Element | Investment |
|---|---|
| Type scale and measure | High — the largest single contributor |
| Section rhythm and whitespace | High |
| Photography treatment and aspect discipline | High |
| Colour | Low — one accent, one base, semantic states only |
| Effects | Near zero |

---

## 2. Colour

### 2.1 Tokens

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#0b0e13` | Page base — near-black charcoal/navy |
| `--color-bg-alt` | `#10151c` | Alternating section band |
| `--color-surface` | `#161c25` | Card / panel |
| `--color-surface-raised` | `#1c232e` | Elevated card, hover, modal |
| `--color-border` | `rgba(201,162,75,.18)` | Gold-tinted hairline |
| `--color-border-soft` | `rgba(255,255,255,.08)` | Neutral hairline |
| `--color-ivory` | `#f3efe6` | Primary text |
| `--color-ivory-dim` | `#c7c2b8` | Secondary text |
| `--color-muted` | `#8b93a1` | Tertiary / meta text |
| `--color-gold` | `#c9a24b` | Accent, primary CTA |
| `--color-gold-bright` | `#e3c375` | Accent hover / highlight |
| `--color-gold-dim` | `#8a7539` | Accent pressed / disabled |
| `--color-on-gold` | `#17130a` | Text on any gold fill |
| `--color-success` | `#6fae7a` | Success state |
| `--color-warning` | `#e39c5a` | Warning / sample-data state |
| `--color-error` | `#e07c68` | Error state |

### 2.2 Verified contrast (against `--color-bg` `#0b0e13`)

Ratios computed from the WCAG 2.1 relative-luminance formula.

| Pair | Ratio | WCAG 2.1 |
|---|---|---|
| `--color-ivory` on bg | **17.7:1** | AAA |
| `--color-ivory-dim` on bg | **11.0:1** | AAA |
| `--color-gold` on bg | **8.1:1** | AAA |
| `--color-gold-bright` on bg | **11.3:1** | AAA |
| `--color-warning` on bg | **8.4:1** | AAA |
| `--color-success` on bg | **7.4:1** | AAA |
| `--color-error` on bg | **6.7:1** | AA (normal text) |
| `--color-muted` on bg | **6.3:1** | AA (normal text) |
| `--color-on-gold` on `--color-gold` (CTA, worst end of the fill) | **7.7:1** | AAA |

`--color-muted` is the floor of the system. It must not be used below 16px, and
must not be used for any text conveying essential information. Any new colour
must be contrast-verified and added to this table before use.

### 2.3 Rules

- **One accent only.** Gold is the sole accent. Additional hues are permitted
  only for semantic state and never decoratively.
- Colour is never the sole carrier of meaning — every state pairs colour with an
  icon and a text label.
- No hard-coded colour values in component CSS. Every colour is a token.

---

## 3. Typography

| Token | Stack | Use |
|---|---|---|
| `--font-display` | `"Playfair Display", Georgia, "Times New Roman", serif` | H1–H4, prices, pull quotes |
| `--font-body` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Body, UI, labels, data |

### 3.1 Scale

Fluid and clamped, so it never breaks between breakpoints.

| Level | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display (hero H1) | `clamp(2.6rem, 5.4vw, 4.6rem)` | 600 | 1.05 | −0.02em |
| H2 | `clamp(1.9rem, 3vw, 2.6rem)` | 600 | 1.15 | −0.01em |
| H3 | `1.05–1.6rem` | 600 | 1.25 | 0 |
| Lede | `1.15rem` | 400 | 1.6 | 0 |
| Body L | `1.05rem` | 400 | 1.65 | 0 |
| Body | `1rem` | 400 | 1.6 | 0 |
| Small / meta | `0.875rem` | 400 | 1.5 | 0 |
| Nav link | `0.875rem` | 500 | 1.4 | 0.01em |
| Eyebrow / label | `0.72–0.78rem` | 600 | 1.4 | 0.12–0.22em, uppercase |

### 3.2 Rules

- Body text never below **16px**. Labels and meta never below **14px**.
- Measure capped at **68ch** for prose; hero lede capped at **560px**.
- Both faces load with `font-display: swap` behind a preconnect.
- Serif is for expression only — **never** for form inputs, data tables, dense UI
  or anything the user must scan quickly.
- The italic serif is reserved for the single emphasised phrase in a headline. One
  per page.

---

## 4. Spacing

| Token | Value |
|---|---|
| `--space-1` | 0.4rem |
| `--space-2` | 0.8rem |
| `--space-3` | 1.2rem |
| `--space-4` | 2rem |
| `--space-5` | 3.2rem |
| `--space-6` | 5.2rem |
| `--space-7` | 8rem |

Section rhythm: `--space-6` mobile → `--space-7` desktop. Arbitrary pixel values
outside this scale are not permitted. Whitespace is the primary luxury signal —
when a layout feels cheap, the first remedy is more space, not more decoration.

---

## 5. Grid, containers, breakpoints

### 5.1 Containers

| Token | Value | Notes |
|---|---|---|
| `--container-max` | 1240px | Standard content width |
| `--nav-height` | 84px | 72px once scrolled |
| Container gutter | `--space-4` (→ `--space-3` under 640px) | |
| Prose measure | 68ch | Long-form text blocks |
| Hero lede | 560px | |
| Search widget | 920px | |

### 5.2 Grid

12-column mental model, expressed as CSS Grid `repeat(n, minmax(0, 1fr))`.
`minmax(0, 1fr)` rather than `1fr` — the latter refuses to shrink below content
width and is the usual cause of horizontal overflow.

| Content | lg | md | sm |
|---|---|---|---|
| Property cards | 3 | 2 | 1 |
| Value cards | 4 | 2 | 1 |
| Process steps | 3 | 2 | 1 |
| Area cards | 4 | 2 | 1 |
| Hero proof row | 4 | 2 | 1 |
| Footer | 4 | 2 | 1 |
| Split (about) | 2 | 1 | 1 |
| Contact | 1.1fr / 0.9fr | 1 | 1 |

### 5.3 Breakpoints

| Name | Width | Notes |
|---|---|---|
| xs | 320–479 | Smallest supported; single column; brand name hides below 420 |
| sm | 480–767 | Single column, larger type |
| md | 768–1023 | 2-column grids |
| lg | 1024–1099 | 2–3 column grids, nav still collapsed |
| nav | **1100** | Primary links move into the drawer at and below this width |
| xl | 1440+ | Container capped, gutters grow |

Mobile-first. No horizontal overflow at any width. Wide content (tables, wide
cards) scrolls inside its own container, never the page body.

---

## 6. Radii, elevation, motion

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Inputs, chips, badges |
| `--radius-md` | 12px | Cards, panels |
| `--radius-lg` | 20px | Modals, hero panels, images |
| pill | 999px | Buttons, filter chips, badges |
| `--shadow-soft` | `0 10px 30px -12px rgba(0,0,0,.45)` | Resting card |
| `--shadow-elev` | `0 20px 60px -20px rgba(0,0,0,.6)` | Hover, modal, drawer |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | All transitions |

Radii are deliberately modest. §10 lists "excessively rounded cards" as an
anti-goal — 12px reads as considered, 24px reads as consumer-app.

### 6.1 Animation rules

| Duration | Use |
|---|---|
| 150ms | Micro — colour, border, icon nudge |
| 200–250ms | Standard — hover lift, chip state, nav underline |
| 300–350ms | Overlay — drawer, modal, assistant panel |
| 400–700ms | Entrance — scroll reveal (once, never repeated) |

- Animate **`transform` and `opacity` only.** Never animate layout properties.
- Nothing loops except a genuine progress indicator (skeleton sheen, button
  spinner, typing dots).
- No autoplaying carousels. No parallax on text. No scroll-jacking.
- Every entrance animation runs once and then releases its observer.
- `prefers-reduced-motion: reduce` disables reveals, the skeleton sheen and
  smooth scrolling. This is a global block, not per-component opt-in.

### 6.2 Focus states

A single global rule covers every interactive element:

```css
a:focus-visible, button:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--color-gold-bright);
  outline-offset: 3px;
  border-radius: 4px;
}
```

- Focus is **never** removed, only restyled. `outline: none` without a
  replacement is a launch blocker.
- `:focus-visible` (not `:focus`) so mouse users do not see rings, keyboard users
  always do.
- `--color-gold-bright` on `--color-bg` is 11.3:1 — far above the 3:1 minimum
  for non-text contrast.
- Minimum target size **44×44px** for every control, on every breakpoint.

---

## 7. Components

A component is not "done" until every listed state is implemented, keyboard
reachable, and announced correctly to assistive technology.

| Component | States required | Built |
|---|---|---|
| Button (primary/secondary/ghost/link) | default · hover · focus-visible · active · disabled · loading | ✅ |
| Nav bar | top · scrolled · collapsed · drawer-open | ✅ |
| Drawer | closed · open · focus-trapped · escape-to-close | ⚠️ focus trap pending |
| Property card | default · hover · focus-within · saved · sample-data badge | ✅ |
| Filter chip | default · hover · focus · active · disabled | ✅ |
| Form field | default · focus · filled · error · success · disabled | ✅ |
| Form (whole) | idle · validating · submitting · success · error | ⚠️ submitting state pending |
| Select | default · focus · open · disabled | ✅ |
| Modal / lightbox | closed · open · focus-trapped | ⚠️ focus trap pending |
| Accordion (FAQ) | collapsed · expanded · focus | ✅ (native `<details>`) |
| Toast | enter · visible · exit | ✅ |
| Alert (inline) | info · success · warning · error | ✅ |
| Assistant panel | closed · open · typing · answered · no-match · handoff | ✅ |
| Badge | accent · status · sample-data · content-required | ✅ |
| Skeleton | media · line | ✅ |
| Empty state | no results · error | ✅ |
| Pagination | default · current · disabled | ⬜ not built |

### 7.1 Button hierarchy

| Level | Class | Appearance | Rule |
|---|---|---|---|
| Primary | `.btn-primary` | Gold fill, dark text | **One per viewport section.** The single most valuable action |
| Secondary | `.btn-outline` | Ivory outline | The alternative path |
| Ghost | `.btn-ghost` | Low-contrast fill | Utility, in-panel |
| Link | `.btn-link` | Text + arrow, underline on hover | Tertiary. Used for the assistant entry point so it cannot out-shout a human CTA |

`.is-loading` swaps in a spinner and disables pointer events; `:disabled` and
`[aria-disabled="true"]` both render the disabled treatment.

### 7.2 Navigation (§09)

**Desktop (≥1101px)** — one row, no dropdowns, no mega menu:

```
[RS] Realtor Shamraiz | Properties Buy Sell Rent Invest Insights About Contact | ⌾ AI Assistant | ▸ Book a Site Visit
```

**Mobile (≤1100px)** — per §09's mobile spec:

```
[RS] Realtor Shamraiz | ⌾ | ▸ Call | ☰
```

| Requirement | How it is met |
|---|---|
| Fast | Static markup, no JS to render the nav. Scroll state is one `classList.toggle` on a passive listener |
| Elegant | Transparent over the hero, condensing to 84→72px with a blurred surface once scrolled |
| Accessible | `<nav aria-label>`, `aria-current="page"` for the active route, `aria-expanded`/`aria-controls` on the toggle, Escape closes the drawer, 44px targets, visible focus ring |
| Sticky where appropriate | Fixed on every page. It carries the only always-available call CTA, so it is never allowed to scroll away |
| No mega menus | Eight flat destinations. Sub-pages are reached from their parent page, not from a hover panel |

**Collapse point is 1100px, not a device width.** Eight links plus a logo plus
two actions stop fitting there; that measurement is the breakpoint's only
justification.

**Assistant entry point** is an `<a href="/ai-assistant">` intercepted by JS to
open the panel in place. Without JS it navigates to the real route — the
progressive-enhancement contract in `TECH_ARCHITECTURE.md`. It carries a
screen-reader-only *"— automated, not a live person"* so the disclosure is not
purely visual.

### 7.3 Property card contract

Every card shows, in this order: image (fixed aspect, `loading="lazy"`, explicit
`width`/`height`), transaction-type badge, price, title, locality, key facts
(beds · baths · area), and — if `demo: true` — a visible **"Sample listing"**
badge. The whole card is a single link target; nested interactive controls (save,
enquire) sit outside the link, not inside it.

Price renders `"Price on application"` when `price` is `null`. Sample listings
currently all carry `price: null` because master rule 04 forbids inventing prices.

### 7.4 Form fields

- Every field has a persistent `<label>`. Placeholders are never labels.
- Required fields are marked in the label, not by colour alone.
- Errors: `.form-field.is-error` + a message in `.form-error[role="alert"]`.
- The submit path **never silently fails**. If the messaging channel is not
  configured, the form states the working alternative and shows both phone
  numbers rather than dropping the lead.

### 7.5 Badges

| Class | Use |
|---|---|
| `.badge` | Neutral accent badge — property type, transaction type |
| `.badge-status` | Uppercase status — For Sale, To Let, Under Offer |
| `.badge-demo` | **Sample listing.** Warning-coloured, deliberately the loudest badge in the system — placeholder inventory must be impossible to mistake for real inventory |
| `.badge-required` | Dashed error-coloured marker for unresolved `[CONTENT REQUIRED]` content |

### 7.6 Feedback: toast vs. alert

| | Toast | Alert |
|---|---|---|
| Lifetime | Transient (~3.2s) | Persistent |
| Position | Fixed, top-right stack | Inline, next to what it describes |
| Use | Confirmation of a completed action | State the user must read and act on |
| A11y | `role="status"` in an `aria-live="polite"` stack | `role="alert"` when it appears after an action |

### 7.7 Loading and empty states

- **Skeletons** are sized to the real content they replace, so nothing shifts
  when data arrives (CLS budget in `PERFORMANCE_PLAN.md`).
- **Empty state** = icon + heading + one line of explanation + a recovery action.
  Never a bare "No results".
- **Error state** reuses the empty-state layout with `.is-error` and always
  offers the phone numbers as the fallback path.

### 7.8 Assistant panel

Governed by `AI_AGENT_SPEC.md`. Design-relevant constraints:

- The header status reads **"Automated · Not a live person"**. It is not a
  decorative "online" dot.
- The disclaimer line is part of the component and cannot be removed by a
  content change.
- The typing indicator must not imply thinking or comprehension — it covers a
  scripted delay only.
- Forbidden in any label, tooltip or microcopy: *AI-powered, intelligent,
  understands, trained on, learns, smart assistant.*
- The `NO_MATCH` state is a first-class designed state, not an afterthought: it
  says plainly that it has no answer and hands off to a human.

---

## 8. Imagery

- Property photography is the hero of the design; the UI recedes around it.
- Fixed aspect ratios per context: **4:3** cards, **4:5** portrait/split,
  **3:4** area cards, full-bleed hero.
- Every image carries explicit `width`/`height` (or `aspect-ratio`) to reserve
  space before load.
- All images require meaningful `alt`; decorative images get `alt=""` and
  `aria-hidden="true"` on wrapping icons.
- Hero image gets `fetchpriority="high"`; everything below the fold is
  `loading="lazy"`.
- Placeholder SVGs in `assets/images/` are development scaffolding, are labelled
  as such, and are launch blockers.

---

## 9. Governance

1. New token → added to `:root` **and** to this document in the same change.
2. No hard-coded colour, spacing, radius or duration in component CSS.
3. No inline styles except genuinely dynamic values (e.g. a computed width).
4. Any contrast-affecting change re-runs §2.2 and records the new ratio.
5. A component added without its full state list from §7 is not shippable.
6. Anything that fails the §1.1 test — premium because of effects rather than
   craft — is rejected regardless of how good it looks in isolation.
