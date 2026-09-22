"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Sketch → colour reveal.
 *
 * Two copies of the same image sit on top of each other: the lower one is
 * desaturated and lifted in contrast so it reads as a pencil study, the upper
 * one is untouched. A `clip-path` inset animates the colour copy into view,
 * wiping the sketch away.
 *
 * Deliberately CSS-only. The effect needs one animatable property and one
 * decoded image — a WebGL pass would mean a second renderer, a texture
 * upload and a fallback path, for a result no one could tell apart.
 *
 * On touch devices, where there is no hover, the colour layer is simply
 * always shown rather than leaving mobile visitors with a greyscale site.
 */
export function SketchReveal({
  src,
  alt,
  sizes,
  priority = false,
  className,
  interactive = true,
  mode = "hover",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  interactive?: boolean;
  /**
   * `hover` — wipes while pointed at (cards).
   * `inview` — wipes once as it scrolls into view (case-study covers).
   */
  mode?: "hover" | "inview";
}) {
  const [hovered, setHovered] = useState(false);
  const [seen, setSeen] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "inview" || !interactive) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode, interactive]);

  // Reduced motion still gets the colour image — it just doesn't wipe.
  const revealed =
    !interactive || reduced || (mode === "inview" ? seen : hovered);

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden bg-ink-2", className)}
      onPointerEnter={(e) =>
        mode === "hover" && e.pointerType !== "touch" && setHovered(true)
      }
      onPointerLeave={() => mode === "hover" && setHovered(false)}
      onFocus={() => mode === "hover" && setHovered(true)}
      onBlur={() => mode === "hover" && setHovered(false)}
    >
      {/* Sketch layer */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover [filter:grayscale(1)_contrast(1.35)_brightness(1.05)]"
      />

      {/* Colour layer, wiped in */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0",
          !reduced && "transition-[clip-path] duration-[900ms] ease-[var(--ease-out-expo)]"
        )}
        style={{
          clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>

      {/* Hairline that rides the wipe edge while it travels. */}
      {interactive && !reduced && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 w-px bg-signal transition-[left,opacity] duration-[900ms] ease-[var(--ease-out-expo)]",
            revealed ? "left-full opacity-0" : "left-0 opacity-90"
          )}
        />
      )}
    </div>
  );
}
