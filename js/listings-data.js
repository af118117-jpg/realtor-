/**
 * SAMPLE PROPERTY DATA — layout scaffolding only.
 * -----------------------------------------------
 * Every record carries `demo: true` and renders a visible "Sample listing" badge.
 * Sample listings are excluded from sitemap.xml, marked noindex, and carry NO
 * RealEstateListing schema. See docs/DATA_MODEL.md §2 and docs/QA_PLAN.md §2.
 *
 * PRICES ARE DELIBERATELY null.
 * Master rule 04 forbids inventing property prices. `null` renders as
 * "Price on application". Real prices arrive with real listings from the client.
 *
 * Localities use the client's real service areas (supplied 2026-09-07):
 * Bahria Town Rawalpindi and DHA Islamabad. Property titles/descriptions below are generic
 * placeholders and make no claim about any actual property in those areas.
 */

const LISTINGS = [
  {
    id: "prop-1",
    slug: "sample-villa-dha-islamabad-p1",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample Villa Listing",
    type: "buy",
    category: "Villa",
    status: "available",
    price: null,
    priceUnit: "total",
    beds: 5,
    baths: 6,
    areaValue: 1,
    areaUnit: "Kanal",
    locality: "DHA Islamabad",
    featured: true,
    listedAt: "2026-09-07",
    image: "assets/images/listings/villa.jpg",
    gallery: ["assets/images/listings/villa.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    id: "prop-2",
    slug: "sample-penthouse-bahria-town-p2",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample Penthouse Listing",
    type: "buy",
    category: "Penthouse",
    status: "available",
    price: null,
    priceUnit: "total",
    beds: 4,
    baths: 5,
    areaValue: 3800,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: true,
    listedAt: "2026-09-06",
    image: "assets/images/listings/penthouse.jpg",
    gallery: ["assets/images/listings/penthouse.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    id: "prop-3",
    slug: "sample-apartment-bahria-town-p3",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample Rental Listing",
    type: "rent",
    category: "Apartment",
    status: "available",
    price: null,
    priceUnit: "per-month",
    beds: 3,
    baths: 3,
    areaValue: 2100,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: true,
    listedAt: "2026-09-05",
    image: "assets/images/listings/apartment.jpg",
    gallery: ["assets/images/listings/apartment.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    id: "prop-4",
    slug: "sample-commercial-dha-islamabad-p4",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample Commercial Listing",
    type: "commercial",
    category: "Commercial Plot",
    status: "available",
    price: null,
    priceUnit: "total",
    beds: null,
    baths: null,
    areaValue: 8,
    areaUnit: "Marla",
    locality: "DHA Islamabad",
    featured: false,
    listedAt: "2026-09-04",
    image: "assets/images/listings/commercial.jpg",
    gallery: ["assets/images/listings/commercial.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    id: "prop-5",
    slug: "sample-house-dha-islamabad-p5",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample House Listing",
    type: "buy",
    category: "House",
    status: "available",
    price: null,
    priceUnit: "total",
    beds: 4,
    baths: 4,
    areaValue: 1,
    areaUnit: "Kanal",
    locality: "DHA Islamabad",
    featured: false,
    listedAt: "2026-09-03",
    image: "assets/images/listings/house.jpg",
    gallery: ["assets/images/listings/house.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    id: "prop-6",
    slug: "sample-studio-bahria-town-p6",
    demo: true,
    title: "[CONTENT REQUIRED] — Sample Studio Listing",
    type: "rent",
    category: "Studio",
    status: "available",
    price: null,
    priceUnit: "per-month",
    beds: 1,
    baths: 1,
    areaValue: 650,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: false,
    listedAt: "2026-09-02",
    image: "assets/images/listings/studio.jpg",
    gallery: ["assets/images/listings/studio.jpg"],
    summary: "Sample listing used for layout only. Replace with a real property.",
  },
];

/**
 * AREA GUIDES — the client's two confirmed service areas.
 * Area names are client-supplied and real. The descriptive copy is NOT yet
 * supplied: any claim about connectivity, amenities, demand, pricing or growth
 * would be fabricated. Blurbs stay [CONTENT REQUIRED] until the client writes
 * or approves them. See docs/LOCAL_SEO_STRATEGY.md §4.
 */
const AREA_GUIDES = [
  {
    name: "Bahria Town Rawalpindi",
    slug: "bahria-town-rawalpindi",
    demo: false,
    blurb: "[CONTENT REQUIRED]",
    description: "[CONTENT REQUIRED]",
    image: "assets/images/listings/apartment.jpg",
  },
  {
    name: "DHA Islamabad",
    slug: "dha-islamabad",
    demo: false,
    blurb: "[CONTENT REQUIRED]",
    description: "[CONTENT REQUIRED]",
    image: "assets/images/listings/villa.jpg",
  },
];
