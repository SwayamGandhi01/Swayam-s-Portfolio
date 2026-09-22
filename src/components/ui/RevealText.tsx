"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Play on mount rather than on scroll — used for the hero. */
  immediate?: boolean;
  start?: string;
};

/**
 * Line-by-line masked text reveal.
 *
 * SplitText wraps each rendered line in an overflow-hidden mask and the line
 * slides up from underneath it. `autoSplit` re-splits on resize and font
 * swaps, which matters because line breaks move with the viewport; we also
 * wait on `document.fonts.ready` so the first split measures the real face
 * rather than the fallback.
 */
export function RevealText({
  children,
  as = "div",
  className,
  delay = 0,
  stagger = 0.09,
  immediate = false,
  start = "top 85%",
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // See Reveal.tsx — narrowed once instead of threading generics everywhere.
  const Tag = as as "div";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let split: SplitText | undefined;
    let cancelled = false;

    // Hide before paint so the un-split text never flashes.
    gsap.set(el, { autoAlpha: 0 });

    const run = () => {
      if (cancelled || !ref.current) return;
      gsap.set(el, { autoAlpha: 1 });

      split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.15,
            ease: "expo.out",
            stagger,
            delay,
            ...(immediate
              ? {}
              : { scrollTrigger: { trigger: el, start, once: true } }),
          }),
      });
    };

    // `fonts.ready` resolves immediately when fonts are already cached.
    document.fonts.ready.then(run);

    return () => {
      cancelled = true;
      split?.revert();
      gsap.set(el, { autoAlpha: 1 });
    };
  }, [reduced, delay, stagger, immediate, start]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
