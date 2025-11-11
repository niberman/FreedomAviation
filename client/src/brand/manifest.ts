/**
 * Freedom Aviation Brand Manifest
 * Central source of truth for company information
 */

export const BRAND = {
  name: "Freedom Aviation",
  tagline: "Colorado-Based. Front Range Focused.",
  phone: "(970) 618-2094",
  email: "info@freedomaviationco.com",
  address: "7565 S Peoria St, Englewood, CO 80112",
  mailing: "2500 Meadow Ave, Boulder, CO 80304",
  website: "https://www.freedomaviationco.com",

  // Social & Marketing
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },

  // Business Details
  operatingHours: "By Appointment",
  serviceArea: "Colorado Front Range",
  baseAirport: "KAPA (Centennial Airport)",

  // Hangar Partners
  partners: {
    skyHarbour: {
      name: "Sky Harbour @ KAPA",
      monthlyCost: 2000,
      description: "Premium hangar facility at Centennial Airport",
    },
    faHangar: {
      name: "Freedom Aviation Hangar (Fox 9)",
      monthlyCost: undefined, // Dynamic pricing - contact for quote
      description: "Our dedicated hangar facility",
    },
  },
} as const;

export type BrandInfo = typeof BRAND;
