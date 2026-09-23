"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Wipe reveal for a case-study cover.
 *
 * A panel sits over the image and retracts to the right as the cover scrolls
 * into view, with an accent hairline riding the edge.
 *
 * ── Why this replaced the old two-layer version ─────────────────────────────
 * It used to render the screenshot twice: a `grayscale(1) contrast(1.35)`
 * copy underneath and an untouched copy clipped in over it. Two problems.
 *
 * The first is a content one. These are real captures of client sites, and
 * their branding is the whole point of showing them — so the screenshot was
 * never meant to be desaturated anywhere on this site. The cards were fixed
 * earlier; this was the last place it survived, and because the grey copy
 * painted first it was also the LCP element on every case study. Visitors
 * were measuring the page on a decolourised version of someone's homepage.
 *
 * The second is cost. One `src` means one network request, but two elements
 * mean two decodes, two composited layers, and a full-surface raster filter
 * on a 100vw image. Covering it with a flat panel is one paint of one colour.
 *
 * ── Why refs instead of state ───────────────────────────────────────────────
 * The markup renders *revealed*, and the covering panel is applied in a
 * layout effect — before the browser paints, and only when there is motion to
 * play. So a visitor with JS disabled, or with reduced motion on, gets the
 * finished image rather than a panel that never retracts. Writing the
 * clip-path through a ref rather than through state also keeps the image out
 * of React's render path entirely; it is painted once and never re-rendered.
 */

const COVERED = "inset(0 0 0 0)";
const RETRACTED = "inset(0 0 0 100%)";

export function WipeReveal({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    const cover = coverRef.current;
    const line = lineRef.current;
    if (!root || !cover || !line || reduced) return;

    // Cover it before the first paint, so the wipe has something to wipe.
    cover.style.clipPath = COVERED;
    line.style.opacity = "0.9";
    line.style.left = "0";

    const retract = () => {
      cover.style.clipPath = RETRACTED;
      line.style.opacity = "0";
      line.style.left = "100%";
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        retract();
      },
      { threshold: 0.25 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      // Leave the image visible if this unmounts mid-wipe.
      cover.style.clipPath = RETRACTED;
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className={cn("relative overflow-hidden bg-surface", className)}
    >
      {/* Full colour, always. Never filtered. */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />

      {/* The panel that wipes away. Starts retracted so the server-rendered
          markup shows the finished image; the effect above covers it only
          when there is an animation to run. */}
      <span
        ref={coverRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-canvas",
          !reduced &&
            "transition-[clip-path] duration-[900ms] ease-[var(--ease-out-expo)]"
        )}
        style={{ clipPath: RETRACTED }}
      >
        <span className="blueprint absolute inset-0 opacity-40" />
      </span>

      <span
        ref={lineRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-px bg-signal opacity-0",
          !reduced &&
            "transition-[left,opacity] duration-[900ms] ease-[var(--ease-out-expo)]"
        )}
        style={{ left: "100%" }}
      />
    </div>
  );
}
