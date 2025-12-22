import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/staff/', '/api/', '/onboarding'],
      },
    ],
    sitemap: 'https://www.freedomaviationco.com/sitemap.xml',
  };
}











