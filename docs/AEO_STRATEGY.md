# AEO STRATEGY — ANSWER ENGINE OPTIMISATION

**Last updated:** 2026-09-07

Optimising to be **cited** by answer engines — Google AI Overviews, ChatGPT
search, Perplexity, Copilot, Gemini — not merely ranked by them.

---

## 1. How AEO differs from SEO

| | SEO | AEO |
|---|---|---|
| Goal | Rank a page | Be quoted as the answer |
| Unit | Page | Passage |
| Success | Click | Citation (click optional) |
| Format | Comprehensive | Extractable, self-contained |
| Wins | Best overall page | Clearest, most attributable statement |

A page can rank well and never be cited, because its answers are buried in
narrative prose. AEO is largely a *content-shape* problem.

## 2. Core principle — the answer-first block

Every page and article opens with a self-contained, extractable answer.

**Pattern:**
```
<h2>How long does it take to sell a property in [city]?</h2>
<p><strong>Most properties in [city] sell within [CONTENT REQUIRED].</strong>
   The timeline depends on pricing accuracy, property condition, and locality
   demand. Correctly priced properties in high-demand areas move fastest.</p>
[ then the detail, the nuance, the exceptions ]
```

Rules:
- 40–60 words, standing alone without surrounding context
- Direct answer in the **first sentence**
- Question phrased as the user would ask it, as a heading
- No "it depends" opener — give the answer, then qualify it
- No pronouns referring outside the block (an extracted passage loses its antecedent)

## 3. Content formats that get cited

| Format | Why it works | Where |
|---|---|---|
| Q&A blocks | Directly matches query shape | `/faq`, landing pages, articles |
| Definition blocks | Cleanly extractable | Glossary terms across content |
| Numbered processes | Answers "how do I…" | `/buy`, `/sell`, guides |
| Comparison tables | Answers "X vs Y" | Area guides, property types |
| Checklists | Answers "what do I need…" | Buying/selling guides |
| Specific data points | Highly citable — **when real** | Market insights (client-supplied only) |

## 4. FAQ architecture

The FAQ data (`src/data/faq.ts`) is the AEO backbone: authored once, surfaced in
four places — `/faq`, landing-page FAQ blocks, `FAQPage` JSON-LD, and the
concierge knowledge base.

### Question set (structure committed; answers `[CONTENT REQUIRED]` where factual)

**Buyers** — How do I start buying in [city]? · What documents do I need? · How
much deposit is typical? · What are the total costs beyond the price? · How long
does purchase take? · Should I buy a plot or a built property?

**Sellers** — How do I know what my property is worth? · What does a realtor
actually do? · What are the fees? · How long will it take to sell? · What should
I fix before listing? · Do I need to be present for viewings?

**Investors** — What makes a good investment area? · What is rental yield and
how is it calculated? · Plot vs. rental property? · What is a realistic holding
period? · What are the main risks?

**Landlords** — How do I find reliable tenants? · What is a fair rent? · What
should a tenancy agreement cover? · How is the deposit handled?

**General** — What areas do you cover? · How do I contact you? · What are your
hours? · Do you charge for an initial consultation?

**Answer rule:** questions about fees, timelines, deposits, yields, and costs are
factual claims about this business and this market. They are `[CONTENT REQUIRED]`
until the client supplies them. A plausible-sounding invented answer is worse
than no answer — it can be cited and attributed to the client.

## 5. Entity clarity

Answer engines cite sources they can identify with confidence.

- **Consistent naming:** the agent's name, brokerage, and city are written
  identically everywhere, sourced from `config.ts`.
- **Explicit self-description** on `/about`, in plain extractable prose:
  *"[name] is a real estate agent based in [city], specialising in [areas],
  working with buyers, sellers, investors, and landlords."*
- **`Person` + `RealEstateAgent` schema** linking name, role, area served, and contact.
- **`sameAs`** links to real, active social profiles only.
- **NAP consistency** — name, address, phone identical here and on every external profile.

## 6. Attribution-friendly authoring

- Real author byline with a link to `/about`
- Visible `publishedAt` and `updatedAt` dates
- Statements attributable to a named person, not a faceless brand
- Sources cited for any external claim
- Clear scope statements ("in [city]", "as of [date]") so extracted passages
  carry their own qualifiers

## 7. Technical enablement

- Fully rendered HTML — most answer-engine crawlers do not execute JavaScript
- Clean semantic structure (`article`, `section`, real headings)
- `FAQPage` and `Article` JSON-LD matching visible content exactly
- Fast responses and no crawl blocks on `robots.txt`
- Stable URLs — a citation to a moved page is a lost citation

## 8. What NOT to do

- ❌ Invent statistics to look citable. A fabricated figure that gets cited is
  attributed to the client as a factual claim — the worst possible outcome.
- ❌ Mark up Q&A that is not visible on the page.
- ❌ Write hedge-everything answers that extract into nothing.
- ❌ Keyword-stuff questions.
- ❌ Publish thin content purely to hold a question.

## 9. Measurement

AEO measurement is immature; use direct observation.

- Manually query target questions in AI Overviews, ChatGPT, Perplexity, and
  Copilot monthly; record whether the site is cited
- Watch for referral traffic from answer-engine domains
- Track rising impressions with falling CTR on informational queries — a
  fingerprint of being answered without the click
- Monitor branded-search volume as an authority proxy
