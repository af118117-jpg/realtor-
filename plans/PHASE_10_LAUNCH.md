# PHASE 10 — LAUNCH

**Status:** ⬜ Not started — blocked by Phase 09

---

## Objective

Deploy, verify in production, and hand over.

## Reference
`docs/LAUNCH_CHECKLIST.md` — the authoritative gate. This plan sequences it.

---

## 10A. Pre-launch — client sign-off required

**Launch is authorised only when sections A and B of the launch checklist are
fully checked.** Those cover content integrity and assistant honesty — the two
places where shipping early would mean making false claims on behalf of a real
business and a real person.

- [ ] Section A — content integrity: every factual claim client-confirmed
- [ ] Section B — assistant honesty: disclosure accurate, no overstated capability
- [ ] Client has reviewed every page
- [ ] Client has approved every property listing
- [ ] Client has confirmed contact details and dial/message-tested them

## 10B. Infrastructure

- [ ] Domain purchased and DNS configured
- [ ] Host configured; build pipeline connected
- [ ] SSL provisioned; auto-renewal confirmed
- [ ] `www` / apex redirect decided and consistently canonical
- [ ] HTTP → HTTPS redirect
- [ ] Security headers deployed
- [ ] Custom 404 wired
- [ ] Reproducible build from a clean checkout verified

## 10C. Deploy

- [ ] Deploy to a staging URL first
- [ ] Full smoke test on staging
- [ ] Verify staging is `noindex` and not crawlable
- [ ] Deploy to production
- [ ] Verify production is indexable

## 10D. Post-deploy verification — production, not staging

- [ ] Every route loads over HTTPS
- [ ] Zero console errors on every route
- [ ] All forms submit and **arrive at the real destination**
- [ ] Phone, WhatsApp, email, and directions links tested from a real mobile device
- [ ] Assistant functional
- [ ] Property search and filtering functional
- [ ] Lighthouse re-run against production
- [ ] Security headers re-verified against production
- [ ] Structured data re-validated against live URLs
- [ ] Social share previews verified on real platforms

## 10E. Search infrastructure

- [ ] Search Console verified; sitemap submitted
- [ ] Bing Webmaster Tools verified
- [ ] `robots.txt` live and correct, including the AI crawler policy
- [ ] Request indexing on key routes
- [ ] Google Business Profile linked to the live domain
- [ ] Baseline GEO probe recorded for later comparison

## 10F. Monitoring

- [ ] Uptime monitoring
- [ ] Analytics live, CSP-approved, privacy-compliant
- [ ] Conversion events firing (`LEAD_GENERATION.md` §7)
- [ ] Core Web Vitals field data collecting
- [ ] Search Console error alerts enabled
- [ ] **Form submission alerting** — a silently broken form is the single most
      expensive failure this site can have

## 10G. Handover

- [ ] `README.md`: setup, build, deploy
- [ ] How to add or edit a property listing
- [ ] How to publish an article
- [ ] How to update business details in config
- [ ] How to update FAQ and assistant answers
- [ ] Known limitations documented
- [ ] Client walkthrough completed
- [ ] Repository access transferred
- [ ] Rollback procedure documented **and tested**
- [ ] Support expectations agreed

## 10H. Post-launch review

| When | Review |
|---|---|
| Day 1 | Forms arriving · zero errors · indexing started |
| Week 1 | Field Core Web Vitals · crawl errors · first conversions |
| Month 1 | Search Console performance · conversion rate · GEO probe · defect log |

## Deliberately deferred

Recorded here so they are not forgotten and not smuggled in at the last minute:

| Item | Revisit when |
|---|---|
| Genuine LLM-backed assistant | A real backend exists and disclosure is rewritten |
| Property comparison tool | Real inventory justifies it |
| Saved searches with alerts | Requires a backend |
| CRM integration | Client selects a CRM |
| Multi-language | Client identifies the need |
| Local landing pages | ≥ 3 real listings per target locality |
| Service worker / offline | A demonstrated need appears |
