"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEME_COLOR,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  isTheme,
  type Theme,
} from "@/lib/theme";

/* ------------------------------------------------------------------------ */
/* Writing                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Switch themes.
 *
 * The attribute on `<html>` is the single source of truth — every colour in
 * the site is a CSS custom property hanging off it, so this one write repaints
 * the whole page with no React render involved. localStorage records the
 * choice, the meta tag follows so the browser chrome matches, and the event
 * lets the few non-CSS surfaces (the WebGL hero) catch up.
 */
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / blocked storage: the switch still works for this visit.
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);

  window.dispatchEvent(new Event(THEME_EVENT));
}

export function toggleTheme() {
  setTheme(readTheme() === "light" ? "dark" : "light");
}

/* ------------------------------------------------------------------------ */
/* Reading                                                                   */
/* ------------------------------------------------------------------------ */

const readTheme = (): Theme => {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
};

/**
 * The active theme, for the handful of things CSS variables can't reach —
 * currently just the hero's shader uniforms.
 *
 * Prefer a CSS custom property over calling this. A component that reads the
 * theme in JS has to re-render to change colour; one that uses `bg-canvas`
 * never renders again at all.
 *
 * The server snapshot is the default rather than the real value, because the
 * server has no way to know what a given visitor chose — the blocking script
 * in `layout.tsx` sets the attribute before paint, and this hook re-reads it
 * after hydration. That is why nothing user-visible may depend on it during
 * the first render.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
}
