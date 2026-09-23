"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { site } from "@/data/site";
import { careerStartLabel, formatDuration, totalMonths } from "@/data/journey";
import { Button } from "@/components/ui/Button";
import { RevealText } from "@/components/ui/RevealText";
import { HeroFallback } from "@/components/three/HeroFallback";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";

// three.js and R3F stay out of the initial bundle entirely; the hero paints
// its full layout with the CSS fallback and swaps in the canvas once idle.
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), {
  ssr: false,
  loading: () => null,
});

function useIdleMount(enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(id);
  }, [enabled]);
  return ready;
}

export function Hero() {
  const reduced = useReducedMotion();
  const lenis = useSmoothScroll();
  const rootRef = useRef<HTMLElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // No canvas under reduced motion — a perpetually animating field is exactly
  // what that preference rules out.
  const wantsCanvas = !reduced && !webglFailed;
  const canvasReady = useIdleMount(wantsCanvas);

  const experience = formatDuration(totalMonths());

  // Gentle parallax: the copy drifts up and fades as the next section arrives.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.to("[data-hero-parallax]", {
        yPercent: -14,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-[var(--header-h)]"
    >
      {/* Background stack: grid texture → visual field → vignette. */}
      <div
        aria-hidden
        className="blueprint absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_10%,transparent_75%)]"
      />
      {canvasReady ? (
        <HeroCanvas onUnavailable={() => setWebglFailed(true)} />
      ) : (
        <HeroFallback />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-canvas to-transparent"
      />

      <div className="shell relative flex flex-1 flex-col justify-center py-16">
        <div data-hero-parallax className="max-w-[min(100%,60rem)]">
          <RevealText
            immediate
            delay={0.1}
            stagger={0.06}
            className="label flex flex-wrap items-center gap-x-4 gap-y-2 text-muted"
          >
            <span className="text-signal">{site.role}</span>
            <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
            {/* Computed from today's date, so the browser's value can differ
                from the one baked in at build time. The browser is right. */}
            <span suppressHydrationWarning>
              Working professionally since {careerStartLabel} · {experience}
            </span>
          </RevealText>

          <RevealText
            as="h1"
            className="mt-7 text-d1 font-semibold"
            immediate
            delay={0.24}
            stagger={0.1}
          >
            {site.headline.lead}{" "}
            <span className="em-serif text-signal">
              {site.headline.emphasis}
            </span>{" "}
            {site.headline.trail}
          </RevealText>

          <RevealText
            immediate
            delay={0.5}
            stagger={0.06}
            className="mt-8 max-w-[46ch] text-lead text-muted"
          >
            {site.tagline}
          </RevealText>

          <div className="mt-11 flex flex-wrap items-center gap-3">
            <Button href="#projects" variant="solid" arrow>
              View projects
            </Button>
            <Button href="#contact" variant="outline">
              Contact me
            </Button>
          </div>
        </div>
      </div>

      <div className="shell relative hairline-t py-5">
        <div className="flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => lenis.scrollTo("#about")}
            className="label group flex items-center gap-3 text-muted transition-colors hover:text-content"
          >
            <ArrowDown
              aria-hidden
              className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-1"
            />
            Scroll to explore
          </button>
          <span className="label hidden text-muted sm:block">
            React · Next.js · Node · Strapi
          </span>
        </div>
      </div>
    </section>
  );
}
