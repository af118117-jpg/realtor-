# PHASE 09 — QA & HARDENING

**Status:** ⬜ Not started — blocked by Phase 08

---

## Objective

Run the full QA matrix, close every defect, and harden security. This is where
the project stops being "built" and becomes "shippable".

## Reference
`docs/QA_PLAN.md` — the complete matrix. This plan schedules it.

## Sequence

### 9A. Content integrity — first, because it can block everything downstream
- [ ] Run the grep suite from `QA_PLAN.md` §2
- [ ] Manual review of every factual claim against the traceability table
- [ ] Confirm every remaining `[CONTENT REQUIRED]` is either resolved or
      explicitly accepted by the client in writing
- [ ] Confirm zero `demo: true` records
- [ ] Confirm all placeholder imagery replaced
- [ ] **Any untraceable claim is an S1 blocker**

### 9B. Assistant honesty audit
- [ ] Site-wide grep for forbidden capability language
- [ ] Disclosure present, accurate, persistent
- [ ] 10+ off-topic inputs — zero fabricated answers
- [ ] Naming decision reflected consistently

### 9C. Functional matrix
- [ ] Navigation · property discovery · property detail · all 8 forms ·
      assistant · all contact paths (`QA_PLAN.md` §4)
- [ ] **Live-test every contact route**: dial the phone number, send the
      WhatsApp message, send the email, open the directions link

### 9D. Cross-browser and device
- [ ] Chrome, Safari, Firefox, Edge — last 2 versions
- [ ] Real iOS device · real Android device
- [ ] 10 viewport widths, 320–2560
- [ ] Landscape mobile

### 9E. Accessibility
- [ ] axe on every route — zero violations
- [ ] Lighthouse accessibility 100 on every route
- [ ] Keyboard walkthrough of all five journeys
- [ ] NVDA + Firefox; VoiceOver macOS + iOS
- [ ] 200% zoom; `prefers-reduced-motion`; forced-colors
- [ ] Every form submitted with errors then successfully, via screen reader

### 9F. Performance
- [ ] Lighthouse mobile on every route — ≥ 95
- [ ] All Core Web Vitals within budget on throttled 4G
- [ ] All resource budgets verified in the network panel
- [ ] Coverage audit — flag unused CSS/JS over 20%
- [ ] `/properties` verified with the full listing set

### 9G. Security hardening
- [ ] All headers from `SECURITY_PLAN.md` §2 deployed
- [ ] External header scan — verify, don't assume
- [ ] CSP: zero violations across every route
- [ ] No mixed content
- [ ] `rel="noopener noreferrer"` audit
- [ ] Personal-data audit in DevTools: storage, URLs, network, console
- [ ] Form endpoint rate-limited and domain-locked
- [ ] Spam protection verified with a scripted submission
- [ ] `npm audit` clean
- [ ] No secrets in the repository or build output

### 9H. Link and asset integrity
- [ ] Link checker over the built output — zero broken links
- [ ] Zero broken images
- [ ] All external links resolve
- [ ] 404 returns a real 404 status

### 9I. Defect closure
- [ ] Every S1 closed
- [ ] Every S2 closed
- [ ] Every S3 closed or explicitly accepted by the client
- [ ] S4 logged
- [ ] Regression pass after the final fix

## Gate

All nine quality gates in `QA_PLAN.md` §1 pass. **Zero open S1 or S2 defects.**
