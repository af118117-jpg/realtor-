# PROJECT BRIEF — REALTOR SHAMRAIZ

**Status:** Draft — pending client sign-off
**Last updated:** 2026-09-07
**Owner:** [CONTENT REQUIRED — project owner name]

---

## 1. What this is

A **real-estate lead generation platform** for the personal brand **Realtor Shamraiz**.

This is explicitly *not* a brochure site. Every page, section, and component is
judged against one question: **does it move a qualified visitor closer to
contacting Shamraiz?** Informational content exists to build the trust that
makes that contact happen — it is a means, not the goal.

## 2. Brand

| Field | Value |
|---|---|
| Brand name | Realtor Shamraiz |
| Category | Real Estate / Realtor |
| Full legal/display name | `[CONTENT REQUIRED]` |
| Brokerage / agency | `[CONTENT REQUIRED]` |
| License / registration no. | `[CONTENT REQUIRED]` |
| Primary city | **Islamabad** ✅ |
| Service areas | **Bahria Town · DHA Islamabad** ✅ |
| Phone | **+92 333 6413988** · **+92 309 7371787** ✅ |
| WhatsApp | `[CONTENT REQUIRED]` — do not assume either phone line |
| Email | `[CONTENT REQUIRED]` |
| Office address | `[CONTENT REQUIRED]` |
| Live domain | `[CONTENT REQUIRED]` |
| Currency | **PKR** (inferred; confirm display convention) |

## 3. Positioning

> A modern, trusted and technology-enabled real-estate professional helping
> buyers, sellers, landlords and investors make better property decisions.

## 4. Brand qualities

These eight qualities drive every design and copy decision. Each is listed with
the concrete site mechanism that expresses it — a quality with no mechanism is
just an adjective.

| Quality | How the site expresses it |
|---|---|
| **Trust** | Named agent, real photography, license number displayed, no fabricated claims, transparent process pages |
| **Authority** | Market insights, area guides, structured FAQ answers, consistent expert voice |
| **Luxury** | Restrained premium visual system, generous whitespace, editorial typography, high-quality imagery |
| **Local expertise** | Area guide pages, neighbourhood-level content, local schema markup |
| **Transparency** | Clear fees/process explanations, honest AI-assistant labelling, no dark patterns |
| **Professionalism** | Fast, accessible, error-free execution; consistent tone; working forms |
| **Personal service** | Direct WhatsApp/call access, named human on every CTA, consultation booking |
| **Technology** | Property search & filtering, valuation tool, AI assistant, saved-search UX |

## 5. Hard content rules

**Never invent** any of the following. If unknown, render the literal token
`[CONTENT REQUIRED]` in the UI so it is impossible to ship by accident:

- Years of experience
- Awards
- Certifications
- Number of clients
- Transaction volume
- Reviews / testimonials
- Property prices
- Office locations
- Credentials / license numbers

Sample property listings used for layout development must carry a
machine-readable `demo: true` flag **and** a visible "Sample listing" badge, and
must be removed or replaced before launch. See `QA_PLAN.md` → Content Integrity Gate.

## 6. Scope

**In scope**
- Public marketing + property discovery website
- Static property data sourced from a versioned data file
- Client-side property search, filter, and sort
- Lead capture forms (buyer, seller, investor, rental, viewing, valuation, consultation)
- Rule-based AI Concierge (see §7)
- SEO, AEO, GEO, and Local SEO implementation
- Accessibility to WCAG 2.1 AA
- Performance budget compliance

**Now in scope (added 2026-09-13 — see D-28 in `plans/MASTER_PLAN.md`)**
- Backend server and database: a Node.js/TypeScript REST API (Express +
  Prisma + PostgreSQL) lives in `server/`. Properties, leads, media and
  business settings are stored server-side and shared across every device,
  superseding D-26's client-side-only panel and D-27's same-browser bridge.
- Real server-verified authentication for `/admin`: bcrypt-hashed passwords,
  httpOnly JWT + rotating refresh cookies, rate limiting, and a CSRF header
  requirement on state-changing requests.
- Public lead capture: website contact forms POST to the API (honeypot +
  timing anti-spam) and appear in the admin Leads list.

**Out of scope (this phase)**
- Payment processing
- MLS / portal live integration
- Third-party CRM integration (leads are stored in this project's own database)
- Genuine LLM-backed chat (see §7)

## 7. AI Concierge — honesty constraint

The AI Concierge is a **rule-based, scripted assistant**. It matches user input
against a defined intent set and returns pre-authored responses, then routes to a
human via WhatsApp/phone/form.

It must **never** be described in UI copy, marketing text, or documentation as an
LLM, as "AI-powered understanding", or as anything implying generative
capability it does not have. Permitted framing: *"Instant property assistant"*,
*"Guided property finder"*. See `AI_AGENT_SPEC.md` §Disclosure.

If a genuine LLM backend is built later, this constraint is revisited — not before.

## 8. Success criteria

The project is done when every item in `LAUNCH_CHECKLIST.md` passes, which
requires at minimum:

1. All routes in `INFORMATION_ARCHITECTURE.md` exist and are reachable.
2. Every user journey in `USER_JOURNEYS.md` completes without a dead end.
3. Zero `[CONTENT REQUIRED]` tokens remain, or the client has explicitly
   accepted each remaining one.
4. Zero fabricated business facts.
5. Lighthouse budgets in `PERFORMANCE_PLAN.md` met.
6. Zero WCAG 2.1 AA violations from `ACCESSIBILITY_PLAN.md`.
7. Zero console errors on any route.
8. AI Concierge disclosure copy present and accurate.

## 9. Project independence

This project shares no code, assets, configuration, content, or design system
with any other project. It was architected independently from the requirements
above. See `PHASE_00_AUDIT.md` for the verification record.
