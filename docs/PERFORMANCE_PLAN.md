# PERFORMANCE PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

A property site is image-heavy and mobile-first. Performance is a conversion
factor, not a technical nicety — a slow property page is an abandoned lead.

---

## 1. Budgets

Enforced on **mobile, throttled 4G, mid-tier device**. Desktop is not the test.

| Metric | Budget | Fail threshold |
|---|---|---|
| Largest Contentful Paint | ≤ 2.0s | > 2.5s |
| Cumulative Layout Shift | ≤ 0.05 | > 0.1 |
| Interaction to Next Paint | ≤ 150ms | > 200ms |
| First Contentful Paint | ≤ 1.5s | > 1.8s |
| Time to First Byte | ≤ 600ms | > 800ms |
| Total Blocking Time | ≤ 150ms | > 300ms |
| Lighthouse Performance | ≥ 95 | < 90 |

### Resource budgets (per page, compressed)

| Resource | Budget |
|---|---|
| HTML | ≤ 30 KB |
| CSS | ≤ 40 KB |
| JS (total) | ≤ 60 KB |
| JS (initial/blocking) | **0 KB** |
| Fonts | ≤ 100 KB (2 families, subset) |
| Images above the fold | ≤ 200 KB |
| Total initial load | ≤ 500 KB |
| Requests (initial) | ≤ 25 |

Exceeding a budget requires either a fix or a written justification in this
document. It is never silently accepted.

## 2. Rendering strategy

Static pre-rendered HTML. No client-side rendering of content, no hydration of
pages that have no interactivity. JavaScript ships only for:

| Island | Loading | Est. size |
|---|---|---|
| Mobile nav + header | `client:load` (tiny, above fold) | ~2 KB |
| Property filters | `client:visible` | ~8 KB |
| Form runtime | `client:visible` | ~6 KB |
| Concierge | `client:idle` | ~12 KB |
| Gallery / lightbox | `client:visible` | ~5 KB |

Pages with no interactive island ship **zero JavaScript**.

## 3. Images — the dominant cost

| Rule | Detail |
|---|---|
| Format | AVIF with WebP fallback; JPEG last resort |
| Responsive | `srcset` + `sizes` for every content image |
| Dimensions | Explicit `width`/`height` on every `<img>` — the primary CLS defence |
| Lazy loading | `loading="lazy"` on everything below the fold |
| Eager loading | Hero image only: `loading="eager"` + `fetchpriority="high"` |
| Decoding | `decoding="async"` on non-critical images |
| Aspect ratio | CSS `aspect-ratio` on every image container |
| Compression | Quality 75–82; no image over 250 KB |
| Dimensions cap | No image served larger than its maximum display size |
| Placeholders | Solid-colour or blur-up; never a layout-shifting empty box |

Gallery images beyond the first are loaded on interaction, not on page load.

## 4. Fonts

- Two families only: Playfair Display (display), Inter (body)
- Self-hosted WOFF2, subset to the required character set
- `font-display: swap`
- `<link rel="preload">` on the two most critical weights only
- Fallback stack metric-matched (`size-adjust`, `ascent-override`) to minimise
  swap-induced shift
- No font variants loaded that the design does not use

## 5. CSS

- Single stylesheet, no framework, no unused utility bulk
- Critical CSS inlined for above-the-fold; remainder loaded normally
- No `@import` chains
- Contain layout where possible (`content-visibility: auto` on long lists)
- Minified in production

## 6. JavaScript

- No framework runtime in production
- Vanilla, module-scoped, tree-shaken
- No polyfills for supported browsers
- Event delegation over per-element listeners on lists
- Debounce filter input (150ms); throttle scroll handlers, or use
  `IntersectionObserver` instead
- No layout thrashing — batch reads, then writes
- Zero third-party scripts without a `SECURITY_PLAN.md` entry

## 7. Property listing page — specific risks

The `/properties` page renders many image cards and is the most likely budget
breach.

| Risk | Mitigation |
|---|---|
| All listing images load at once | Lazy-load below fold; paginate or progressively load beyond ~12 cards |
| Filtering causes full re-render | Toggle visibility / reorder existing nodes; do not rebuild the DOM |
| Layout shift on filter | Reserve container height; animate with `transform` only |
| Long list scroll jank | `content-visibility: auto` + `contain-intrinsic-size` |
| Filter state lost on back | State in URL, restored on load |

## 8. Delivery

- CDN-backed static host
- Brotli compression
- HTTP/2 or HTTP/3
- Immutable, hashed asset filenames with long `Cache-Control`
- HTML `no-cache` with revalidation
- Preconnect only to origins actually used
- No render-blocking third-party requests

## 9. Verification

**Every route, every release:**
- Lighthouse mobile (throttled) — record scores
- WebPageTest on a real mid-tier mobile profile
- Chrome DevTools Performance trace on `/` and `/properties`
- Coverage panel — flag unused CSS/JS over 20%
- Network panel — confirm request count and payload budgets
- Field data (CrUX / RUM) once live

**Regression gate:** a change that pushes any metric past its fail threshold does
not merge until fixed or explicitly justified here.

## 10. Deferred / conditional

| Item | Condition |
|---|---|
| Service worker / offline | Only if a demonstrated need appears; adds cache-invalidation risk |
| Image CDN | If real photography volume makes build-time processing impractical |
| Prefetch on hover | After baseline budgets are met, not before |
| Analytics | Must be lightweight and CSP-approved; budget impact measured before adoption |
