# BUSINESS REQUIREMENTS — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

---

## 1. Primary objective

Generate qualified real-estate leads for Realtor Shamraiz.

## 2. The ten business objectives

Each objective is bound to a conversion surface and a measurable signal. An
objective with no surface is not implemented; a surface with no signal cannot be
optimised.

| # | Objective | Primary surface | Lead signal |
|---|---|---|---|
| 1 | Generate buyer leads | `/buy`, `/properties`, property detail | Buyer enquiry form submit |
| 2 | Generate seller leads | `/sell`, `/property-valuation` | Seller enquiry / valuation request |
| 3 | Generate investor leads | `/invest` | Investor enquiry form |
| 4 | Generate rental enquiries | `/rent`, rental listings | Rental enquiry form |
| 5 | Generate viewing requests | Property detail page | "Request a viewing" submit |
| 6 | Generate valuation requests | `/property-valuation` | Valuation form submit |
| 7 | Generate consultation bookings | `/book-consultation` | Booking form submit |
| 8 | Enable property discovery | `/properties` | Search performed, filter applied, detail viewed |
| 9 | Provide AI property assistance | `/ai-assistant`, global widget | Assistant session → handoff to human |
| 10 | Establish local authority | `/market-insights`, `/blog`, area guides | Organic entrances, time on page, scroll depth |

## 3. Lead priority tiers

Not all leads are equal. Form routing, response messaging, and CTA prominence
follow this ranking.

**Tier 1 — highest intent (respond fastest)**
- Viewing request on a specific property
- Seller valuation request
- Consultation booking

**Tier 2 — strong intent**
- Buyer enquiry with budget + area specified
- Investor enquiry
- Rental enquiry on a specific property

**Tier 3 — early-stage**
- General contact form
- AI Concierge handoff without qualifying detail
- Newsletter / market-update signup

## 4. Functional requirements

### 4.1 Property discovery
- FR-1 Browse all listings with pagination or progressive loading
- FR-2 Filter by: transaction type (buy/rent/commercial), category, price range, beds, baths, area/locality
- FR-3 Sort by: newest, price ascending, price descending
- FR-4 Free-text search across title, category, and locality
- FR-5 Empty-state that offers a lead capture path instead of a dead end
- FR-6 Individual property detail page per listing at a stable URL
- FR-7 Filter state reflected in the URL so results are shareable and linkable

### 4.2 Lead capture
- FR-8 Distinct forms per intent (buyer, seller, investor, rental, viewing, valuation, consultation, general)
- FR-9 Client-side validation with accessible, specific error messaging
- FR-10 Success confirmation state that tells the user what happens next and when
- FR-11 WhatsApp deep-link fallback pre-filled with the enquiry context
- FR-12 Direct call CTA on every page
- FR-13 Explicit consent checkbox before submission (see `SECURITY_PLAN.md`)

### 4.3 Valuation tool
- FR-14 Structured intake: property type, locality, size, beds, condition, timeline
- FR-15 Must **not** output a fabricated estimated value — it collects a request and delivers it to a human
- FR-16 Sets an honest expectation of response time (value supplied by client)

### 4.4 AI Concierge
- FR-17 Rule-based intent matching against a defined intent set
- FR-18 Clear, persistent disclosure that it is an automated assistant
- FR-19 Human handoff available at every step
- FR-20 Fallback response when no intent matches — never a fabricated answer

### 4.5 Trust & authority
- FR-21 About page with agent bio, credentials, and service areas
- FR-22 Area guide content per service area
- FR-23 Market insights / blog with structured, answer-shaped content
- FR-24 FAQ page with schema-marked question/answer pairs

## 5. Non-functional requirements

| ID | Requirement | Target | Verified in |
|---|---|---|---|
| NFR-1 | Largest Contentful Paint | ≤ 2.5s on 4G mobile | `PERFORMANCE_PLAN.md` |
| NFR-2 | Cumulative Layout Shift | ≤ 0.1 | `PERFORMANCE_PLAN.md` |
| NFR-3 | Interaction to Next Paint | ≤ 200ms | `PERFORMANCE_PLAN.md` |
| NFR-4 | Accessibility | WCAG 2.1 AA, zero violations | `ACCESSIBILITY_PLAN.md` |
| NFR-5 | Responsive range | 320px – 2560px, no horizontal overflow | `QA_PLAN.md` |
| NFR-6 | Browser support | Last 2 versions of Chrome, Safari, Firefox, Edge | `QA_PLAN.md` |
| NFR-7 | JS failure tolerance | Core content and contact details readable with JS disabled | `TECH_ARCHITECTURE.md` |
| NFR-8 | Console errors | Zero on every route | `QA_PLAN.md` |
| NFR-9 | Content integrity | Zero fabricated business facts | `QA_PLAN.md` |
| NFR-10 | Security headers | CSP, HSTS, X-Content-Type-Options, Referrer-Policy | `SECURITY_PLAN.md` |

## 6. Constraints

- **No backend** in this phase. Form delivery uses a third-party form endpoint
  and/or WhatsApp deep links. The chosen endpoint is `[CONTENT REQUIRED]`.
- **No fabricated content.** See `PROJECT_BRIEF.md` §5.
- **Static hosting** target.
- All business values live in **one** configuration source and are referenced,
  never duplicated.

## 7. Open questions for the client

These block launch. Each maps to a `[CONTENT REQUIRED]` token in the build.

1. Full display name and preferred professional title?
2. Brokerage/agency name and license number (and is display legally required)?
3. Primary city and the exact list of service areas?
4. Phone, WhatsApp, and email — are they the same number for phone and WhatsApp?
5. Office address, and should it be published?
6. Live domain name?
7. Currency and price-formatting convention?
8. Real listings — how many, and in what format will they be supplied?
9. Professional photography — of the agent, and of properties?
10. Realistic response-time commitment for enquiries?
11. Which social channels are active?
12. Preferred form-delivery destination (email inbox, form service, CRM)?
13. Any genuine, attributable client testimonials available?
14. Any awards, certifications, or verifiable track-record figures?
