# CLIENT-SUPPLIED SOURCE COPY & FACTS

**Purpose:** traceability. Every factual claim on the site must trace to a
client-supplied source (`QA_PLAN.md` §2). This file is that source record.

---

## Submission 1 — 2026-09-07

### Verbatim as supplied

> Deal with us and enjoy added benefits, including complete transparency and
> properly documented transactions for your peace of mind.
>
> We offer some of the finest luxury designer properties in Bahria Town and DHA
> Islamabad, featuring breathtaking architecture, elegant designs and superior
> quality finishes.
>
> Experience the ultimate blend of style, sophistication, and modern living.
>
> For site visits or to explore more exclusive options, please contact:
>
> 📞 +92 333 6413988 | +92 309 7371787

### Facts extracted → applied to `js/config.js`

| Fact | Value | Applied |
|---|---|---|
| Service areas | Bahria Town · DHA Islamabad | ✅ `serviceAreas` |
| City | Islamabad | ✅ `city` — derived from "DHA Islamabad" |
| Phone (primary) | +92 333 6413988 | ✅ `phone` |
| Phone (secondary) | +92 309 7371787 | ✅ `phoneSecondary` |
| Currency | PKR | ✅ Inferred from Pakistan coverage — confirm display convention |

**Correction applied:** the previous config listed **Lahore** and four Lahore
localities. Those were fabricated and are now removed. Sample listing localities
were updated to the two real service areas.

### Positioning themes usable in copy

Directly supported by the client's own words:

- Transparency in dealings
- Properly documented transactions
- Luxury / designer properties
- Architecture, design, and finish quality
- Style, sophistication, modern living
- Site visits offered
- "Exclusive options" beyond what is publicly listed

These map cleanly onto the brand qualities in `PROJECT_BRIEF.md` §4 —
particularly **Transparency**, **Luxury**, and **Local Expertise**.

### ⚠️ Claims requiring care

| Claim | Issue | Handling |
|---|---|---|
| "some of the finest luxury designer properties" | Unverifiable superlative | Acceptable as marketing voice. **Not** to be restated as a factual/schema claim, and never as "the finest" or "award-winning" |
| "breathtaking architecture, elegant designs, superior quality finishes" | Describes specific properties | Usable as general positioning. **Only** applied to an individual listing if that property genuinely has those features |
| "complete transparency", "properly documented transactions" | A service promise the client makes | Usable verbatim. Should be substantiated by a visible process explanation on `/services` and `/buy` |
| "peace of mind" | Benefit framing | Fine |

### Still `[CONTENT REQUIRED]` after this submission

| Item | Blocks | Note |
|---|---|---|
| Full display name | About, schema, entity statement, every CTA | Brand is "Realtor Shamraiz". **No surname supplied — do not guess** |
| Professional title | About, schema | |
| Brokerage / agency name | Trust, schema, footer | |
| License / registration no. | Trust, legal display | |
| **WhatsApp number** | Every WhatsApp CTA site-wide | **Not stated.** Do not assume either phone is on WhatsApp |
| Which phone is primary | CTA ordering | Both applied; order unconfirmed |
| Email | Contact, forms | |
| Office address | `/contact`, LocalBusiness schema | Also: is it public? |
| Geo coordinates | LocalBusiness schema, map | |
| Business hours | `/contact`, schema, assistant | |
| Response time | Every form success screen | Must be realistic |
| Domain | Canonicals, sitemap, OG | |
| Exact phases/sectors covered | Area guides, local SEO | e.g. which DHA phases, which Bahria blocks |
| Real listings | `/properties`, listing schema | Sample listings carry `price: null` until then |
| Area guide copy | Area guides, local SEO | Any claim about amenities, demand, or pricing must come from the client |
| Photography | Hero, listings, About | |
| Testimonials | Trust sections | Genuine and attributable, or the section does not ship |

---

## Submission 2 — 2026-09-11

### Verbatim as supplied

> Instagram: https://www.instagram.com/realtor_shamraiz_offical?stkn=NGkxcHdmdjlvMHQy
>
> Facebook: https://www.facebook.com/share/1EUnTq5J5T/
>
> TikTok: https://www.tiktok.com/@propertiesbyshamraiz?is_from_webapp=1&sender_device=pc
>
> YouTube: https://youtube.com/@propertiesbyshamraiz?si=IoLspndqcBHlCG9m
>
> Email: ranasharisahb27@gmail.com
>
> Address: Plaza Number 164, Office Number 4 & 5, Bahria Town Phase 8 Business
> District, Rawalpindi West Ridge, Pakistan
>
> Business Hours: Always Open

### Facts extracted → applied to `js/config.js`

| Fact | Value | Applied |
|---|---|---|
| Instagram | supplied URL | ✅ `social.instagram` |
| Facebook | supplied URL | ✅ `social.facebook` |
| TikTok | supplied URL | ✅ `social.tiktok` |
| YouTube | supplied URL (supersedes the 2026-09-08 channel URL — same channel) | ✅ `social.youtube` |
| Email | ranasharisahb27@gmail.com | ✅ `email` |
| Office address | supplied address | ✅ `officeAddress` |
| Business hours | Always Open | ✅ `businessHours: { status: "always" }` — resolved to the display string "Always Open" via `formatBusinessHours()`, never a fabricated closing time |

LinkedIn was not supplied and stays blank (icon auto-hides). `city` still was
not stated directly in this submission and remains `[CONTENT REQUIRED]`.

---

## Source log

| Date | Source | Recorded in |
|---|---|---|
| 2026-09-07 | Client message — marketing copy + contact numbers | Submission 1 above |
| 2026-09-11 | Client message — social links, email, office address, business hours | Submission 2 above |
