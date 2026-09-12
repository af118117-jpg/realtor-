# LEAD GENERATION — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

The site's reason to exist. Everything else is in service of this document.

---

## 1. Conversion surfaces

| Surface | Location | Intent | Tier |
|---|---|---|---|
| Hero dual CTA | `/` | Buy / Sell split | 2 |
| Hero property search | `/` | Discovery | 3 |
| Sticky enquiry panel | `/properties/[slug]` | Viewing request | **1** |
| Mobile sticky action bar | All pages | Call / WhatsApp | 1–3 |
| Landing page form | `/buy` `/sell` `/rent` `/invest` | Audience-specific | 2 |
| Valuation intake | `/property-valuation` | Seller | **1** |
| Consultation booking | `/book-consultation` | Consultation | **1** |
| Property submission | `/submit-property` | Landlord/owner | 2 |
| Contact form | `/contact` | General | 3 |
| Concierge handoff | Global widget, `/ai-assistant` | Any | 2–3 |
| Empty-state capture | `/properties` no results | Buyer | 2 |
| Article end CTA | `/blog/*`, `/market-insights/*` | Contextual | 3 |
| Footer contact block | All pages | Direct | 1–3 |

## 2. CTA hierarchy rules

- **One primary CTA per viewport section.** Competing primaries reduce total
  conversions; this is not negotiable for visual variety.
- Every page declares one **page-level primary action** (see the route table in
  `INFORMATION_ARCHITECTURE.md`). All other actions are secondary or ghost.
- Phone and WhatsApp are reachable from **every** page without scrolling — header
  on desktop, sticky bar on mobile.
- CTA copy is specific and outcome-shaped: "Request a Viewing", "Get My Valuation",
  "Book a Consultation" — never "Submit", "Click Here", or "Learn More".

## 3. Form design principles

### 3.1 Field minimisation

Every field costs conversions. Each one must earn its place.

| Form | Required | Optional |
|---|---|---|
| Viewing request | Name, phone, preferred time | Email, message |
| Buyer enquiry | Name, phone | Email, budget, locality, type, timeline |
| Seller / valuation | Name, phone, locality, property type | Email, size, beds, condition, timeline |
| Investor | Name, phone | Email, budget, horizon, locality |
| Rental | Name, phone | Email, budget, move-in date |
| Consultation | Name, phone, topic | Email, preferred time |
| Submit property | Name, phone, property type, locality | Everything else |
| General contact | Name, phone, message | Email |

Phone is required over email throughout: it is the channel this business
actually converts on. Email is offered but never blocking.

### 3.2 Interaction rules

- Labels are always visible. **Placeholder-only labelling is forbidden** — it
  fails accessibility and destroys recall once typing starts.
- Validate on `blur`, never on `keystroke`. Re-validate on input only *after* a
  field has already errored.
- Errors are specific ("Enter a phone number we can reach you on"), attached to
  the field via `aria-describedby`, and announced.
- The submit button never appears disabled pending validation — it submits and
  then reports what is wrong, moving focus to the first error.
- Explicit consent checkbox, unchecked by default, before submission.
- Honeypot field + submission-timing check for spam. No CAPTCHA — it costs more
  conversions than the spam it prevents at this volume.

### 3.3 Success state

Must answer three questions, in this order:

1. **Did it work?** — clear confirmation, focus moved to it, announced politely.
2. **What happens next?** — "[name] will call you back within `[CONTENT REQUIRED]`."
3. **What can I do now?** — onward link (browse properties, read an area guide).

Never a bare "Thanks!" and never a dead end.

## 4. WhatsApp as primary channel

WhatsApp is the highest-converting channel for this business type and is treated
as a first-class path, not a fallback.

- Every form has a "Prefer WhatsApp?" alternative alongside it.
- Every WhatsApp link is pre-filled with relevant context (property reference,
  enquiry type, collected qualifiers).
- Message templates live in one module and are composed from `config.ts` — the
  number is never hard-coded.
- Links open in a new tab with `rel="noopener"`.

Template shape:
```
Hi [agentName], I'm interested in [context].
[qualifier lines]
(Sent from realtorshamraiz.com)
```

## 5. Trust elements that support conversion

Placed adjacent to conversion points, because trust is what closes the gap
between interest and contact:

- Named, photographed agent — not a faceless brand
- License / registration number `[CONTENT REQUIRED]`
- Brokerage affiliation `[CONTENT REQUIRED]`
- Explicit "no obligation" statement on valuation and consultation forms
- Stated response time `[CONTENT REQUIRED]`
- Clear privacy statement adjacent to the consent checkbox
- Genuine, attributable testimonials **only** — `[CONTENT REQUIRED]` until supplied

**No fabricated social proof.** No invented review counts, star ratings, "trusted
by N clients", or stock-photo testimonials. If the client has no testimonials
yet, the section does not ship.

## 6. Friction audit — recurring failure modes

| Failure | Rule |
|---|---|
| CTA below the fold on mobile | Primary CTA visible without scrolling on the hero |
| Form too long | Progressive disclosure; optional fields collapsed |
| Unclear what happens after submit | Stated *before* the button, not only after |
| Phone number not tappable | All numbers are `tel:` links |
| Contact buried | Header + sticky bar + footer on every page |
| Dead-end 404 | 404 offers search + contact |
| Zero search results | Empty state converts instead of apologising |
| Slow page | Performance budget — a slow page is a lost lead |

## 7. Measurement

Events to instrument once an analytics tool is chosen and CSP-approved
(`SECURITY_PLAN.md`). No personal data in any event payload.

| Event | Where |
|---|---|
| `search_performed` | `/properties` |
| `filter_applied` | `/properties` |
| `property_viewed` | `/properties/[slug]` |
| `cta_clicked` | all — with page + CTA label |
| `form_started` | first field focus |
| `form_submitted` | success, with `intent` |
| `form_error` | validation failure, with field name |
| `whatsapp_clicked` | all |
| `call_clicked` | all |
| `concierge_opened` / `concierge_handoff` | assistant |

**Primary KPI:** total qualified enquiries per month.
**Secondary:** enquiry rate per session, property-detail → viewing-request rate,
form start → completion rate, mobile vs. desktop conversion gap.

Analytics tool: `[CONTENT REQUIRED]`.
