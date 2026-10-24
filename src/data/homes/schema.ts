import type { HomeMicrosite } from "./types";
import { homeBase } from "./links";

/** Accommodation with a full postal address and geo point. No Offer: prices are not confirmed. */
export const homeSchema = (home: HomeMicrosite) => {
  const url = new URL(homeBase(home), "https://mtcottages.com").toString();
  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    "@id": `${url}#home`,
    name: home.name,
    description: home.summary,
    url,
    numberOfBedrooms: home.bedrooms,
    ...(home.bathrooms !== undefined && { numberOfBathroomsTotal: home.bathrooms }),
    ...(home.sleeps !== undefined && { occupancy: { "@type": "QuantitativeValue", maxValue: home.sleeps } }),
    address: {
      "@type": "PostalAddress",
      streetAddress: home.address.streetAddress,
      addressLocality: home.address.locality,
      addressRegion: home.address.region,
      postalCode: home.address.postalCode,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: home.address.lat, longitude: home.address.lng },
    containedInPlace: { "@type": "Place", name: "Mid-Ohio Valley" },
  };
};
