import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface IosInstallBannerProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  instructions?: ReactNode;
  id?: string;
}

const DefaultInstructions = () => (
  <p>
    On iPhone: tap the{" "}
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[0.65rem] font-semibold uppercase tracking-wide">
      Share
    </span>{" "}
    button in Safari, then choose <span className="font-semibold">Add to Home Screen</span>.
  </p>
);

export function IosInstallBanner({
  visible,
  onDismiss,
  title = "Install “Freedom Aviation”",
  instructions,
  id = "ios-install-banner",
}: IosInstallBannerProps) {
  return (
    <div
      id={id}
      role="dialog"
      aria-label="Install Freedom Aviation on iPhone"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-[9999] transform rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl transition-all duration-300 sm:left-1/2 sm:bottom-6 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:inset-x-auto",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1 space-y-2 text-sm leading-relaxed">
          <strong className="text-base font-semibold">{title}</strong>
          {instructions ?? <DefaultInstructions />}
        </div>
        <button
          type="button"
          className="ml-2 text-lg text-white/70 transition hover:text-white"
          aria-label="Dismiss install tip"
          onClick={onDismiss}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

