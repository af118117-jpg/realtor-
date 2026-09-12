# USER JOURNEYS — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07

Five audiences. Each journey is documented as entry → intent → path → friction →
conversion, and each has an explicit "what could go wrong" section, because the
failure modes are where leads are actually lost.

---

## 1. BUYERS

**Looking for:** houses · apartments · plots · commercial · investment · rental

### Entry points
Organic search for "[property type] in [locality]" · Home hero search ·
Social/referral link direct to a property · Paid ad to `/buy`

### Journey
```
Entry → /properties (or /buy)
      → Apply filters (type, price, beds, locality)
      → Scan result cards
      → Open /properties/[slug]
      → Review gallery, facts, location
      → Request a Viewing  ← PRIMARY CONVERSION
      → Confirmation + what-happens-next
```

### Friction points and mitigations
| Friction | Mitigation |
|---|---|
| Too many/too few results | Result count always visible; empty state offers "tell us what you want" form |
| Price format unfamiliar | Format per client convention, with full figure on hover/expand |
| Doesn't want to fill a form | WhatsApp deep link pre-filled with property reference |
| Not ready to enquire | Save/shortlist (local only) + "get similar alerts" soft capture |
| On mobile, CTA scrolled away | Sticky enquiry bar on property detail |

### Success signal
Viewing request submitted, or WhatsApp opened with property reference.

---

## 2. SELLERS

**Wanting:** valuation · marketing · qualified buyers · negotiation help

### Entry points
Organic search for "sell property [locality]" · `/sell` from nav ·
Home intent-router card · Area guide content

### Journey
```
Entry → /sell
      → Understand the process (what Shamraiz actually does)
      → See proof of capability
      → /property-valuation  ← PRIMARY CONVERSION
      → Structured intake (type, locality, size, condition, timeline)
      → Submit
      → Honest expectation set: a human responds, no instant fake number
```

### Friction points and mitigations
| Friction | Mitigation |
|---|---|
| Expects an instant automated valuation | Copy states plainly that a person prepares the valuation, and why that is more accurate |
| Wary of commitment | "No obligation" stated; explain exactly what happens after submit |
| Doesn't know their property size | Optional fields with helper text; never block submission on a nice-to-have |
| Comparing multiple agents | `/about` credentials + `/services` clarity, linked from `/sell` |

### Success signal
Valuation request submitted, or consultation booked.

**Constraint:** the valuation tool must never display a computed or estimated
figure. It collects a request. See `BUSINESS_REQUIREMENTS.md` FR-15.

---

## 3. INVESTORS

**Interested in:** rental yield · appreciation · location · demand · investment horizon

### Entry points
Organic search for investment-intent queries · `/invest` · `/market-insights` articles

### Journey
```
Entry → /market-insights (authority first — investors validate before they contact)
      → /invest
      → Review investment-relevant framing (yield, horizon, area demand)
      → /properties filtered to investment-suitable stock
      → Investor enquiry  ← PRIMARY CONVERSION
```

### Friction points and mitigations
| Friction | Mitigation |
|---|---|
| Wants hard numbers that cannot be fabricated | Present only client-verified data; where unavailable, offer a consultation to discuss specifics rather than inventing figures |
| Longer decision cycle | Market-update subscription as a soft conversion |
| Needs comparison across areas | Area guides cross-linked from `/invest` |

**Constraint:** no invented yield percentages, appreciation rates, or demand
statistics. Any figure shown must be client-supplied and attributed, or it does
not ship. This is the highest fabrication-risk journey in the project.

### Success signal
Investor enquiry submitted, consultation booked, or insights subscription.

---

## 4. LANDLORDS

**Needing:** tenants · rental marketing · property management information

### Entry points
Organic search for "rent out property [locality]" · `/rent` · `/submit-property`

### Journey
```
Entry → /rent (landlord section)
      → Understand tenant-sourcing service
      → /submit-property  ← PRIMARY CONVERSION
      → Property intake form
      → Confirmation
```

### Friction points and mitigations
| Friction | Mitigation |
|---|---|
| `/rent` reads as tenant-only | Page has two clearly signposted halves: "Looking to rent" / "Have a property to rent out" |
| Long intake form | Progressive disclosure; required fields minimised to contact + property basics |
| Unsure what management is offered | `/services` linked inline, scoped to what the client actually offers |

### Success signal
Property submitted, or landlord enquiry.

---

## 5. GENERAL USERS

**Wanting:** market information · property guides · contact details · advice

### Entry points
Organic long-tail search · FAQ answers surfaced in AI/answer engines · Brand search

### Journey
```
Entry → /blog or /faq or /market-insights
      → Get the answer they came for
      → Recognise expertise
      → Route into an intent lane (/buy, /sell, /rent, /invest)
      → Soft conversion: AI Assistant, consultation, or contact
```

### Friction points and mitigations
| Friction | Mitigation |
|---|---|
| Not ready for a hard CTA | Soft entry via AI Assistant or FAQ |
| Answer page is a dead end | Every article ends with a relevant next step |
| Just wants a phone number | Contact details in header, footer, and `/contact`; never more than one click away |

### Success signal
Progression into an intent lane, assistant session, or direct contact.

---

## 6. AI CONCIERGE JOURNEY (cross-audience)

```
Trigger (widget or /ai-assistant)
  → Disclosure shown: automated assistant, not a person
  → Guided intent selection (Buy / Sell / Rent / Invest / General)
  → 2–4 qualifying questions from a fixed set
  → Matched result: relevant properties, relevant page, or relevant answer
  → Handoff: WhatsApp / call / form, carrying the collected context
```

**No-match path:** the assistant states it cannot answer that and offers human
handoff. It never guesses, never invents, and never claims to have understood
something it has not matched. See `AI_AGENT_SPEC.md`.

---

## 7. Journey-level QA requirements

Every journey above must be walked end-to-end at 360px, 768px, and 1440px before
launch, verifying:

- No dead ends — every terminal state offers a next step
- No broken or placeholder-only CTAs
- Form validation is reachable and announced to screen readers
- Success states are focus-managed and announced
- Back-button behaviour preserves filter state
- Contact details are correct and consistent everywhere they appear
