/**
 * Values shared between server and client modules.
 *
 * These deliberately live outside any `"use client"` file. A constant exported
 * from a client module and imported by a server component does not arrive as
 * its value — React replaces it with a client-reference stub, and stringifying
 * that yields an error message rather than the constant. Which is exactly what
 * happened when this key lived in `Preloader.tsx` and `layout.tsx` interpolated
 * it into an inline script.
 */

/** sessionStorage key marking the intro as already shown this tab. */
export const INTRO_SEEN_KEY = "workbench:intro-seen";
