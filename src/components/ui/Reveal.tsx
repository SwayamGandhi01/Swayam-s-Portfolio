"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Distance travelled, in px. */
  y?: number;
  delay?: number;
  /** Stagger the element's direct children instead of the element itself. */
  stagger?: number | false;
  /** Viewport position that triggers the reveal. */
  start?: string;
};

/**
 * Scroll-triggered entrance.
 *
 * The markup renders visible on the server — the hidden state is applied in a
 * layout effect, before the browser paints — so content is present for
 * crawlers, for no-JS readers, and for anyone with reduced motion enabled.
 * Only `opacity` and `transform` animate, which keeps the work on the
 * compositor and off the main thread.
 */
export function Reveal({
  children,
  as = "div",
  className,
  y = 28,
  delay = 0,
  stagger = false,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // `as` is always a plain container element (div/header/ul/…). TypeScript
  // can't resolve ref+className across a generic ElementType, so narrow once
  // here rather than threading generics through every call site.
  const Tag = as as "div";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const targets =
        stagger !== false ? Array.from(el.children) : ([el] as Element[]);
      if (!targets.length) return;

      gsap.set(targets, { opacity: 0, y, willChange: "transform, opacity" });

      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        delay,
        ease: "expo.out",
        stagger: stagger === false ? 0 : stagger,
        clearProps: "willChange",
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, y, delay, stagger, start]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
