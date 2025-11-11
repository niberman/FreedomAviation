/**
 * Local SEO Utilities for Freedom Aviation
 * Optimized for Colorado Front Range visibility
 */

import { BRAND } from "@/brand/manifest";
import { SEO_KEYWORDS } from "./keywords";

/**
 * Generate location-specific page title
 */
export function getLocalizedTitle(baseTitle: string, includeLocation = true): string {
  if (includeLocation) {
    return `${baseTitle} | Freedom Aviation - Centennial Airport Colorado`;
  }
  return `${baseTitle} | Freedom Aviation`;
}

/**
 * Generate location-rich meta description
 */
export function getLocalizedDescription(
  service: string,
  includeCallToAction = true
): string {
  const base = `Freedom Aviation provides ${service} at Centennial Airport (KAPA) Colorado. Professional, transparent service for aircraft owners across the Denver metro and Front Range.`;
  
  if (includeCallToAction) {
    return `${base} Call (970) 618-2094 for a personalized quote.`;
  }
  
  return base;
}

/**
 * Generate airport-specific content snippets for SEO
 */
export function getAirportServiceContent(airportCode: string): {
  heading: string;
  description: string;
} {
  const airportNames: Record<string, string> = {
    KAPA: "Centennial Airport",
    KBJC: "Rocky Mountain Metropolitan Airport",
    KFTG: "Front Range Airport",
    KDEN: "Denver International Airport",
    KCOS: "Colorado Springs Airport",
    KBDU: "Boulder Municipal Airport",
    KFNL: "Fort Collins-Loveland Airport",
    KGXY: "Greeley-Weld County Airport"
  };

  const name = airportNames[airportCode] || airportCode;

  return {
    heading: `Aircraft Management Services at ${name} (${airportCode})`,
    description: `Freedom Aviation provides comprehensive aircraft management services for ${name} (${airportCode}) based aircraft. Our team at Centennial Airport can coordinate services throughout the Colorado Front Range, ensuring your aircraft receives expert care no matter where it's based.`
  };
}

/**
 * Get competitive positioning content
 */
export function getCompetitiveContent(): {
  heading: string;
  points: string[];
} {
  return {
    heading: "Why Choose Freedom Aviation Over Other Colorado Aircraft Management Companies",
    points: [
      "Transparent, all-inclusive pricing with no hidden fees",
      "Based at Centennial Airport (KAPA) with service throughout Colorado",
      "Owner-operator focused with personalized concierge service",
      "Comprehensive digital portal for complete visibility",
      "Expert maintenance coordination with trusted Colorado shops",
      "Premium detailing and aircraft care as part of every tier",
      "Flexible membership tiers that scale with your aircraft and mission",
      "Proven track record serving the Colorado aviation community"
    ]
  };
}

/**
 * Generate local search-optimized content blocks
 */
export function getLocalSearchContent(): {
  serviceTitles: string[];
  locationPhrases: string[];
  callToActions: string[];
} {
  return {
    serviceTitles: [
      "Aircraft Management at Centennial Airport Colorado",
      "Professional Aircraft Detailing in Denver",
      "Expert Flight Instruction at KAPA",
      "Colorado Front Range Aircraft Services",
      "Hangar Services at Centennial Airport"
    ],
    locationPhrases: [
      "Based at Centennial Airport (KAPA)",
      "Serving Denver, Colorado Springs, and the Front Range",
      "Colorado's premier aircraft management company",
      "Trusted by aircraft owners across Colorado",
      "Located in the heart of Colorado aviation"
    ],
    callToActions: [
      "Call (970) 618-2094 for a free consultation",
      "Visit us at Centennial Airport (KAPA)",
      "Get your personalized quote today",
      "Schedule a facility tour at KAPA",
      "Contact Freedom Aviation for expert aircraft care"
    ]
  };
}

/**
 * Generate rich snippet content for services
 */
export interface ServiceSnippet {
  name: string;
  description: string;
  location: string;
  price: string;
  rating?: number;
  features: string[];
}

export function getServiceSnippets(): ServiceSnippet[] {
  return [
    {
      name: "Light Aircraft Management",
      description: "Complete management services for single-engine piston aircraft including Cessna, Piper, and similar aircraft at Centennial Airport Colorado.",
      location: "Centennial Airport (KAPA), Colorado",
      price: "Starting at $850/month",
      features: [
        "Monthly detailing",
        "Maintenance coordination",
        "Fuel management",
        "Digital logs",
        "Hangar coordination"
      ]
    },
    {
      name: "High-Performance Aircraft Management",
      description: "Specialized care for high-performance aircraft including Cirrus SR22, Bonanza, and complex single-engine aircraft at KAPA.",
      location: "Centennial Airport (KAPA), Colorado",
      price: "Starting at $1,650/month",
      features: [
        "Advanced systems care",
        "TKS fluid management",
        "Avionics database updates",
        "Premium detailing",
        "Priority scheduling"
      ]
    },
    {
      name: "Turbine Aircraft Management",
      description: "Full-service management for turboprop and jet aircraft including TBM, PC-12, and Vision Jet at Centennial Airport.",
      location: "Centennial Airport (KAPA), Colorado",
      price: "Starting at $3,200/month",
      features: [
        "Turbine-specific systems",
        "Comprehensive records",
        "Expert coordination",
        "White-glove service",
        "Dedicated support"
      ]
    }
  ];
}

/**
 * Get NAP (Name, Address, Phone) consistency data
 * Critical for local SEO
 */
export function getNAPData() {
  return {
    name: BRAND.name,
    address: BRAND.address,
    city: "Englewood",
    state: "Colorado",
    stateCode: "CO",
    zip: "80112",
    phone: BRAND.phone,
    phoneFormatted: "(970) 618-2094",
    phoneE164: "+19706182094",
    email: BRAND.email,
    website: BRAND.website,
    coordinates: {
      latitude: 39.5696,
      longitude: -104.8492
    }
  };
}

/**
 * Generate location-based keywords for a specific page
 */
export function getPageKeywords(pageType: 'home' | 'pricing' | 'services' | 'about' | 'contact'): string {
  const base = [...SEO_KEYWORDS.brand, ...SEO_KEYWORDS.locations.slice(0, 5)];
  
  const pageSpecific: Record<string, string[]> = {
    home: [...SEO_KEYWORDS.competitive, ...SEO_KEYWORDS.services.slice(0, 8)],
    pricing: ['transparent pricing', 'aircraft management cost', 'no hidden fees', ...SEO_KEYWORDS.services.slice(0, 5)],
    services: [...SEO_KEYWORDS.services, ...SEO_KEYWORDS.aircraftTypes.slice(0, 5)],
    about: ['aircraft management company', 'Colorado aviation', 'owner-pilot services'],
    contact: ['contact aircraft management', 'KAPA services', 'Centennial Airport contact']
  };

  return [...base, ...pageSpecific[pageType]].join(', ');
}

/**
 * Generate alternative text for common images
 */
export function getImageAltText(imageType: string): string {
  const altTexts: Record<string, string> = {
    'hero-aircraft': 'Premium aircraft on ramp at Centennial Airport Colorado - Freedom Aviation aircraft management services',
    'cirrus-sr22': 'Cirrus SR22 high-performance aircraft managed by Freedom Aviation at KAPA Centennial Airport',
    'hangar-interior': 'Climate-controlled aircraft hangar at Centennial Airport - Freedom Aviation hangar services',
    'pilot-preflight': 'Professional pilot conducting preflight inspection - Freedom Aviation flight instruction Colorado',
    'aircraft-detailing': 'Professional aircraft detailing and cleaning services at Centennial Airport KAPA',
    'cockpit-avionics': 'Modern aircraft avionics and glass cockpit - managed by Freedom Aviation Colorado',
    'freedom-aviation-logo': 'Freedom Aviation - Premium Aircraft Management at Centennial Airport Colorado'
  };

  return altTexts[imageType] || `Freedom Aviation aircraft services at Centennial Airport Colorado`;
}

/**
 * Get social media sharing data
 */
export function getSocialShareData(pageTitle: string, pageDescription: string) {
  return {
    title: `${pageTitle} | Freedom Aviation Colorado`,
    description: pageDescription,
    image: `${BRAND.website}/og-image.jpg`,
    url: BRAND.website,
    hashtags: ['FreedomAviation', 'AircraftManagement', 'ColoradoAviation', 'KAPA', 'GeneralAviation'],
    via: 'Freedom Aviation' // Twitter handle if you have one
  };
}

