# ACCESSIBILITY PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-08
**Target:** WCAG 2.2 Level AA — zero violations (raised from 2.1 on 2026-09-08,
master requirements §49: "where practical")

Property search is a high-stakes task. A person who cannot operate the filters
or submit an enquiry is a lost lead as surely as one who bounces.

---

## 1. Standards

- WCAG 2.2 AA across all routes
- Full keyboard operability
- Screen reader support: NVDA (Windows/Firefox), VoiceOver (macOS/Safari, iOS)
- `prefers-reduced-motion` respected
- 200% zoom and 320px viewport without loss of content or function

## 2. Structure and semantics

| Requirement | Detail |
|---|---|
| Landmarks | `header`, `nav`, `main`, `aside`, `footer` on every page |
| Single `<main>` | One per page, containing the primary content |
| Headings | Exactly one `<h1>`; no skipped levels; headings describe content, not style |
| Lists | Property grids, nav, and feature lists are real `<ul>`/`<li>` |
| Buttons vs. links | `<button>` performs an action; `<a href>` navigates. Never a `div` with a click handler |
| Forms | Every input has an associated `<label>`; related fields in `<fieldset>` with `<legend>` |
| Tables | Real `<th>` with `scope` where tabular data is used |
| Language | `<html lang>` set; `lang` on any inline foreign-language text |
| Page title | Unique and descriptive per route |

## 3. Keyboard

- Skip link to `#main` as the first focusable element, visible on focus
- Logical tab order matching visual order everywhere
- Visible focus indicator on every interactive element — minimum 3:1 against
  its background, never `outline: none` without an equal-or-better replacement
- No keyboard traps
- Modal/lightbox/concierge: focus trapped while open, `Esc` closes, focus
  returns to the trigger
- Mobile nav drawer: same focus management as a modal
- Dropdown menus operable with arrow keys, `Enter`, `Esc`
- Custom controls (filter chips, range sliders) expose correct roles, states, and
  keyboard behaviour — or are replaced with native elements

## 4. Colour and contrast

Verified values in `DESIGN_SYSTEM.md` §2.2. All text pairs meet AA; most meet AAA.

| Requirement | Threshold |
|---|---|
| Normal text | ≥ 4.5:1 |
| Large text (≥ 24px, or ≥ 19px bold) | ≥ 3:1 |
| UI components and graphical objects | ≥ 3:1 |
| Focus indicator | ≥ 3:1 against adjacent colours |

**Colour is never the sole carrier of meaning.** Status badges, form errors, and
availability states pair colour with text and/or an icon.

`--color-muted` (6.3:1) is the system floor and is barred from use below 16px.

## 5. Images and media

- Meaningful images: descriptive `alt` conveying purpose, not a filename
- Property images: `alt` describing the property and view — not "image1"
- Decorative images: `alt=""`
- Icons in buttons: accessible name via visible text or `aria-label`
- Icon-only buttons always carry an `aria-label`
- No text baked into images
- Map embed has an accessible name and a text address alternative

## 6. Forms — the critical path

| Requirement | Detail |
|---|---|
| Visible labels | Always. Placeholder-only labelling is forbidden |
| Required fields | Marked in text, not by colour or asterisk alone; `aria-required` |
| Error identification | Specific message, adjacent to the field, linked by `aria-describedby` |
| Error announcement | Error summary in an `aria-live="assertive"` region; focus moved to the first invalid field |
| Success announcement | `aria-live="polite"`, focus moved to the confirmation |
| Grouping | Radio/checkbox groups in `fieldset` + `legend` |
| Autocomplete | Correct `autocomplete` tokens on name, tel, email |
| Input types | `type="tel"`, `type="email"` for correct mobile keyboards |
| No timeout | No time limit on form completion |
| Consent checkbox | Real `<input type="checkbox">` with a real label, not a styled `div` |

## 7. Motion

- All animation wrapped in `@media (prefers-reduced-motion: no-preference)`, or
  globally disabled under `reduce`
- No auto-playing carousels
- No parallax on text
- No flashing above 3Hz
- Scroll-triggered reveals become instant under `reduce`

## 8. Touch and pointer

- Targets ≥ 44×44 CSS px
- ≥ 8px spacing between adjacent targets
- No hover-only functionality — everything reachable by tap and keyboard
- No gesture-only interaction without a button alternative

## 9. Component-specific requirements

| Component | Requirements |
|---|---|
| Property card | Whole card is one link with a full accessible name; nested controls sit outside the link |
| Filter panel | Grouped in `fieldset`s; result count in an `aria-live="polite"` region announcing "N properties found" |
| Gallery / lightbox | `role="dialog"`, `aria-modal`, focus trap, `Esc`, keyboard prev/next, image position announced |
| Accordion (FAQ) | `<button aria-expanded>` controlling a panel via `aria-controls`; content in the DOM |
| Concierge | See `AI_AGENT_SPEC.md` §8 |
| Mobile bottom bar | Real links, adequate targets, does not obscure focused content |
| Toast | `aria-live="polite"`; not the sole delivery of critical information |
| Pagination | `<nav aria-label="Pagination">`, current page marked `aria-current="page"` |

## 10. Testing protocol

**Automated** (necessary, not sufficient — catches roughly a third of issues)
- axe DevTools on every route
- Lighthouse accessibility ≥ 100
- HTML validation

**Manual — required before launch**
- [ ] Keyboard-only walkthrough of all five journeys in `USER_JOURNEYS.md`
- [ ] NVDA + Firefox: home, properties, property detail, one form
- [ ] VoiceOver + Safari (macOS and iOS): same set
- [ ] 200% browser zoom on every route
- [ ] 320px width, no horizontal scroll
- [ ] `prefers-reduced-motion: reduce` active
- [ ] Forced-colors / high-contrast mode
- [ ] Every form submitted with errors, then successfully, using a screen reader
- [ ] Focus visible on every interactive element, on every route

## 10a. 2.1 → 2.2 delta

Criteria new in 2.2, checked against what's already specified above:

| Criterion | Status |
|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | Already required — §9 sticky mobile bar mitigation (`scroll-padding-bottom`) covers this; applies equally to any future sticky header |
| 2.5.8 Target Size (Minimum, 24×24px) | Already exceeded — §8 sets ≥44×44px |
| 2.5.7 Dragging Movements | No drag-only interaction is planned anywhere on the site; if a slider/gallery-drag control is ever added, it needs a non-drag alternative (tap/buttons) before it ships |
| 3.2.6 Consistent Help | Any help mechanism (Talk to Shamraiz CTA, the concierge trigger, a future help link) appears in the same relative location and order on every page it's on — not just the same page template |
| 3.3.7 Redundant Entry | Multi-step flows (booking §24, valuation §18, once built) must not ask for the same information twice in one session — carry it forward automatically |
| 3.3.8 Accessible Authentication (Minimum) | Not applicable — the site has no login/authentication |
| 4.1.1 Parsing | Removed in 2.2 (obsolete); no action |

## 11. Known risk areas

| Area | Risk | Mitigation |
|---|---|---|
| Filter panel | Custom controls with missing state | Prefer native inputs; test with NVDA |
| Property grid updates | Silent content change | `aria-live` result count |
| Gallery | Focus escape, no keyboard nav | Focus trap + arrow keys, tested |
| Sticky mobile bar | Obscures focused element | `scroll-padding-bottom` reserved |
| Dark theme | Insufficient contrast on secondary text | Verified table in `DESIGN_SYSTEM.md` |
| Concierge | Announcement flooding | `polite`, batched, not `assertive` |

## 12. Statement

An accessibility statement is published at `/accessibility` (linked from the
footer) stating the conformance target, known limitations, and a contact route
for accessibility problems. Contact route: `[CONTENT REQUIRED]`.
