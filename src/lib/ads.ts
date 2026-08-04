/**
 * Google AdMob configuration.
 *
 * AdMob only renders inside a native app shell (Android/iOS). On the web build
 * these IDs are stored here and surfaced as reserved ad slots, so wrapping the
 * app with Capacitor later needs no layout changes — just wire the plugin to
 * these unit IDs.
 */
export const ADMOB_PUBLISHER_ID = "1276586649400078";

export const ADMOB_APP_ID = `ca-app-pub-${ADMOB_PUBLISHER_ID}~0000000000`;

export const ADMOB_UNITS = {
  /** Native ad injected inside the home feed. */
  nativeFeed: "ca-app-pub-1276586649400078/4865800519",
  /** Banner shown on the listing detail screen. */
  detailBanner: "ca-app-pub-1276586649400078/3868413614",
  /** Interstitial shown after an ad is published. */
  publishInterstitial: "ca-app-pub-1276586649400078/1207019858",
} as const;

/** Google's official always-fill test unit IDs — safe for development and QA. */
export const ADMOB_TEST_UNITS = {
  nativeFeed: "ca-app-pub-3940256099942544/2247696110",
  detailBanner: "ca-app-pub-3940256099942544/6300978111",
  publishInterstitial: "ca-app-pub-3940256099942544/1033173712",
} as const;

export type AdUnitKey = keyof typeof ADMOB_UNITS;

/** Inject a feed ad after every N listings. */
export const FEED_AD_INTERVAL = 5;

export const AD_TEST_MODE_STORAGE_KEY = "tradespot.admob.testMode";

/**
 * Default comes from the build env (VITE_ADMOB_TEST_MODE=true|false); when it
 * isn't set, dev builds default to test ads and production to live ads.
 */
export function defaultAdTestMode(): boolean {
  const flag = import.meta.env["VITE_ADMOB_TEST_MODE"] as string | undefined;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return import.meta.env.DEV;
}

/** Whether the in-app QA toggle should be shown. */
export const AD_TEST_TOGGLE_ENABLED =
  import.meta.env.DEV || import.meta.env["VITE_ADMOB_ALLOW_TEST_TOGGLE"] === "true";

/** Reads the persisted override, falling back to the env default. */
export function getAdTestMode(): boolean {
  if (typeof window === "undefined") return defaultAdTestMode();
  const stored = window.localStorage.getItem(AD_TEST_MODE_STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return defaultAdTestMode();
}

export function setAdTestMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AD_TEST_MODE_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event("admob-test-mode-change"));
}

/** Resolves a unit key to the live or test id depending on the active mode. */
export function resolveAdUnitId(unit: AdUnitKey, testMode = getAdTestMode()): string {
  return testMode ? ADMOB_TEST_UNITS[unit] : ADMOB_UNITS[unit];
}
