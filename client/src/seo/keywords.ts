/**
 * SEO Keywords for Freedom Aviation
 * Structured keywords for Colorado Front Range aircraft management
 * Optimized for local search and competitive positioning
 */

export const SEO_KEYWORDS = {
  // Brand Names (Primary)
  brand: [
    "Freedom Aviation",
    "Freedom Aviation Colorado",
    "Freedom Aviation KAPA",
    "Freedom Aviation Centennial",
    "FreedomAviation",
    "Freedom Aviation Co"
  ],

  // Competitive Keywords
  competitive: [
    "Independence Aviation alternative",
    "better than Independence Aviation",
    "aircraft management Centennial",
    "KAPA aircraft management",
    "Colorado aircraft management services"
  ],

  // Core Services
  services: [
    "aircraft management",
    "aircraft detailing",
    "flight instruction",
    "pilot development",
    "aircraft maintenance coordination",
    "hangar services",
    "fuel management",
    "aircraft concierge",
    "aviation management",
    "plane management",
    "airplane management",
    "aircraft care services",
    "private aircraft management"
  ],
  
  // Location-Specific
  locations: [
    "Centennial Airport",
    "KAPA",
    "Centennial Colorado",
    "Englewood Colorado aviation",
    "Denver area aircraft management",
    "Colorado aviation services",
    "Front Range aviation",
    "Denver metro aviation",
    "Arapahoe County airport",
    "Centennial Airport Colorado"
  ],

  // Service Modifiers
  modifiers: [
    "premium",
    "owner-operator",
    "Colorado",
    "Front Range",
    "professional",
    "transparent pricing",
    "full-service",
    "comprehensive",
    "expert",
    "certified",
    "trusted"
  ],
  
  // Front Range Airports (SEO expansion)
  airports: [
    "KAPA Centennial",
    "KBJC Rocky Mountain Metropolitan",
    "KFTG Front Range Airport",
    "KDEN Denver International",
    "KCOS Colorado Springs",
    "KBDU Boulder",
    "KFNL Fort Collins Loveland",
    "KGXY Greeley Weld County",
    "Centennial Airport services",
    "Rocky Mountain Metropolitan Airport"
  ],
  
  // Partner Facilities
  partners: [
    "Sky Harbour",
    "Sky Harbour KAPA",
    "Freedom Aviation Hangar",
    "Fox 9 Hangar Centennial"
  ],
  
  // Aircraft Types (for long-tail SEO)
  aircraftTypes: [
    "Cirrus SR22 management",
    "Cessna management Colorado",
    "Bonanza aircraft management",
    "Piper aircraft services",
    "turbine aircraft management",
    "high performance aircraft",
    "single engine management",
    "multi engine management"
  ],

  // Service-specific long-tail keywords
  longTail: [
    "aircraft management Colorado",
    "Centennial Airport aircraft services",
    "KAPA aircraft management",
    "Colorado aircraft detailing",
    "Front Range flight instruction",
    "owner-operator aircraft management",
    "transparent aircraft management pricing",
    "Colorado hangar services",
    "aircraft management near me",
    "best aircraft management Colorado",
    "Centennial Airport hangar",
    "Denver aircraft management",
    "Colorado Springs aircraft services",
    "professional aircraft care Colorado",
    "aircraft concierge services Denver",
    "full service aircraft management KAPA",
    "Centennial Airport flight instruction",
    "Colorado pilot services",
    "aircraft maintenance coordination Denver"
  ]
} as const;

/**
 * Generate combined keywords for meta tags
 */
export function allKeywords(): string {
  const { brand, services, locations, modifiers, longTail } = SEO_KEYWORDS;
  return [
    ...brand,
    ...services,
    ...locations,
    ...modifiers,
    ...longTail
  ].join(", ");
}

/**
 * Get brand-focused keywords (for homepage and main pages)
 */
export function brandKeywords(): string {
  const { brand, locations, services, competitive } = SEO_KEYWORDS;
  return [
    ...brand,
    ...competitive,
    ...locations.slice(0, 5), // Top 5 locations
    ...services.slice(0, 8)    // Top 8 services
  ].join(", ");
}

/**
 * Get airport-specific keywords
 */
export function airportKeywords(airportCode?: string): string {
  const { brand, services, modifiers, airports } = SEO_KEYWORDS;
  const base = [...brand.slice(0, 2), ...services.slice(0, 5), ...modifiers.slice(0, 5)];
  
  if (airportCode) {
    const upperCode = airportCode.toUpperCase();
    const matchingAirport = airports.find(a => a.includes(upperCode));
    if (matchingAirport) {
      return [...base, matchingAirport, `${upperCode} aircraft services`].join(", ");
    }
  }
  return base.join(", ");
}

/**
 * Get location-specific keywords
 */
export function locationKeywords(location?: string): string {
  const { brand, services, locations, modifiers } = SEO_KEYWORDS;
  const base = [...brand.slice(0, 2), ...services.slice(0, 8), ...modifiers.slice(0, 5)];
  
  if (location) {
    const partner = SEO_KEYWORDS.partners.find(p => 
      p.toLowerCase().includes(location.toLowerCase())
    );
    if (partner) {
      return [...base, partner, `${partner} aircraft management`].join(", ");
    }
    // Add general location keywords
    return [...base, ...locations.slice(0, 5)].join(", ");
  }
  return base.join(", ");
}

/**
 * Get competitive positioning keywords
 */
export function competitiveKeywords(): string {
  const { brand, competitive, locations, services } = SEO_KEYWORDS;
  return [
    ...brand,
    ...competitive,
    ...locations.slice(0, 3),
    ...services.slice(0, 5)
  ].join(", ");
}
