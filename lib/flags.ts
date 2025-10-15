export const PRICING_MODE = (process.env.NEXT_PUBLIC_PRICING_MODE ||
  "fixed") as "fixed" | "configurator";
export const isConfigurator = PRICING_MODE === "configurator";
