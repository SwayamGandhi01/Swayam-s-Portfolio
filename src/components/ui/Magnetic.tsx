"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePointerFine } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * Pulls its child gently toward the cursor while hovered.
 *
 * Wraps rather than clones: `cloneElement` with an injected ref reaches into
 * a child that may not forward one, and reads a ref during render. An
 * `inline-flex` wrapper is transparent to the layout of the pill-shaped
 * controls this is used on.
 *
 * Purely decorative, so it is inert for coarse pointers and reduced motion.
 * Movement uses `quickTo`, which reuses a single tween rather than allocating
 * one per pointermove.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  /** Drift distance as a fraction of the cursor's offset from centre. */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const fine = usePointerFine();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [reduced, fine, strength]);

  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
