export const DEFAULT_INSTALL_DISMISSED_KEY = "faInstallPromptDismissed";

const normalizeUserAgent = () => {
  if (typeof window === "undefined") return "";
  return window.navigator.userAgent || "";
};

export const isIos = () => {
  const ua = normalizeUserAgent();
  return /iphone|ipad|ipod/i.test(ua);
};

export const isSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = normalizeUserAgent();
  const isIOS = /iP(ad|hone|od)/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return isIOS && isWebkit && !isChrome && !isFirefox;
};

export const isInStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const matchMediaAvailable = typeof window.matchMedia === "function";
  const displayModeStandalone = matchMediaAvailable ? window.matchMedia("(display-mode: standalone)").matches : false;
  return (typeof nav.standalone === "boolean" && nav.standalone) || displayModeStandalone;
};

export const readInstallDismissed = (storageKey: string) => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
};

export const writeInstallDismissed = (storageKey: string, dismissed: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (dismissed) {
      window.localStorage.setItem(storageKey, "true");
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // no-op
  }
};

