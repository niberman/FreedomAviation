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
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "USD"
      }
    })
  };
}
