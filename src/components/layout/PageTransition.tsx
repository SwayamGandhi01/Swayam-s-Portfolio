"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Route transition: a full-bleed panel that covers the viewport on the first
 * painted frame of a new route, then wipes upward to reveal it.
 *
 * Deliberately a *reveal*, not an exit-then-enter. Holding a route open to
 * play an exit animation means intercepting navigation, which breaks the back
 * button and browser-driven navigations. This runs entirely after the router
 * has committed, so history behaves exactly as it should — and because the
 * cover is applied in a layout effect, the new page is never seen uncovered.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    // The preloader already owns the first paint; don't double up.
    if (first.current) {
      first.current = false;
      return;
    }

    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return;

    const tl = gsap.timeline();
    tl.set(panel, { display: "block", transformOrigin: "bottom", scaleY: 1 })
      .set(content, { opacity: 0 })
      .to(panel, {
        scaleY: 0,
        transformOrigin: "top",
        duration: 0.85,
        ease: "power4.inOut",
      })
      .to(content, { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.45")
      .set(panel, { display: "none" });

    return () => {
      tl.kill();
      gsap.set(content, { opacity: 1 });
      gsap.set(panel, { display: "none" });
    };
  }, [pathname, reduced]);

  return (
    <>
      <div
        ref={panelRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] hidden bg-signal"
      />
      <div ref={contentRef}>{children}</div>
    </>
  );
}
