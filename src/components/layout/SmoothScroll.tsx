"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type LenisApi = {
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  stop: () => void;
  start: () => void;
};

/** Native fallback, used before Lenis boots and whenever it is disabled. */
const nativeScrollTo: LenisApi["scrollTo"] = (target, offset = 0) => {
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  const el =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : target;
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY + offset,
    behavior: "smooth",
  });
};

const fallbackApi: LenisApi = {
  scrollTo: nativeScrollTo,
  stop: () => {},
  start: () => {},
};

const SmoothScrollContext = createContext<LenisApi>(fallbackApi);

/** Programmatic scrolling that works whether or not Lenis is running. */
export function useSmoothScroll(): LenisApi {
  return useContext(SmoothScrollContext);
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so scroll position and
 * ScrollTrigger measurements update on the same frame. Running them on
 * separate RAF loops is the usual cause of scroll-linked animation jitter.
 *
 * Disabled entirely under `prefers-reduced-motion` — overriding the scroll
 * physics is exactly what that preference asks us not to do. The context
 * value is stable and reads the instance through a ref at call time, so
 * consumers never re-render just because the instance appeared.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Scroll offset per route, and whether the last navigation was a
  // back/forward. Together these drive scroll restoration — see below.
  const positions = useRef(new Map<string, number>());
  const isPop = useRef(false);

  const api = useMemo<LenisApi>(
    () => ({
      scrollTo: (target, offset = 0) => {
        const lenis = lenisRef.current;
        if (!lenis) return nativeScrollTo(target, offset);
        lenis.scrollTo(target, {
          offset,
          duration: 1.2,
          // Without this, a programmatic scroll is silently dropped whenever
          // Lenis happens to be stopped. That bit the mobile menu: opening it
          // calls `stop()`, and tapping a link calls `scrollTo()` before
          // React has re-rendered and restarted Lenis — so the menu closed,
          // the hash updated, and the page never moved. Every call through
          // this API is a deliberate navigation, so none should be dropped.
          force: true,
        });
      },
      stop: () => lenisRef.current?.stop(),
      start: () => lenisRef.current?.start(),
    }),
    []
  );

  // Web fonts swap in after first paint and change every text block's height,
  // which leaves every ScrollTrigger start/end position measured against the
  // fallback face. One refresh once the real fonts land fixes all of them.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      // Touch devices already have native momentum; overriding it feels wrong
      // and costs frame budget we'd rather spend on the reveals.
      syncTouch: false,
    });
    lenisRef.current = lenis;

    // Lenis owns the scroll position, so it also has to own restoring it —
    // otherwise the browser restores a position and Lenis immediately
    // overwrites it from its own cache on the next frame.
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const onScroll = () => {
      // `location.pathname` rather than a captured value: this handler
      // outlives any single render and must record against the live route.
      positions.current.set(window.location.pathname, window.scrollY);
      ScrollTrigger.update();
    };

    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      history.scrollRestoration = previousRestoration;
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  // Track whether the next route change came from the back/forward buttons.
  // `popstate` fires before the router commits the new pathname.
  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /**
   * Place the scroll on route change.
   *
   * Without this, opening a project from halfway down the home page lands you
   * halfway down the case study: Next scrolls the window to the top, then
   * Lenis's next frame writes its own cached offset straight back over it.
   * Lenis has to be told explicitly.
   *
   * `immediate` jumps rather than animating — nobody wants to watch a
   * 4,000px scroll play out after a click. A forward navigation goes to the
   * top; a back/forward returns to where that route was left, using the
   * offsets recorded on scroll above.
   */
  useEffect(() => {
    const lenis = lenisRef.current;
    const pop = isPop.current;
    isPop.current = false;

    const target = pop ? (positions.current.get(pathname) ?? 0) : 0;

    if (!lenis) {
      // Reduced motion: Lenis isn't running, so drive the window directly.
      window.scrollTo({ top: target, behavior: "auto" });
      return;
    }

    lenis.scrollTo(target, { immediate: true, force: true });
    // The incoming page's triggers were measured against the old document
    // height; re-measure now that the scroll has been placed.
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <SmoothScrollContext.Provider value={api}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
