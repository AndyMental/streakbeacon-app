import { getBaseUrl } from "./base-url";

export type SoftwareApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: "ProductivityApplication";
  operatingSystem: "Web";
  url: string;
  offers: {
    "@type": "Offer";
    price: "0";
    priceCurrency: "USD";
  };
};

export function buildSoftwareApplicationJsonLd(
  baseUrl: string = getBaseUrl()
): SoftwareApplicationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StreakBeacon",
    description:
      "Local-first streak tracking for habits that need visibility.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: new URL("/", baseUrl).toString(),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };
}
