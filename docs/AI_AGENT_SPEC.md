# AI AGENT SPEC — REALTOR SHAMRAIZ CONCIERGE

**Last updated:** 2026-09-08

---

## 1. What it actually is

A **rule-based, scripted assistant.** It matches visitor input against a fixed
set of intents defined in `src/data/concierge-intents.ts` and returns
pre-authored responses. It then routes the visitor to a human.

**It is not an LLM. It does not generate text. It does not understand language.
It does not reason.**

## 2. Disclosure — non-negotiable

This is the single most important constraint in the project. Overstating this
feature would be a false claim about the client's business.

**Required disclosure, shown persistently in the assistant UI header:**

> *Automated assistant — answers come from a set list of common questions.
> For anything else, [name] will help you personally.*

**Permitted descriptions anywhere on the site:**
- "Instant property assistant"
- "Guided property finder"
- "Automated assistant"
- "Quick answers to common questions"

**Forbidden descriptions:**
- ❌ "AI-powered" / "Powered by AI"
- ❌ "Understands your needs"
- ❌ "Intelligent" / "Smart assistant"
- ❌ "Chat with our AI"
- ❌ "Trained on…" / "Learns from…"
- ❌ Anything implying comprehension, generation, or personalised reasoning

**If** a genuine LLM backend is built and deployed later, this section is
rewritten *at that point* — and the accompanying disclosures (model provider,
data handling, hallucination risk) are added. Not before.

> ⚠️ **Naming note:** the route `/ai-assistant` and the name "AI Concierge" come
> from the master requirements. If retained, the disclosure above is mandatory
> everywhere the feature appears, because the name alone implies more capability
> than the feature has. **Recommendation:** rename to "Property Assistant"
> (`/property-assistant`) so the name matches reality. This needs a client decision.

## 3. Capabilities

**It can:**
- Route a visitor to the right page by intent (buy / sell / rent / invest)
- Ask 2–4 qualifying questions from a fixed set
- Filter and surface matching properties from the listings data
- Answer questions that exist in the FAQ data
- Hand off to WhatsApp, phone, or a form, carrying collected context

**It cannot, and must never appear to:**
- Answer questions outside its intent set
- Provide valuations, price estimates, or market predictions
- Give legal, tax, or financial advice
- Negotiate, or commit the client to anything
- Confirm availability, viewing times, or terms
- Invent any business fact

## 4. Conversation model

```
OPEN
 └─ Disclosure banner (persistent, not dismissible)
 └─ Intent chips: [Buying] [Selling] [Renting] [Investing] [Something else]

QUALIFY  (max 4 questions, each with preset options + free-text fallback)
 ├─ Buying   → locality? · budget band? · property type? · bedrooms?
 ├─ Selling  → locality? · property type? · timeline?
 ├─ Renting  → locality? · budget band? · move-in timeline?
 └─ Investing→ locality? · budget band? · horizon?

RESULT
 ├─ Matching listings (from real data) + link to filtered /properties
 ├─ Or the relevant FAQ answer
 └─ Or → NO_MATCH

HANDOFF  (always available, from any state)
 └─ [WhatsApp with context] [Call] [Send an enquiry]

NO_MATCH
 └─ "I don't have an answer for that one. [name] can help — here's how to reach them."
    → HANDOFF
```

## 5. Matching algorithm

1. Normalise input: lowercase, strip punctuation, collapse whitespace.
2. Score each intent by matched `patterns` (whole-word matching; longer patterns
   weighted higher).
3. If top score ≥ threshold **and** clearly ahead of second place → return that intent.
4. If two intents are close → ask a disambiguating question, do not guess.
5. If no intent clears the threshold → `NO_MATCH` fallback.

**There is no fuzzy semantic layer and no fallback text generation.** Step 5 is
the only path for unrecognised input, and it never fabricates an answer.

## 6. Property matching

When qualifying answers are collected, the assistant applies them as filters
against `listings.ts` and returns up to 3 real matches, each with a link to its
detail page.

- Zero matches → **"I don't currently have verified live inventory for that
  request."** (master requirements §29) — never a softer phrasing that implies
  the assistant searched harder than it did. Followed by the handoff offer.
  This is distinct from the FAQ `NO_MATCH` copy in §4 — that one is for
  unrecognised questions, this one is for a real search that came back empty.
- `demo: true` listings shown by the assistant carry the "Sample listing" badge.
- The assistant never describes a property in terms not present in its data.
- See `DATA_MODEL.md` §11 for how the assistant must categorise every claim it
  makes (FACT / ESTIMATE / GENERAL INFORMATION / USER-PROVIDED INFORMATION —
  master requirements §30) and §5 for the closed intent enum (§28) that
  `concierge-intents.ts` rows are keyed on.

## 7. Handoff payload

WhatsApp deep link is pre-filled with the collected context, for example:

```
Hi [name], I'm looking to buy in [locality].
Budget: [band]. Type: [type]. Bedrooms: [n].
(Sent from your website assistant)
```

Nothing is sent anywhere until the visitor taps the handoff button. The
assistant transmits no data on its own.

## 8. Accessibility

- Trigger button is a real `<button>` with an accessible name.
- Panel is a focus-trapped dialog; `Esc` closes and returns focus to the trigger.
- New messages announced via `aria-live="polite"`.
- Intent chips are real buttons, keyboard-reachable, in logical tab order.
- Fully operable by keyboard alone; visible focus at every step.
- Respects `prefers-reduced-motion`.
- Not the sole route to any information or action.

## 9. Privacy

- Nothing typed into the assistant is persisted, transmitted, or logged.
- No analytics events carry assistant content.
- Only `rs:concierge-dismissed` (a boolean) touches storage.
- The disclosure states that the conversation stays in the browser.

## 10. Performance

- Loaded as a `client:idle` island — never blocks first paint.
- Intent data is small and inlined; no network request to open the assistant.
- Target: < 12KB gzipped JS + data.

## 11. QA gate

The assistant does not ship until:
- [ ] Disclosure copy present, accurate, and persistent
- [ ] No forbidden capability language anywhere on the site
- [ ] `NO_MATCH` path verified with 10+ off-topic inputs — zero fabricated answers
- [ ] All handoff paths functional
- [ ] Full keyboard operation verified
- [ ] Screen reader announcement verified
- [ ] Property matches verified against source data
- [ ] Zero console errors
