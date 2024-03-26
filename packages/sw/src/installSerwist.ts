import { clientsClaim as clientsClaimImpl, setCacheNameDetails } from "@serwist/core";
import { type GoogleAnalyticsInitializeOptions, initialize } from "@serwist/google-analytics/initialize";
import { enable } from "@serwist/navigation-preload";

import { disableDevLogs as disableDevLogsImpl } from "./disableDevLogs.js";
import { fallbacks as fallbacksImpl } from "./fallbacks.js";
import type { FallbacksOptions } from "./fallbacks.js";
import { type HandlePrecachingOptions, handlePrecaching } from "./handlePrecaching.js";
import { registerRuntimeCaching } from "./registerRuntimeCaching.js";
import type { RuntimeCaching } from "./types.js";

declare const self: ServiceWorkerGlobalScope;

export type InstallSerwistOptions = HandlePrecachingOptions & {
  /**
   * Forces the waiting service worker to become the active one.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
   */
  skipWaiting?: boolean;
  /**
   * Imports external scripts. They are executed in the order they
   * are passed.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
   */
  importScripts?: string[];
  /**
   * Enables navigation preloading if it is supported.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/navigationPreload
   */
  navigationPreload?: boolean;
  /**
   * Modifies the prefix of the default cache names used by Serwist packages.
   */
  cacheId?: string | undefined;
  /**
   * Claims any currently available clients once the service worker
   * becomes active. This is normally used in conjunction with `skipWaiting()`.
   *
   * @default false
   */
  clientsClaim?: boolean;
  /**
   * A list of caching strategies.
   *
   * @see https://serwist.pages.dev/docs/sw/register-runtime-caching
   */
  runtimeCaching?: RuntimeCaching[];
  /**
   * Your configuration for `@serwist/google-analytics`. This plugin is
   * only initialized when this option is not `undefined` or `false`.
   */
  offlineAnalyticsConfig?: GoogleAnalyticsInitializeOptions | boolean;
  /**
   * Disables Serwist's logging in development mode.
   *
   * @default false
   * @see https://serwist.pages.dev/docs/sw/disable-dev-logs
   */
  disableDevLogs?: boolean;
  /**
   * Precaches routes so that they can be used as a fallback when
   * a Strategy fails to generate a response.
   * Note: This option mutates `runtimeCaching`!
   *
   * @see https://serwist.pages.dev/docs/sw/fallbacks
   */
  fallbacks?: Omit<FallbacksOptions, "runtimeCaching">;
};

/**
 * Abstracts away the core APIs of Serwist.
 * @param options - `installSerwist` options.
 */
export const installSerwist = ({
  precacheEntries,
  precacheOptions,
  cleanupOutdatedCaches,

  skipWaiting = false,
  importScripts,
  navigationPreload = false,
  cacheId,
  clientsClaim = false,
  runtimeCaching,
  offlineAnalyticsConfig,
  disableDevLogs = false,
  fallbacks,
  ...options
}: InstallSerwistOptions): void => {
  if (!!importScripts && importScripts.length > 0) self.importScripts(...importScripts);

  if (navigationPreload) enable();

  if (cacheId !== undefined) {
    setCacheNameDetails({
      prefix: cacheId,
    });
  }

  if (skipWaiting) {
    self.skipWaiting();
  } else {
    self.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
      }
    });
  }

  if (clientsClaim) clientsClaimImpl();

  handlePrecaching({
    precacheEntries,
    precacheOptions,
    cleanupOutdatedCaches,
    ...(options.navigateFallback && {
      navigateFallback: options.navigateFallback,
      navigateFallbackAllowlist: options.navigateFallbackAllowlist,
      navigateFallbackDenylist: options.navigateFallbackDenylist,
    }),
  });

  if (offlineAnalyticsConfig !== undefined) {
    if (typeof offlineAnalyticsConfig === "boolean") {
      offlineAnalyticsConfig && initialize();
    } else {
      initialize(offlineAnalyticsConfig);
    }
  }

  if (runtimeCaching !== undefined) {
    if (fallbacks !== undefined) {
      fallbacksImpl({ ...fallbacks, runtimeCaching });
    }
    registerRuntimeCaching(...runtimeCaching);
  }

  if (disableDevLogs) disableDevLogsImpl();
};
