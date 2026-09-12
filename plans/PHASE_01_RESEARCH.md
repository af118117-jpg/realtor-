# PHASE 01 — RESEARCH & BUSINESS ARCHITECTURE

**Status:** ✅ Complete — documentation delivered 2026-09-07

---

## Objective

Define what the business is, who it serves, what it must achieve, and what is
knowable versus what must come from the client — before any design or code.

## Deliverables

| Deliverable | File |
|---|---|
| Project brief, brand, scope, content rules | `docs/PROJECT_BRIEF.md` |
| Business objectives, functional and non-functional requirements | `docs/BUSINESS_REQUIREMENTS.md` |
| Five audience journeys with friction analysis | `docs/USER_JOURNEYS.md` |
| Lead generation strategy and conversion surfaces | `docs/LEAD_GENERATION.md` |
| Assistant capability spec and disclosure rules | `docs/AI_AGENT_SPEC.md` |

## Key decisions

1. **This is a lead generation platform, not a brochure site.** Every element is
   evaluated against whether it moves a qualified visitor toward contact.
2. **Five distinct audiences** — buyers, sellers, investors, landlords, general —
   each with a documented journey, entry points, friction map, and success signal.
3. **Leads are tiered.** Viewing requests, valuation requests, and consultation
   bookings are Tier 1 and receive the most prominent conversion treatment.
4. **Phone over email** as the required contact field, matching how this business
   type actually converts.
5. **WhatsApp is a first-class channel**, not a fallback.
6. **The assistant is rule-based** and must be described honestly everywhere.
7. **Content integrity is the E-E-A-T strategy**, not merely an ethical
   constraint — fabricated facts destroy the trust signal the whole SEO/AEO/GEO
   approach depends on.

## Outputs requiring client input

14 open questions are listed in `docs/BUSINESS_REQUIREMENTS.md` §7. The most
urgent, because they block Phase 02 remediation:

1. Full display name and professional title
2. Brokerage name and license number
3. Primary city and exact service areas
4. Phone, WhatsApp, email
5. Domain name
6. Currency and price-format convention

## Gate

| Gate | Result |
|---|---|
| G1 Content integrity — no invented facts in documentation | ✅ Pass — all unknowns marked `[CONTENT REQUIRED]` |

## Carried forward

Three S1 content-integrity defects (D-01, D-02, D-03) found in the existing
codebase during Phase 00. They are remediated in Phase 02.
