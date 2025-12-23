'use client';

import { BRAND } from "@/brand/manifest";

export interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  jsonLd?: object;
  noIndex?: boolean;
}

/**
 * SEO Component - For client-side SEO needs
 * Note: For static SEO, use Next.js metadata exports in page.tsx files instead
 * This component is for dynamic SEO requirements
 */
export function Seo({
  title,
  description = `Premium aircraft management, detailing, and expert flight instruction for owner-operators at Centennial Airport (KAPA). Colorado-based, Front Range focused.`,
  jsonLd,
}: SeoProps) {
  // In Next.js, most SEO is handled via metadata exports
  // This component is primarily for JSON-LD injection
  if (!jsonLd) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Generate LocalBusiness JSON-LD
 */
export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": BRAND.name,
    "description": "Premium aircraft management and flight instruction serving owner-operators at Centennial Airport",
    "url": BRAND.website,
    "telephone": BRAND.phone,
    "email": BRAND.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "7565 S Peoria St",
      "addressLocality": "Englewood",
      "addressRegion": "CO",
      "postalCode": "80112",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "39.5696",
      "longitude": "-104.8492"
    },
    "openingHours": "By Appointment",
    "priceRange": "$$",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "39.5696",
        "longitude": "-104.8492"
      },
      "geoRadius": "50000"
    }
  };
}

/**
 * Generate Service JSON-LD
 */
export function getServiceJsonLd(serviceName: string, description: string, price?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": BRAND.name,
      "url": BRAND.website
    },
    "areaServed": {
      "@type": "State",
      "name": "Colorado"
    },
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "USD"
      }
    })
  };
}

/**
 * Generate BreadcrumbList JSON-LD for page navigation
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BRAND.website}${item.url}`
    }))
  };
}

/**
 * Generate FAQ JSON-LD for FAQ sections
 */
export function getFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate ProfessionalService JSON-LD for aviation services
 */
export function getProfessionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": BRAND.name,
    "description": "Premium aircraft management and flight instruction services for owner-operators",
    "url": BRAND.website,
    "telephone": BRAND.phone,
    "email": BRAND.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "7565 S Peoria St",
      "addressLocality": "Englewood",
      "addressRegion": "CO",
      "postalCode": "80112",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "39.5696",
      "longitude": "-104.8492"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Denver"
      },
      {
        "@type": "City",
        "name": "Colorado Springs"
      },
      {
        "@type": "City",
        "name": "Boulder"
      },
      {
        "@type": "City",
        "name": "Fort Collins"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Aircraft Services",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Aircraft Management"
        },
        {
          "@type": "OfferCatalog",
          "name": "Aircraft Detailing"
        },
        {
          "@type": "OfferCatalog",
          "name": "Flight Instruction"
        }
      ]
    }
  };
}
