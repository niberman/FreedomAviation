"use client";

import { useEffect, useState } from "react";
import { PACKAGES } from "@/lib/pricing-packages";

type HangarOption = {
  id: "no-hangar" | "sky-harbour" | "f9";
  title: string;
  subtitle?: string;
  note?: string;
};

const HANGAR_OPTIONS: HangarOption[] = [
  {
    id: "no-hangar",
    title: "No Hangar",
    subtitle: "Owner-provided hangar or ramp access",
    note: "We service your aircraft at your location. Hangar/ramp costs are not billed by Freedom.",
  },
  {
    id: "sky-harbour",
    title: "Sky Harbour — Denver (KAPA)",
    subtitle: "Premium private hangar campus",
    note: "Space limited. Hangar fees handled separately with the provider.",
  },
  {
    id: "f9",
    title: "F9 — Centennial (KAPA)",
    subtitle: "Partner facility (availability varies)",
    note: "Hangar/ramp fees handled separately with the provider.",
  },
];

export default function PricingFixed() {
  const [selectedHangar, setSelectedHangar] =
    useState<HangarOption["id"]>("no-hangar");

  // Persist selection (nice to have)
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("fa:hangar")
        : null;
    if (saved === "no-hangar" || saved === "sky-harbour" || saved === "f9") {
      setSelectedHangar(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fa:hangar", selectedHangar);
    }
  }, [selectedHangar]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold">Transparent Memberships</h1>
        <p className="mt-2 opacity-80">Just Fly. We handle everything.</p>
      </header>

      {/* STEP 1: Hangar selection (now includes No Hangar) */}
      <div className="mb-8">
        <div className="mb-3 text-sm uppercase tracking-wide opacity-70">
          Step 1
        </div>
        <h2 className="text-2xl font-semibold">Choose hangar option</h2>
        <p className="mt-1 text-sm opacity-80">
          Hangar or ramp fees are handled directly with the provider. Selecting
          “No Hangar” means we service the aircraft wherever it lives (your
          hangar or ramp).
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {HANGAR_OPTIONS.map((opt) => {
            const active = selectedHangar === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedHangar(opt.id)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  active ? "border-black shadow-md" : "hover:border-black/60",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold">{opt.title}</div>
                    {opt.subtitle ? (
                      <div className="text-sm opacity-80">{opt.subtitle}</div>
                    ) : null}
                  </div>
                  <span
                    className={[
                      "ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full border",
                      active ? "bg-black text-white" : "bg-white",
                    ].join(" ")}
                    aria-hidden
                  >
                    {active ? "✓" : ""}
                  </span>
                </div>
                {opt.note ? (
                  <p className="mt-2 text-xs opacity-70">{opt.note}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Packages list */}
      <div>
        <div className="mb-3 text-sm uppercase tracking-wide opacity-70">
          Step 2
        </div>
        <h2 className="text-2xl font-semibold">Choose your package</h2>
        <p className="mt-1 text-sm opacity-80">
          Base monthly is for 0–10 hours/month. Service scales automatically by
          hours flown.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{pkg.title}</h3>
              <p className="mt-1 text-sm opacity-80">
                Examples: {pkg.examples.join(", ")}
              </p>

              <div className="mt-4">
                <div className="text-3xl font-bold">
                  ${pkg.baseMonthly}
                  <span className="text-base font-normal opacity-70"> /mo</span>
                </div>
                <div className="mt-1 text-sm opacity-80">
                  0–10 hrs/month base
                </div>
              </div>

              <ul className="mt-6 list-disc space-y-1 pl-5 text-sm">
                {pkg.includes.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl bg-gray-50 p-4">
                <h4 className="font-medium">Scaling by Hours/Month</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {pkg.hours.map((h) => (
                    <li
                      key={h.range}
                      className="flex items-start justify-between gap-4"
                    >
                      <span className="font-medium">{h.range} hrs</span>
                      <span className="text-right">
                        {h.detailsPerMonth} details · {h.serviceFrequency}
                        <br />
                        <span className="opacity-70">
                          ×{h.priceMultiplier.toFixed(2)} multiplier
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {pkg.addons?.length ? (
                <div className="mt-6 rounded-xl border p-4">
                  <h4 className="font-medium">Optional Add-On</h4>
                  {pkg.addons.map((a) => (
                    <div key={a.name} className="mt-2">
                      <div className="flex items-center justify-between">
                        <span>{a.name}</span>
                        <span className="font-medium">
                          +${a.priceDeltaMonthly}/mo
                        </span>
                      </div>
                      {a.bullets?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {a.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6">
                <a
                  href={`/signup?hangar=${encodeURIComponent(selectedHangar)}&package=${encodeURIComponent(pkg.id)}`}
                  className="inline-flex w-full items-center justify-center rounded-xl border bg-black px-4 py-2 text-white hover:opacity-90"
                >
                  Continue
                </a>
              </div>

              <p className="mt-2 text-xs opacity-70">
                Selected hangar:{" "}
                <span className="font-medium">
                  {readableHangar(selectedHangar)}
                </span>
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm opacity-70">
          Need white-glove scheduling or special handling? Add Freedom+
          Concierge at checkout.
        </p>
      </div>
    </section>
  );
}

function readableHangar(id: HangarOption["id"]) {
  const map: Record<HangarOption["id"], string> = {
    "no-hangar": "No Hangar (owner-provided)",
    "sky-harbour": "Sky Harbour — Denver (KAPA)",
    f9: "F9 — Centennial (KAPA)",
  };
  return map[id] || "No Hangar";
}
