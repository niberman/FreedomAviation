import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_INSTALL_DISMISSED_KEY,
  isInStandaloneMode,
  isIos,
  isSafari,
  readInstallDismissed,
  writeInstallDismissed,
} from "@/lib/ios-install";

const normalizePath = (path: string) => {
  if (!path) return "/";
  let next = path.trim();
  if (!next.startsWith("/")) {
    next = `/${next}`;
  }
  if (next.length > 1 && next.endsWith("/")) {
    next = next.slice(0, -1);
  }
  return next;
};

export interface UseIosInstallPromptOptions {
  targetPaths: string[];
  currentPath: string;
  storageKey?: string;
}

export interface UseIosInstallPromptResult {
  isEligible: boolean;
  isBannerVisible: boolean;
  dismissBanner: () => void;
  showBanner: () => void;
  refreshState: () => void;
}

export function useIosInstallPrompt({
  targetPaths,
  currentPath,
  storageKey = DEFAULT_INSTALL_DISMISSED_KEY,
}: UseIosInstallPromptOptions): UseIosInstallPromptResult {
  const normalizedPaths = useMemo(() => {
    const deduped = Array.from(new Set(targetPaths.map(normalizePath)));
    return deduped;
  }, [targetPaths]);

  const normalizedCurrentPath = useMemo(() => normalizePath(currentPath), [currentPath]);

  const isTargetPath = useMemo(
    () => normalizedPaths.includes(normalizedCurrentPath),
    [normalizedPaths, normalizedCurrentPath]
  );

  const [isEligible, setIsEligible] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const refreshState = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!isTargetPath) {
      setIsEligible(false);
      setIsBannerVisible(false);
      return;
    }

    const eligible = isIos() && isSafari() && !isInStandaloneMode();
    setIsEligible(eligible);
    if (eligible) {
      setIsBannerVisible(!readInstallDismissed(storageKey));
    } else {
      setIsBannerVisible(false);
    }
  }, [isTargetPath, storageKey]);

  const dismissBanner = useCallback(() => {
    writeInstallDismissed(storageKey, true);
    setIsBannerVisible(false);
  }, [storageKey]);

  const showBanner = useCallback(() => {
    writeInstallDismissed(storageKey, false);
    if (!isTargetPath) {
      setIsBannerVisible(false);
      return;
    }

    if (isIos() && isSafari() && !isInStandaloneMode()) {
      setIsBannerVisible(true);
    } else {
      refreshState();
    }
  }, [storageKey, isTargetPath, refreshState]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => refreshState();
    const handleOrientation = () => refreshState();
    const handlePageShow = () => refreshState();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("orientationchange", handleOrientation);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("orientationchange", handleOrientation);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [refreshState]);

  return {
    isEligible,
    isBannerVisible,
    dismissBanner,
    showBanner,
    refreshState,
  };
}

