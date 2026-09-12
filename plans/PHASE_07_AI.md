# PHASE 07 — ASSISTANT & LEAD CAPTURE

**Status:** ⬜ Not started — blocked by Phase 06

---

## Objective

Build the eight lead forms and the rule-based property assistant — the
conversion machinery the whole site exists to feed.

## Reference
`docs/AI_AGENT_SPEC.md`, `docs/LEAD_GENERATION.md`, `docs/SECURITY_PLAN.md` §3

---

## Part 1 — Lead capture

### 7A. Form engine
- [ ] Reusable field components covering all six states
- [ ] Visible labels always; **no placeholder-only labelling**
- [ ] Validation on `blur`; re-validation on input only after a field has errored
- [ ] Specific error messages linked by `aria-describedby`
- [ ] Error summary in an `aria-live` region; focus to the first invalid field
- [ ] Correct `autocomplete` tokens and input types
- [ ] Consent checkbox — real input, unchecked by default, required
- [ ] Honeypot field + submission-timing check
- [ ] Submitting, success, and error states

### 7B. The eight forms
- [ ] Viewing request (Tier 1) · Valuation (Tier 1) · Consultation (Tier 1)
- [ ] Buyer · Investor · Rental · Property submission
- [ ] General contact
- [ ] Field sets per `LEAD_GENERATION.md` §3.1 — phone required, email optional

### 7C. Submission
- [ ] Endpoint integration — `[CONTENT REQUIRED]`, must meet `SECURITY_PLAN.md` §4
- [ ] WhatsApp alternative on every form, pre-filled with context
- [ ] Success state: confirmation → what happens next → onward link
- [ ] **Zero personal data** in storage, URLs, console, or analytics — verified in DevTools

### 7D. Valuation — special constraint
- [ ] Collects a request; **outputs no estimated figure**
- [ ] Copy states plainly that a person prepares the valuation, and why
- [ ] Optional fields never block submission

---

## Part 2 — Property assistant

### 7E. Naming decision — required before build
The route `/ai-assistant` and the name "AI Concierge" imply generative
capability this feature does not have.
- [ ] **Client decision:** rename to "Property Assistant" (recommended), or
      retain the name with the mandatory disclosure everywhere it appears

### 7F. Intent engine
- [ ] Intent data set per `DATA_MODEL.md` §5
- [ ] Normalise → score → threshold → disambiguate → fallback
- [ ] **No generative layer. No fuzzy semantic matching. No invented answers.**
- [ ] `NO_MATCH` fallback is the only path for unrecognised input

### 7G. Conversation flow
- [ ] Intent chips → max 4 qualifying questions → result → handoff
- [ ] Property matching against real listings data, max 3 results
- [ ] Zero matches stated plainly, with a handoff offer
- [ ] FAQ answers sourced from the FAQ data
- [ ] Handoff available from every state, carrying collected context

### 7H. Disclosure — **launch blocker**
- [ ] Persistent, non-dismissible disclosure in the panel header
- [ ] Verbatim copy from `AI_AGENT_SPEC.md` §2
- [ ] Site-wide grep for forbidden language: `AI-powered`, `intelligent`,
      `understands`, `trained on`, `learns`, `smart assistant`
- [ ] `/ai-assistant` route carries the same disclosure

### 7I. Accessibility and privacy
- [ ] Focus-trapped dialog; `Esc` closes; focus returns to trigger
- [ ] `aria-live="polite"` announcements, batched
- [ ] Fully keyboard operable
- [ ] Never the sole route to any information or action
- [ ] Nothing typed is persisted, transmitted, or logged
- [ ] `client:idle` loading, < 12KB gzipped

## Gate

- [ ] All 8 forms submit successfully to the destination
- [ ] All form checks in `QA_PLAN.md` §4 pass
- [ ] Zero axe violations on every form and the assistant
- [ ] Screen reader verified: error announcement, success announcement, assistant
- [ ] `NO_MATCH` verified with 10+ off-topic inputs — **zero fabricated answers**
- [ ] Zero forbidden capability language site-wide
- [ ] Zero personal data in storage, URLs, or analytics — verified
- [ ] Spam protection functional
- [ ] Zero console errors
