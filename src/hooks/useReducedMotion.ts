"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/**
 * Reduced-motion preference, live.
 *
 * Returns `true` during SSR and the first client render so that motion is
 * opt-in rather than opt-out: a user who prefers reduced motion never sees a
 * frame of animation before hydration corrects it.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true
  );
}
