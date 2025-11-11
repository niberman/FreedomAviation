import { Helmet } from "react-helmet-async";
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
 * SEO Component - Manages meta tags, Open Graph, Twitter Cards, and JSON-LD
 */
export function Seo({
  title,
  description = `Premium aircraft management, detailing, and expert flight instruction for owner-operators at Centennial Airport (KAPA). Colorado-based, Front Range focused.`,
  keywords,
  canonical,
  ogType = "website",
  ogImage = "/og-image.jpg",
  jsonLd,
  noIndex = false,
}: SeoProps) {
  const pageTitle = title 
    ? `${title} | ${BRAND.name}`
    : `${BRAND.name} - ${BRAND.tagline}`;

  const fullUrl = canonical 
    ? `${BRAND.website}${canonical}`
    : BRAND.website;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={fullUrl} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={BRAND.name} />
      {ogImage && <meta property="og:image" content={`${BRAND.website}${ogImage}`} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={`${BRAND.website}${ogImage}`} />}

      {/* Business Info */}
      <meta name="geo.region" content="US-CO" />
      <meta name="geo.placename" content="Centennial, Colorado" />
      <meta name="geo.position" content="39.5696;-104.8492" />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
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
          "name": "Aircraft Management",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Light Aircraft Management"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "High-Performance Aircraft Management"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Turbine Aircraft Management"
              }
            }
          ]
        },
        {
          "@type": "OfferCatalog",
          "name": "Aircraft Detailing",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Interior Detailing"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Exterior Detailing"
              }
            }
          ]
        },
        {
          "@type": "OfferCatalog",
          "name": "Flight Instruction",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Private Pilot Training"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Instrument Rating"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Pilot Development"
              }
            }
          ]
        }
      ]
    }
  };
}
