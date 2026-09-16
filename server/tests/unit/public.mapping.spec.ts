import { isSpamSubmission, publicStatus, publicType } from "../../src/modules/public/public.service";

describe("publicType", () => {
  it("buckets a commercial-sounding category as commercial regardless of listingType", () => {
    expect(publicType("Commercial Plot", "SALE")).toBe("commercial");
    expect(publicType("Office", "RENT")).toBe("commercial");
    expect(publicType("Shop", "SALE")).toBe("commercial");
  });

  it("falls back to buy/rent from listingType otherwise", () => {
    expect(publicType("Villa", "SALE")).toBe("buy");
    expect(publicType("Apartment", "RENT")).toBe("rent");
    expect(publicType(null, "SALE")).toBe("buy");
  });
});

describe("publicStatus", () => {
  it("maps SOLD/RENTED explicitly and defaults everything else to available", () => {
    expect(publicStatus("SOLD")).toBe("sold");
    expect(publicStatus("RENTED")).toBe("rented");
    expect(publicStatus("ACTIVE")).toBe("available");
  });
});

describe("isSpamSubmission", () => {
  it("flags a filled honeypot field", () => {
    expect(isSpamSubmission({ company: "I am a bot" })).toBe(true);
  });

  it("flags a submission rendered and submitted too quickly", () => {
    expect(isSpamSubmission({ renderedAt: Date.now() - 100 })).toBe(true);
  });

  it("accepts a normal, human-paced, honeypot-empty submission", () => {
    expect(isSpamSubmission({ company: "", renderedAt: Date.now() - 10_000 })).toBe(false);
  });

  it("accepts a submission with no renderedAt at all", () => {
    expect(isSpamSubmission({ company: "" })).toBe(false);
  });
});
