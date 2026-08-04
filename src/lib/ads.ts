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

export type AdUnitKey = keyof typeof ADMOB_UNITS;

/** Inject a feed ad after every N listings. */
export const FEED_AD_INTERVAL = 5;
