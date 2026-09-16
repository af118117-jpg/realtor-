/**
 * Idempotent seed: demo properties (kept in sync with js/listings-data.js),
 * default settings, and the first SUPER_ADMIN user. Safe to re-run — `upsert`
 * everywhere, and user creation is skipped if any User row already exists.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugBase } from "../src/lib/slug";

const prisma = new PrismaClient();

// Keep in sync with js/listings-data.js's LISTINGS array.
const DEMO_LISTINGS = [
  {
    propertyId: "PROP-1",
    title: "[CONTENT REQUIRED] — Sample Villa Listing",
    category: "Villa",
    listingType: "SALE" as const,
    beds: 5,
    baths: 6,
    areaValue: 1,
    areaUnit: "Kanal",
    locality: "DHA Islamabad",
    featured: true,
    image: "assets/images/listings/villa.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    propertyId: "PROP-2",
    title: "[CONTENT REQUIRED] — Sample Penthouse Listing",
    category: "Penthouse",
    listingType: "SALE" as const,
    beds: 4,
    baths: 5,
    areaValue: 3800,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: true,
    image: "assets/images/listings/penthouse.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    propertyId: "PROP-3",
    title: "[CONTENT REQUIRED] — Sample Rental Listing",
    category: "Apartment",
    listingType: "RENT" as const,
    beds: 3,
    baths: 3,
    areaValue: 2100,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: true,
    image: "assets/images/listings/apartment.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    propertyId: "PROP-4",
    title: "[CONTENT REQUIRED] — Sample Commercial Listing",
    category: "Commercial Plot",
    listingType: "SALE" as const,
    beds: null,
    baths: null,
    areaValue: 8,
    areaUnit: "Marla",
    locality: "DHA Islamabad",
    featured: false,
    image: "assets/images/listings/commercial.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    propertyId: "PROP-5",
    title: "[CONTENT REQUIRED] — Sample House Listing",
    category: "House",
    listingType: "SALE" as const,
    beds: 4,
    baths: 4,
    areaValue: 1,
    areaUnit: "Kanal",
    locality: "DHA Islamabad",
    featured: false,
    image: "assets/images/listings/house.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
  {
    propertyId: "PROP-6",
    title: "[CONTENT REQUIRED] — Sample Studio Listing",
    category: "Studio",
    listingType: "RENT" as const,
    beds: 1,
    baths: 1,
    areaValue: 650,
    areaUnit: "sq ft",
    locality: "Bahria Town Rawalpindi",
    featured: false,
    image: "assets/images/listings/studio.jpg",
    description: "Sample listing used for layout only. Replace with a real property.",
  },
];

const DEFAULT_SETTINGS = {
  profile: { name: "", email: "" },
  business: {
    siteName: "Realtor Shamraiz",
    phone: "+92 333 6413988",
    phoneSecondary: "+92 309 7371787",
    email: "ranasharisahb27@gmail.com",
    officeAddress: "Plaza Number 164, Office Number 4 & 5, Bahria Town Phase 8 Business District, Rawalpindi West Ridge, Pakistan",
    social: {
      instagram: "https://www.instagram.com/realtor_shamraiz_offical?stkn=NGkxcHdmdjlvMHQy",
      facebook: "https://www.facebook.com/share/1EUnTq5J5T/",
      tiktok: "https://www.tiktok.com/@propertiesbyshamraiz?is_from_webapp=1&sender_device=pc",
      youtube: "https://youtube.com/@propertiesbyshamraiz?si=IoLspndqcBHlCG9m",
    },
    businessHours: { status: "always", customText: "" },
  },
  currency: "PKR",
  currencySymbol: "₨",
  propertyTypes: ["Villa", "House", "Apartment", "Penthouse", "Studio", "Plot", "Commercial Plot", "Office", "Shop"],
  amenities: [
    "Security",
    "Park/Green Belt",
    "Mosque",
    "Gymnasium",
    "Swimming Pool",
    "Backup Generator",
    "Servant Quarter",
    "Lawn",
    "Store Room",
    "Lift",
  ],
  logoMediaId: null as string | null,
};

async function seedListings() {
  for (const listing of DEMO_LISTINGS) {
    const property = await prisma.property.upsert({
      where: { referenceCode: listing.propertyId },
      create: {
        referenceCode: listing.propertyId,
        title: listing.title,
        slug: `${slugBase(listing.title)}-${listing.propertyId.toLowerCase()}`,
        propertyType: listing.category,
        listingType: listing.listingType,
        description: listing.description,
        currency: "PKR",
        area: listing.areaValue,
        areaUnit: listing.areaUnit,
        bedrooms: listing.beds,
        bathrooms: listing.baths,
        location: listing.locality,
        city: listing.locality.includes("Rawalpindi") ? "Rawalpindi" : "Islamabad",
        status: "ACTIVE",
        featured: listing.featured,
        fromPublicSample: true,
      },
      update: {}, // never overwrite admin edits to a previously-seeded row
    });

    const existingImage = await prisma.propertyMedia.findFirst({ where: { propertyId: property.id, type: "IMAGE" } });
    if (!existingImage) {
      await prisma.propertyMedia.create({
        data: {
          propertyId: property.id,
          type: "IMAGE",
          url: listing.image,
          altText: listing.title,
          isFeatured: true,
          sortOrder: 0,
        },
      });
    }
  }
  console.log(`Seeded ${DEMO_LISTINGS.length} demo properties.`);
}

async function seedSettings() {
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, data: DEFAULT_SETTINGS },
    update: {}, // never overwrite settings an admin has already changed
  });
  console.log("Seeded default settings.");
}

async function seedAdminUser() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("A user already exists — skipping admin seed.");
    return;
  }

  const { SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (in server/.env) to seed the first admin user. " +
        "Refusing to create one with a guessable default password.",
    );
  }
  const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
  }
  if (SEED_ADMIN_PASSWORD.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      name: SEED_ADMIN_NAME?.trim() || SEED_ADMIN_USERNAME?.trim() || email.split("@")[0],
      email,
      username: SEED_ADMIN_USERNAME?.trim() || null,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Seeded SUPER_ADMIN user "${email}".`);
}

async function main() {
  await seedListings();
  await seedSettings();
  await seedAdminUser();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
