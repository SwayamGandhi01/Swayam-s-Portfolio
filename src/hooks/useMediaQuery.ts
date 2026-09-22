"use client";

import { useSyncExternalStore } from "react";

/**
 * Live media-query match. `serverValue` is what SSR and the hydration pass
 * see, so pick the conservative answer for whatever you're gating.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

/** True only for precise pointers — i.e. hover effects will actually work. */
export function usePointerFine() {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}
