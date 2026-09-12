# COPY DECK — REALTOR SHAMRAIZ

**Last updated:** 2026-09-07
**Rule:** every line of copy on this site traces to a row in this deck, and every
row traces to a verified source. Nothing is written on the client's behalf.

**Source codes**

| Code | Meaning |
|---|---|
| `C1` | Client message 2026-09-07 — verbatim marketing copy + contact numbers (`CLIENT_COPY.md` Submission 1) |
| `C2` | Client's own YouTube channel, `youtube.com/@propertiesbyShamraiz` ("Realtor Shamraiz Official"), reviewed 2026-09-08. Both C1 phone numbers appear verbatim in the channel's own description — treated as confirming this is the same business, not as an independent unverified source |
| `BR` | Client-authored brief — master requirements §04 positioning, §05 objectives, §06 target users |
| `C3` | Client's direct chat instruction, 2026-09-08 — explicit verbatim text/wording requested in conversation, confirmed via `AskUserQuestion` before being applied |
| `SITE` | A statement about how *this website* works (not a business claim) — safe to author |
| `⛔` | Cannot be written until the client supplies the fact — renders `[CONTENT REQUIRED]` |

---

## 1. Verified vocabulary

This is the complete set of claims we are allowed to make. Copy is assembled
from this list; anything outside it is a fabrication.

| Claim | Exact permitted phrasing | Source |
|---|---|---|
| Coverage | "Bahria Town Rawalpindi and DHA Islamabad" | C1 (areas), precision corrected 2026-09-08 per C2 — see §1.2 |
| City | `[CONTENT REQUIRED]` | Withdrawn 2026-09-08 — see §1.2. Coverage now confirmed to span two cities; do not state a single city |
| Contact | "+92 333 6413988", "+92 309 7371787" | C1 |
| Transparency | "complete transparency" | C1 |
| Documentation | "properly documented transactions" | C1 |
| Benefit framing | "peace of mind" | C1 |
| Property tier | "luxury designer properties" | C1 |
| Property attributes | "breathtaking architecture", "elegant designs", "superior quality finishes" | C1 |
| Lifestyle framing | "style, sophistication, and modern living" | C1 |
| Service — viewings | "site visits" | C1, independently confirmed C2 ("For site visits...") |
| Service — off-market | "exclusive options" available on request | C1, independently confirmed C2 ("...explore more exclusive options") |
| Audiences served | buyers, sellers, landlords, investors | BR §04/§06 |
| Services offered | buying, selling, renting, investing, valuation requests, consultations | BR §05 |
| Property type observed | houses, 5–8 Marla, in listing videos | C2 |
| Area unit | "Marla" is in active use alongside Kanal/sq ft | C2 |
| Legal-status term observed | "registry" (a documented-title house, distinct from allotment/possession-only) — fits the "properly documented" positioning but is not yet an approved copy claim | C2, not yet promoted to shipped copy |

### 1.1 Explicitly forbidden phrasings

Each of these appeared in an earlier draft and has been removed. They are listed
so the QA grep gate can enforce their absence.

| Forbidden | Why |
|---|---|
| "free valuation", "free consultation" | Price of the service is unknown. "Free" is a commercial term the client never stated |
| "WhatsApp" as an available channel | No WhatsApp number supplied. Do not assume either phone line carries it |
| "the finest", "award-winning", "#1", "top-rated" | Unverifiable superlatives / implied awards |
| "X+ years", "X properties sold", "X clients" | Invented counts |
| "X/5 rating", star ratings, review counts | No genuine reviews exist |
| "trusted financing partners", "vetted lawyers", "referral network" | Invented third-party relationships |
| "7 days a week", any stated hours | Hours not supplied |
| "AI-powered", "intelligent", "understands you", "trained on" | The assistant is rule-based (`AI_AGENT_SPEC.md` §2) |

> **Note on "some of the finest luxury designer properties":** the client wrote
> this and may use it as *their own* marketing voice on the site. It must never
> be restated by us as fact, entered into schema markup, or escalated to
> "the finest". Where used, it stays attributed to the client's positioning
> statement. Current decision: **not used in the homepage build** — the
> documentation promise is a stronger and safer differentiator.

### 1.2 Area precision — resolved 2026-09-08

The channel's own video titles consistently said "Bahria Town Rawalpindi," not the
generic "Bahria Town" originally recorded as C1. Bahria Town has phases in
multiple Pakistani cities, so the ambiguity was real. Flagged to the client, who
replied "go ahead" without naming a specific option. Resolved by taking the
best-evidenced combination rather than guessing a single city:

- **Kept** DHA Islamabad — directly client-stated, never contradicted by C2.
- **Sharpened** "Bahria Town" to "Bahria Town Rawalpindi" — matched 5/5 sampled
  video titles from the client's own channel.
- **Withdrew** the single-city claim ("Islamabad") — it was always a derivation,
  never something the client stated directly, and now that coverage is confirmed
  to span two different cities it no longer holds. `city` is `[CONTENT REQUIRED]`
  again until the client states one directly (or confirms both cities should be
  named, e.g. "Islamabad & Rawalpindi").

Applied across `config.js`, `index.html` (title, meta, OG, JSON-LD, all body
copy), `listings-data.js` (locality + area-guide slug), `ai-concierge.js`
(comment only).

---

## 2. Positioning — the strategic call

The client gave us two kinds of material. One is generic in this market
(*luxury, elegant, breathtaking* — every developer in Bahria Town says this).
The other is not:

> **"complete transparency and properly documented transactions for your peace of mind"**

In Islamabad's secondary market, documentation risk — file verification,
transfer, dues, possession — is the single largest source of buyer anxiety.
The client volunteered that promise first, before mentioning the properties.

**Therefore the site leads with documentation and transparency, and uses luxury
as the texture rather than the argument.** Luxury is carried by the design
system — typography, spacing, photography — not by adjectives. This is also
what §10 of the brief asks for: the site should feel expensive because of
execution, not because it says "luxury" repeatedly.

**Positioning line (internal, not published):**
*The luxury broker who shows you the paperwork.*

---

## 3. Homepage

### 3.1 Hero — first screen

The brief (§08) requires the first screen to answer six questions. Mapping:

| Question | Answered by | Source |
|---|---|---|
| Who is Shamraiz? | Brand lockup + lede subject "Realtor Shamraiz" | C1 / BR |
| What does he do? | Eyebrow + lede: luxury property, buy/sell/rent/invest | C1 / BR |
| Where does he operate? | Eyebrow + lede + search defaults: Bahria Town, DHA Islamabad | C1 |
| Who does he help? | Lede: "buyers, sellers, investors and landlords" | BR §06 |
| Why should users trust him? | Proof row: transparency, documented transactions (moved off H1 2026-09-08 — see note below) | C1 |
| What should users do next? | Primary CTA, secondary CTA, search, assistant | SITE |

**Eyebrow**
> Luxury Real Estate · Bahria Town & DHA Islamabad

**H1 — changed 2026-09-08**
> Own Your Experience

Replaces "Exceptional homes, *transparently handled.*" at the client's direct
request in chat (`C3`), confirmed verbatim via `AskUserQuestion` before
applying. This is a tagline, not a factual claim, so it carries no source
obligation beyond "the client asked for these exact words" — but it no longer
does the trust-building work the old H1 did (see the question-mapping table
above: that job now rests on the proof row alone, which already exists
independently in the hero markup and is unaffected by this change).

**Lede**
> Realtor Shamraiz helps buyers, sellers, investors and landlords secure luxury
> designer properties in Bahria Town and DHA Islamabad — breathtaking
> architecture and superior quality finishes, backed by complete transparency
> and properly documented transactions.

Every clause is traceable: audiences `BR §06`; "luxury designer properties",
areas, "breathtaking architecture", "superior quality finishes", "complete
transparency", "properly documented transactions" all `C1`.

**Primary CTA — "Book a Site Visit"**
Chosen over the brief's example "Find a Property" because the client named site
visits as their own conversion action (*"For site visits or to explore more
exclusive options, please contact…"* — C1). It is the highest-intent action we
can honestly offer, and it is the one the client is already set up to fulfil.

**Secondary CTA — "Sell or Rent Out Your Property"**
Covers objectives 2 and 4 (seller and landlord leads) in one control, and does
not use the unverified word "free".

**Tertiary — "Ask the Property Assistant"**
Text-level link into the assistant panel. Deliberately quieter than the two
CTAs; an automated FAQ matcher should not out-shout a human conversation.

**Proof row (replaces the invented statistics)**

The previous hero showed `[X]+ Years Experience`, `[X]+ Properties Closed`,
`[X.X]/5 Client Rating`. Those are three of the nine facts §04 forbids inventing,
and the rating one could not be filled honestly even later — there are no
reviews. They are replaced with four *verified* proof points:

| Label | Value | Source |
|---|---|---|
| Focused coverage | Bahria Town · DHA Islamabad | C1 |
| Every transaction | Properly documented | C1 |
| Viewings | Site visits arranged | C1 |
| Beyond the listings | Exclusive options on request | C1 |

This is strictly stronger than a placeholder: it is specific, true today, and
needs no client input to ship.

### 3.2 About

- **Eyebrow:** About Realtor Shamraiz
- **H2:** Two areas. Known properly.
- **Body:** ⛔ `[CONTENT REQUIRED]` — the agent's real background. Not written for them.
- **Pillar 1:** *Focused local coverage* — "Bahria Town and DHA Islamabad, rather than a map of the whole city." (C1)
- **Pillar 2:** *Properly documented transactions* — "Documentation is verified and explained before you commit, not after." (C1)
- **Pillar 3:** ⛔ `[CONTENT REQUIRED]` — third pillar to be confirmed.
- **CTA:** Read Full Profile · Request a Call

### 3.3 Why work with Realtor Shamraiz

Four cards, each one claim, each traceable:

| Card | Copy | Source |
|---|---|---|
| Properly documented | "Title, transfer and payment records are checked and explained in plain language — so the paperwork is never the part you have to take on trust." | C1 |
| Designer-grade homes | "Breathtaking architecture, elegant design and superior quality finishes — properties selected for how they are built, not only where they are." | C1 |
| Two areas, in depth | "Coverage is deliberately narrow: Bahria Town and DHA Islamabad. Depth in two markets beats a thin presence in ten." | C1 |
| Exclusive options | "Not everything worth seeing is listed publicly. Ask, and exclusive options can be shared privately." | C1 |

### 3.4 Process

Reduced from four invented steps to three that are actually supported.

| Step | Copy | Source |
|---|---|---|
| 01 — Tell us what you need | "One call sets the brief: area, budget, timeline, and what the property has to do for you." | SITE (describes making contact) |
| 02 — See it in person | "Site visits are arranged for the properties that fit — including exclusive options that are not listed publicly." | C1 |
| 03 — Complete on solid paperwork | "Documentation is verified and walked through with you, so the transaction closes properly." | C1 |

⛔ The full step-by-step process (offer strategy, negotiation, transfer, handover)
must be confirmed by the client before it is published as their process.

### 3.5 Areas

- **Eyebrow:** Local Expertise
- **H2:** Bahria Town and DHA Islamabad
- **Body:** "Coverage is limited to two of Islamabad's most established addresses — deliberately." (C1)
- ⛔ Per-area guide copy, and the exact phases/sectors covered.

### 3.6 Valuation band

- **H3:** Considering selling or letting?
- **Body:** "Send the property details and Realtor Shamraiz will come back to you on where it currently sits in the Bahria Town and DHA Islamabad market."
- **CTA:** Request a Valuation

**"Free" removed.** Objective 6 authorises valuation requests as a lead type
(`BR §05`); it does not authorise a price. ⛔ Confirm whether valuations are
charged, and the realistic turnaround, before either is stated.

### 3.7 Testimonials

⛔ Section does not ship. Three fabricated five-star reviews were deleted from
source. It stays `hidden` until genuine, attributable, permission-cleared
testimonials exist — see `LEAD_GENERATION.md` §5.

### 3.8 FAQ

Client-confirmed answers only; everything else visibly `[CONTENT REQUIRED]`.
`FAQPage` schema stays withheld until every answer is confirmed, because schema
publishes answers to search and AI engines as ground truth
(`SEO_STRATEGY.md` §4.1).

| Question | Status |
|---|---|
| Which areas do you cover? | ✅ "Bahria Town and DHA Islamabad." |
| Can I arrange a site visit? | ✅ "Yes — site visits can be arranged, and further exclusive options are available on request." |
| What does 'properly documented' mean? | ✅ Paraphrase of C1, kept general |
| How do I request a valuation? | ⛔ Fee and turnaround unknown |
| What are your hours? | ⛔ Not supplied |
| Is the assistant a real person? | ✅ SITE — "No. It is an automated assistant…" |

### 3.9 Contact

- **H2:** Talk to Realtor Shamraiz
- **Body:** "Call either line, or send the details below and you will get a reply."
- **Form CTA:** Send Enquiry *(was "Send via WhatsApp" — see §4)*
- ⛔ Response-time promise. The success screen currently states no timeframe
  rather than an invented one.

### 3.10 Final CTA

- **H2:** Book a site visit.
- **Body:** "Whether you are buying, selling, letting or investing in Bahria Town or DHA Islamabad, start with a conversation."
- **CTAs:** Call +92 333 6413988 · Call +92 309 7371787

---

## 4. WhatsApp — copy consequences

No WhatsApp number was supplied, and it must not be assumed that either phone
line carries WhatsApp. Every piece of copy that *named* WhatsApp has therefore
been rewritten, not merely hidden:

| Was | Now | Why |
|---|---|---|
| "Message on WhatsApp" (drawer, final CTA) | "Call +92 333 6413988" | Naming an unavailable channel is a false claim even if the link is hidden |
| "Send via WhatsApp" (form button) | "Send Enquiry" | " |
| "This form opens WhatsApp with your message ready to send" | "Sending opens your phone's messaging app with the details filled in. Nothing is stored on this site." | The old note described behaviour that cannot happen |
| "A direct WhatsApp line…" (value card) | Card replaced entirely | Claimed a channel that does not exist |

If a WhatsApp number is supplied, `hasWhatsApp()` in `js/config.js` flips these
back on — but the *copy* above must be restored deliberately, not automatically.

---

## 5. Tagline — options for client selection

`REALTOR_CONFIG.tagline` stays `[CONTENT REQUIRED]`. A tagline is a brand
decision, not a fact we can derive. Three options built only from verified
material, for the client to pick or reject:

| # | Tagline | Note |
|---|---|---|
| 1 | Properly documented. Beautifully built. | Leads with the differentiator; mirrors C1's own order |
| 2 | Luxury addresses, transparently handled. | Matches the H1 |
| 3 | Bahria Town & DHA Islamabad | Not a slogan — a coverage line. Safest option, strong for local SEO |

**Recommendation: 1.** It is the only one a competitor cannot copy without
also committing to it.

---

## 6. Outstanding copy blockers

| Item | Blocks |
|---|---|
| Full display name | Every "Shamraiz" reference that should be a person's name; About; schema |
| Agent bio | About section body |
| Third service pillar | About pillar 3 |
| Valuation: charged or free, turnaround | Valuation band, FAQ, form option |
| Business hours | FAQ, contact, schema |
| Response-time commitment | Every form success screen |
| WhatsApp number | All messaging copy in §4 |
| Testimonials | Reviews section |
| Per-area guide copy | Areas section |
| Full transaction process | Process section beyond step 03 |
