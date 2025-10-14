/**
 * SEO Keywords for Freedom Aviation
 * Structured keywords for Colorado Front Range aircraft management
 */

export const SEO_KEYWORDS = {
  // Core Services
  services: [
    "aircraft management",
    "aircraft detailing",
    "flight instruction",
    "pilot development",
    "aircraft maintenance coordination",
    "hangar services",
    "fuel management",
    "aircraft concierge"
  ],
  
  // Service Modifiers
  modifiers: [
    "premium",
    "owner-operator",
    "Colorado",
    "Front Range",
    "Centennial Airport",
    "KAPA",
    "professional",
    "transparent pricing"
  ],
  
  // Front Range Airports
  airports: [
    "KAPA", // Centennial
    "KBJC", // Rocky Mountain Metropolitan (Jeffco)
    "KFTG", // Front Range
    "KDEN", // Denver International
    "KCOS", // Colorado Springs
    "KBDU", // Boulder
    "KFNL", // Fort Collins-Loveland
    "KGXY"  // Greeley-Weld County
  ],
  
  // Partner Facilities
  partners: [
    "Sky Harbour",
    "Sky Harbour @ KAPA",
    "Freedom Aviation Hangar",
    "Fox 9 Hangar"
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
    "Colorado hangar services"
  ]
} as const;

/**
 * Generate combined keywords for meta tags
 */
export function allKeywords(): string {
  const { services, modifiers, airports, partners, longTail } = SEO_KEYWORDS;
  return [
    ...services,
    ...modifiers,
    ...airports.map(code => code.toLowerCase()),
    ...partners,
    ...longTail
  ].join(", ");
}

/**
 * Get airport-specific keywords
 */
export function airportKeywords(airportCode?: string): string {
  const base = [...SEO_KEYWORDS.services, ...SEO_KEYWORDS.modifiers];
  if (airportCode && SEO_KEYWORDS.airports.includes(airportCode.toUpperCase())) {
    return [...base, airportCode, `${airportCode} aircraft services`].join(", ");
  }
  return base.join(", ");
}

/**
 * Get location-specific keywords
 */
export function locationKeywords(location?: string): string {
  const base = [...SEO_KEYWORDS.services, ...SEO_KEYWORDS.modifiers];
  if (location) {
    const partner = SEO_KEYWORDS.partners.find(p => 
      p.toLowerCase().includes(location.toLowerCase())
    );
    if (partner) {
      return [...base, partner, `${partner} aircraft management`].join(", ");
    }
  }
  return base.join(", ");
}
