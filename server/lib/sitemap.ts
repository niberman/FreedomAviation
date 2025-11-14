/**
 * Dynamic Sitemap Generation for Freedom Aviation
 * Generates XML sitemap with all public routes
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Get all static public routes with their SEO metadata
 */
export function getStaticRoutes(): SitemapUrl[] {
  const baseUrl = 'https://www.freedomaviationco.com';
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      loc: `${baseUrl}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/pricing`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.95,
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: today,
      changefreq: 'yearly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/partners/sky-harbour`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/partners/fa-hangar`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7,
    },
    // Low priority auth pages - but include for completeness
    {
      loc: `${baseUrl}/login`,
      lastmod: today,
      changefreq: 'yearly',
      priority: 0.3,
    },
  ];
}

/**
 * Generate XML sitemap
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      const { loc, lastmod, changefreq, priority } = url;
      return `  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority !== undefined ? `<priority>${priority.toFixed(1)}</priority>` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

/**
 * Generate complete sitemap
 */
export function generateSitemap(): string {
  const staticRoutes = getStaticRoutes();
  return generateSitemapXML(staticRoutes);
}


