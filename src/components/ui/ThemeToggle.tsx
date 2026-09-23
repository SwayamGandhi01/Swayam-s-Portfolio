"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

/**
 * Dark / light switch.
 *
 * Holds no React state on purpose. The theme lives in an attribute on
 * `<html>`, written before first paint by the blocking script in
 * `layout.tsx`, and which icon and label to show is decided by CSS selectors
 * on that attribute (`[data-theme-when]`, defined in globals.css). So the
 * server can render both halves, the browser hides the wrong one before it
 * paints, and there is nothing for hydration to disagree about — which is
 * exactly the mismatch every `useState(theme)` toggle runs into.
 *
 * The accessible name comes from the two `sr-only` spans rather than a static
 * `aria-label`, for the same reason: `display: none` removes the inactive one
 * from the accessibility tree, so the name stays true to the current state
 * without JS ever touching it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-muted",
        "transition-colors duration-300 hover:border-signal hover:text-signal",
        className
      )}
    >
      {/* `size-*` on the icon, not the svg's own width/height attrs, so it
          scales with the button if this is ever reused at another size. */}
      <Moon aria-hidden data-theme-when="dark" className="size-4" />
      <Sun aria-hidden data-theme-when="light" className="size-4" />

      <span className="sr-only" data-theme-when="dark">
        Dark theme active. Switch to light.
      </span>
      <span className="sr-only" data-theme-when="light">
        Light theme active. Switch to dark.
      </span>
    </button>
  );
}
