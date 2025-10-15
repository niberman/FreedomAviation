import { isConfigurator } from "@/lib/flags";
import dynamic from "next/dynamic";

const PricingFixed = dynamic(() => import("@/components/PricingFixed"), {
  ssr: false,
});

export default function PricingPage() {
  if (isConfigurator) {
    // Configurator remains in codebase;
    // switch back any time by setting NEXT_PUBLIC_PRICING_MODE=configurator
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold">
          Pricing Configurator (Disabled)
        </h1>
        <p className="mt-3 opacity-80">
          The configurator is currently turned off. Set{" "}
          <code>NEXT_PUBLIC_PRICING_MODE=configurator</code> to re-enable.
        </p>
      </main>
    );
  }
  return <PricingFixed />;
}
