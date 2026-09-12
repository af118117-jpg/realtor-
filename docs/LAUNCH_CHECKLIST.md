# LAUNCH CHECKLIST — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

Nothing here is optional. Every unchecked box is a launch blocker until the
client explicitly accepts it in writing.

---

## A. Content integrity — **launch blocker**

- [ ] Zero fabricated business facts anywhere on the site
- [ ] Agent name, title, and spelling client-confirmed
- [ ] Brokerage and license number confirmed (or confirmed as not applicable)
- [ ] Phone number confirmed and **dial-tested**
- [ ] WhatsApp number confirmed and **message-tested**
- [ ] Email confirmed and **delivery-tested**
- [ ] Office address confirmed, and publication approved
- [ ] City and service areas confirmed
- [ ] Business hours confirmed
- [ ] Response-time commitment confirmed and realistic
- [ ] All property listings are real, current, and client-approved
- [ ] All property prices verified
- [ ] Zero `demo: true` listings in production
- [ ] Zero `[CONTENT REQUIRED]` tokens, or each remaining one explicitly accepted
- [ ] All testimonials genuine and attributable, or the section removed
- [ ] All market statistics client-supplied and attributed, or removed
- [ ] All placeholder images replaced with real photography
- [ ] Agent photograph is real and client-approved

## B. AI Concierge honesty — **launch blocker**

- [ ] Disclosure copy present, accurate, and persistent
- [ ] Zero instances of forbidden capability language site-wide
  (`AI-powered`, `intelligent`, `understands`, `trained on`, `learns`)
- [ ] `NO_MATCH` path verified — zero fabricated answers
- [ ] Naming decision made (`AI Assistant` retained with disclosure, or renamed)

## C. Functionality

- [ ] All 19 routes live and reachable
- [ ] Every property detail page generates and renders
- [ ] Property search, all filters, all sorts verified
- [ ] All 8 forms submit and reach the destination
- [ ] All form success states verified
- [ ] All WhatsApp deep links pre-fill correctly
- [ ] All `tel:` links dial correctly
- [ ] Concierge fully functional
- [ ] 404 page returns a real 404 status and offers recovery
- [ ] Zero broken internal links
- [ ] Zero broken images
- [ ] Zero console errors or warnings on any route
- [ ] All five user journeys complete end-to-end

## D. Responsive

- [ ] Verified at 320 · 360 · 390 · 414 · 768 · 1024 · 1280 · 1440 · 1920 · 2560
- [ ] No horizontal overflow at any width
- [ ] Chrome, Safari, Firefox, Edge — last 2 versions
- [ ] Real iOS device tested
- [ ] Real Android device tested
- [ ] Landscape orientation verified on mobile

## E. Accessibility

- [ ] Lighthouse accessibility 100 on every route
- [ ] Zero axe violations on every route
- [ ] Full keyboard walkthrough of all journeys
- [ ] NVDA + Firefox verified
- [ ] VoiceOver (macOS + iOS) verified
- [ ] 200% zoom verified
- [ ] `prefers-reduced-motion` verified
- [ ] Forced-colors mode verified
- [ ] All contrast ratios verified against `DESIGN_SYSTEM.md` §2.2
- [ ] Accessibility statement published at `/accessibility`

## F. Performance

- [ ] Lighthouse mobile performance ≥ 95 on every route
- [ ] LCP ≤ 2.5s on throttled 4G
- [ ] CLS ≤ 0.1
- [ ] INP ≤ 200ms
- [ ] All resource budgets met
- [ ] All images optimised, responsive, correctly sized
- [ ] All images have explicit dimensions
- [ ] Fonts subset, self-hosted, preloaded
- [ ] Zero render-blocking third-party requests

## G. SEO

- [ ] Unique title and meta description on every page
- [ ] Self-referencing canonical on every page
- [ ] One `<h1>` per page; no skipped heading levels
- [ ] `sitemap.xml` generated, accurate, submitted
- [ ] `robots.txt` correct, references the sitemap
- [ ] AI crawler policy decided and implemented
- [ ] All JSON-LD validates with zero errors
- [ ] Schema describes only real, visible content
- [ ] Zero listing schema on sample data
- [ ] Open Graph and Twitter Card tags on every page
- [ ] Social share preview verified
- [ ] Google Search Console verified and sitemap submitted
- [ ] Bing Webmaster Tools verified
- [ ] `noindex` on filter query-string URLs
- [ ] Zero orphan pages

## H. Local SEO

- [ ] NAP identical on-site and across all external profiles
- [ ] `LocalBusiness` / `RealEstateAgent` schema with real address and geo
- [ ] Google Business Profile claimed, verified, and complete
- [ ] Google Business Profile links to the site
- [ ] Area guides published with genuine, distinct content
- [ ] Map embed or static alternative functional

## I. Security

- [ ] HTTPS enforced; HTTP redirects
- [ ] All headers from `SECURITY_PLAN.md` §2 present and externally verified
- [ ] CSP produces zero violations across all routes
- [ ] No mixed content
- [ ] `rel="noopener noreferrer"` on all external links
- [ ] No personal data in storage, URLs, or analytics
- [ ] Form endpoint rate-limited and domain-locked
- [ ] Spam protection functional
- [ ] `npm audit` clean
- [ ] No secrets in the repository or build output

## J. Legal

- [ ] Privacy policy published and accurate to actual behaviour
- [ ] Terms published
- [ ] Cookie/consent handling matches what the site actually does
- [ ] Data-retention period stated
- [ ] License/registration displayed where legally required
- [ ] Any jurisdiction-specific real-estate disclosures included — `[CONTENT REQUIRED]`

## K. Infrastructure

- [ ] Domain configured and DNS propagated
- [ ] SSL certificate valid and auto-renewing
- [ ] `www` / apex redirect consistent and canonical
- [ ] Build pipeline reproducible from a clean checkout
- [ ] Repository under version control with a clean history
- [ ] Backup of source and content
- [ ] Rollback procedure documented and tested
- [ ] Uptime monitoring configured
- [ ] Analytics installed, CSP-approved, and privacy-compliant

## L. Handover

- [ ] `README.md` with setup, build, and deploy instructions
- [ ] Documented process for adding or editing a property listing
- [ ] Documented process for publishing an article
- [ ] Documented process for updating business details in `config.ts`
- [ ] Client walkthrough completed
- [ ] Known limitations documented
- [ ] Support and maintenance expectations agreed

---

## Final sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Build | | | |
| Client | | | |

**Launch is authorised only when sections A and B are fully checked.** Those two
sections are about telling the truth on behalf of a real business, and no
deadline justifies shipping past them.
