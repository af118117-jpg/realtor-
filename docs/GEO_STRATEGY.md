# GEO STRATEGY — GENERATIVE ENGINE OPTIMISATION

**Last updated:** 2026-09-07

Positioning the site to be surfaced, understood, and accurately represented by
generative AI systems that synthesise rather than link.

> **Terminology note:** "GEO" is used here in the master requirements sense of
> *Generative Engine Optimisation*. Geographic/local targeting is covered
> separately in `LOCAL_SEO_STRATEGY.md`.

---

## 1. The shift

Generative engines don't return a ranked list — they build an answer from
multiple sources and mention some of them. Optimising for this means being:

1. **Ingestible** — easy to crawl and parse
2. **Unambiguous** — entities and facts are clearly stated
3. **Verifiable** — claims are attributable and consistent
4. **Distinctive** — offering something not available from every competitor
5. **Current** — dated and maintained

## 2. Ingestibility

| Requirement | Implementation |
|---|---|
| No JS dependency for content | Static pre-rendered HTML |
| Clean semantic structure | `article`, `section`, `nav`, real heading hierarchy |
| No content behind interaction | Accordions render content in the DOM; tabs do not lazy-load text |
| Crawlable navigation | Real `<a href>` links, no JS-only routing |
| Machine-readable summary | `description` meta + summary block per page |
| Stable, descriptive URLs | Per `INFORMATION_ARCHITECTURE.md` §3 |
| Full sitemap | Generated at build |
| Permissive robots for AI crawlers | Decision required — see §7 |

## 3. Entity disambiguation

Generative systems must be able to answer *"who is this?"* without guessing.

**Canonical entity statement** — appears verbatim on `/about`, mirrored in
schema, and consistent with every external profile:

> *[agentName] is a real estate agent based in [city], operating under
> [brokerage], serving [service areas]. [They] work with buyers, sellers,
> investors, and landlords across residential and commercial property.*

Reinforcement:
- `RealEstateAgent` + `Person` JSON-LD with matching values
- `sameAs` to real profiles only
- Identical NAP everywhere, sourced from `config.ts`
- One canonical spelling of the name — no variants

**Current blocker:** the entity statement cannot be finalised while name,
brokerage, city, and service areas are `[CONTENT REQUIRED]`.

## 4. Fact reliability

Generative engines increasingly weight source consistency and verifiability. The
project's content-integrity rules are therefore also its GEO strategy.

- Every factual claim traces to a client-verified source
- No unattributed statistics
- Claims scoped with place and time ("in [city], as of [date]")
- `updatedAt` dates maintained
- Contradictions between pages treated as defects — one fact, one source, many surfaces

**A fabricated fact that a generative engine ingests becomes a persistent false
claim about the client's business, repeated to people who never visit the site
and never see a correction.** This is the strongest practical argument for the
`[CONTENT REQUIRED]` policy.

## 5. Distinctiveness

Generic content gets synthesised away; specificity gets cited.

| Generic (invisible) | Distinctive (citable) |
|---|---|
| "We offer excellent service" | A documented, step-by-step process for what actually happens |
| "Great locations" | Area guides with named, specific characteristics |
| "Competitive fees" | A transparent explanation of the fee structure |
| "Years of experience" | First-hand, specific observations only a practitioner would make |

Content that only this agent could write is the content that earns mention.

## 6. Structured knowledge surfaces

| Surface | Function |
|---|---|
| `/about` | Entity definition |
| `/services` | Capability enumeration |
| `/faq` | Direct Q&A pairs |
| Area guides | Geographic expertise |
| `/market-insights` | Analytical authority (real data only) |
| `/blog` | Process and guidance depth |
| JSON-LD across all | Machine-readable mirror of the above |

## 7. AI crawler policy — ⚠️ client decision required

Whether to allow AI training and retrieval crawlers is a business decision, not
a technical default.

| Crawler | Purpose | Recommendation |
|---|---|---|
| `GPTBot` | OpenAI training | **Allow** — visibility outweighs the cost for a local service business |
| `OAI-SearchBot` | ChatGPT search | **Allow** |
| `ChatGPT-User` | User-initiated fetch | **Allow** |
| `PerplexityBot` | Perplexity | **Allow** |
| `ClaudeBot` | Anthropic | **Allow** |
| `Google-Extended` | Gemini / AI Overviews | **Allow** |
| `CCBot` | Common Crawl | Client's call — broad, unattributed reuse |

Rationale for allowing: a local real-estate business benefits from being
discoverable and quotable. There is no proprietary content to protect, and
blocking these crawlers removes the site from exactly the surfaces this strategy
targets. **Requires client sign-off before `robots.txt` is written.**

## 8. Measurement

- Monthly manual probes: "who is a real estate agent in [city]?", "how do I sell
  a property in [locality]?" across ChatGPT, Perplexity, Gemini, Copilot
- Record: mentioned? accurately? with a link?
- **Correct any inaccurate representation at the source** — fix the on-site fact,
  ensure consistency across external profiles, then re-probe
- Track referrals from generative-engine domains
- Track branded search volume
