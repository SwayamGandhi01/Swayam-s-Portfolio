"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePointerFine } from "@/hooks/useMediaQuery";

/**
 * Custom cursor: a small dot that tracks exactly, plus a ring that lags
 * behind it. Any element carrying `data-cursor="Some label"` swells the ring
 * and prints that word inside it.
 *
 * Only mounts for fine pointers with motion enabled — on touch it would be
 * invisible dead weight. The native cursor is never hidden, so the pointer
 * remains visible if this component fails to mount for any reason.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const fine = usePointerFine();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced || !fine) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;


    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    let visible = false;
    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, input, textarea, label"
      );
      const text = target?.getAttribute("data-cursor");

      if (text) {
        label.textContent = text;
        gsap.to(ring, { scale: 3.1, borderColor: "var(--color-signal)", backgroundColor: "var(--color-signal)", duration: 0.4, ease: "expo.out" });
        gsap.to(label, { autoAlpha: 1, duration: 0.25 });
        gsap.to(dot, { scale: 0, duration: 0.3 });
      } else if (target) {
        gsap.to(ring, { scale: 1.8, borderColor: "var(--color-signal)", backgroundColor: "transparent", duration: 0.4, ease: "expo.out" });
        gsap.to(label, { autoAlpha: 0, duration: 0.2 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      } else {
        gsap.to(ring, { scale: 1, borderColor: "var(--line-strong)", backgroundColor: "transparent", duration: 0.4, ease: "expo.out" });
        gsap.to(label, { autoAlpha: 0, duration: 0.2 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    };

    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, fine]);

  if (reduced || !fine) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[95] hidden lg:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-[var(--line-strong)] opacity-0 will-change-transform"
        style={{ marginLeft: "-1.25rem", marginTop: "-1.25rem" }}
      >
        <span
          ref={labelRef}
          className="font-mono text-[0.3125rem] font-medium uppercase tracking-[0.12em] text-ink opacity-0"
        />
      </div>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 size-1.5 rounded-full bg-signal opacity-0 will-change-transform"
        style={{ marginLeft: "-0.1875rem", marginTop: "-0.1875rem" }}
      />
    </div>
  );
}
