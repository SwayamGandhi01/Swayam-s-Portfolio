/**
 * Theme constants.
 *
 * Deliberately not a `"use client"` module: the blocking script in
 * `app/layout.tsx` is rendered on the server and interpolates the storage key
 * into its source, and a constant exported from a client module arrives there
 * as a client-reference stub rather than a string. See `lib/constants.ts` for
 * the same rule and the bug that taught it to us.
 */

export type Theme = "dark" | "light";

/** localStorage key holding the visitor's explicit choice. */
export const THEME_STORAGE_KEY = "workbench:theme";

/**
 * Dark is the design's home key — the site was composed in it, and light is
 * the considered alternative rather than the other half of a pair. So a
 * visitor who has never touched the toggle gets dark, system preference or
 * not. To honour `prefers-color-scheme` instead, the one place to change is
 * `themeScript` in `app/layout.tsx`.
 */
export const DEFAULT_THEME: Theme = "dark";

/**
 * Fired on `window` after the theme changes. A plain DOM event rather than a
 * context: the source of truth is an attribute on `<html>`, which no React
 * tree owns, and the only subscriber is the WebGL hero.
 */
export const THEME_EVENT = "workbench:themechange";

/** Browser-chrome tint per theme — matches `--color-canvas` in globals.css. */
export const THEME_COLOR: Record<Theme, string> = {
  dark: "#0b0c0e",
  light: "#f7f4ed",
};

export const isTheme = (value: unknown): value is Theme =>
  value === "dark" || value === "light";
