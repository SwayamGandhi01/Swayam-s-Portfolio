"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { site } from "@/data/site";
import { careerStartLabel, formatDuration, totalMonths } from "@/data/journey";
import { Button } from "@/components/ui/Button";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { Reveal } from "@/components/ui/Reveal";
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

      <div className="shell relative flex flex-1 flex-col justify-center py-14 sm:py-16">
        <div data-hero-parallax className="max-w-[min(100%,60rem)]">
          {/* 1 — who, and for how long. The role reads first. */}
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

          {/* 2 — the creative line, and the only expressive element here:
                  everything below it is deliberately plain by contrast. */}
          <RevealText
            as="h1"
            className="mt-6 text-d1 font-semibold sm:mt-7"
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

          {/* 3 — what that means in practice, in two measures: the first line
                  makes the claim at full weight, the second qualifies it at
                  lower contrast. Widths in ch so both stay readable. */}
          <RevealText
            immediate
            delay={0.5}
            stagger={0.06}
            className="mt-7 max-w-[48ch] text-lead text-content sm:mt-8"
          >
            {site.tagline}
          </RevealText>

          <RevealText
            immediate
            delay={0.64}
            stagger={0.06}
            className="mt-4 max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted sm:text-base"
          >
            {site.taglineDetail}
          </RevealText>

          {/* 4 — one primary action, two supporting. Each button sits in its
                  own span so the entrance tween and Magnetic's hover drift
                  write to different elements instead of both setting y. */}
          <Reveal
            immediate
            delay={0.8}
            stagger={0.07}
            y={16}
            className="mt-9 flex flex-wrap items-center gap-3 sm:mt-11"
          >
            <span className="inline-flex">
              <Button href="#projects" variant="solid" arrow>
                View selected work
              </Button>
            </span>
            <span className="inline-flex">
              <ResumeButton />
            </span>
            <span className="inline-flex">
              <Button href="#contact" variant="ghost">
                Contact me
              </Button>
            </span>
          </Reveal>

          {/* 5 — technical metadata. Stack and location only: the role is in
                  the eyebrow above and availability is in the header, and
                  repeating either on the same screen is just noise. */}
          <Reveal
            immediate
            delay={0.95}
            y={12}
            className="label mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted sm:mt-10"
          >
            <span>{site.stackSummary}</span>
            <span aria-hidden className="h-3 w-px bg-[var(--line-strong)]" />
            <span>{site.location}</span>
          </Reveal>
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
          {/* The header carries this from md up; this is the same fact at the
              narrow widths where the header hides it. Never both at once. */}
          <span className="label flex items-center gap-2 text-muted md:hidden">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {site.availability}
          </span>
        </div>
      </div>
    </section>
  );
}
