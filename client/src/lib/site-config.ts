import { getEnvVar } from "./env";

const marketingDomains = ["freedomaviationco.com", "www.freedomaviationco.com"] as const;

export const siteConfig = {
  marketing: {
    primaryDomain: "www.freedomaviationco.com",
    domains: marketingDomains,
    siteUrl:
      getEnvVar("VITE_SITE_URL") ??
      getEnvVar("NEXT_PUBLIC_SITE_URL") ??
      "https://www.freedomaviationco.com",
  },
  dashboard: {
    branch: "dashboard",
    previewDomain:
      getEnvVar("VITE_DASHBOARD_URL") ??
      getEnvVar("NEXT_PUBLIC_DASHBOARD_URL") ??
      "https://freedom-aviation.vercel.app",
  },
};

export const isMarketingDomain = (hostname: string) =>
  marketingDomains.includes(hostname as (typeof marketingDomains)[number]);

