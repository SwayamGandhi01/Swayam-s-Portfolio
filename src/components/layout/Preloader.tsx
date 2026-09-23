"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { site } from "@/data/site";
import { useSmoothScroll } from "./SmoothScroll";
import { INTRO_SEEN_KEY } from "@/lib/constants";

/**
 * First-visit intro.
 *
 * The overlay is rendered on the server and hidden *before first paint* by
 * the blocking script in `layout.tsx`, which checks sessionStorage and the
 * reduced-motion preference. That ordering is the whole point: deciding in an
 * effect would mean returning visitors see a flash of the intro, and deciding
 * during render would mean a hydration mismatch. As a result this component
 * holds no state at all — it either finds itself visible and plays, or finds
 * itself hidden and does nothing.
 *
 * Constraints it is built around:
 *  • Once per tab, not once per navigation.
 *  • ~1.9s, dismissible at any point via Esc, a click, or the Skip control.
 *  • Never mounts its animation under reduced motion.
 *  • The page underneath is fully rendered throughout — this is an overlay,
 *    not a gate, so content is in the DOM for crawlers either way.
 */
export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lenis = useSmoothScroll();

  const skip = useCallback(() => {
    // Fast-forward rather than cut, so the handoff still feels deliberate.
    tlRef.current?.timeScale(7);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Hidden by the pre-paint script — nothing to play.
    if (document.documentElement.dataset.intro === "skip") return;

    // Both locks are needed: `overflow` stops native scrolling, and Lenis has
    // its own wheel handling that ignores it.
    document.body.style.overflow = "hidden";
    lenis.stop();

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        /* storage blocked — the intro simply replays next reload */
      }
      document.documentElement.dataset.intro = "skip";
      document.body.style.overflow = "";
      lenis.start();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });
      tlRef.current = tl;

      tl.to("[data-intro-bar]", {
        scaleX: 1,
        duration: 1.15,
        ease: "power2.inOut",
      })
        .from(
          "[data-intro-word]",
          { yPercent: 110, stagger: 0.08, duration: 0.85, ease: "expo.out" },
          0.1
        )
        .to("[data-intro-meta]", { opacity: 0, duration: 0.3 }, ">-0.1")
        .to(root, { yPercent: -100, duration: 0.9, ease: "power4.inOut" });
    }, root);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      ctx.revert();
      document.body.style.overflow = "";
      lenis.start();
    };
  }, [skip, lenis]);

  return (
    <div
      ref={rootRef}
      data-intro-overlay
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-canvas px-gutter py-8"
      role="status"
      aria-live="polite"
      aria-label="Loading"
      onClick={skip}
    >
      <div className="flex items-start justify-between" data-intro-meta>
        <span className="label text-muted">{site.role}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="label rounded-full border border-[var(--line-strong)] px-3.5 py-1.5 text-muted transition-colors hover:border-signal hover:text-signal"
        >
          Skip intro
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <p className="flex flex-wrap gap-x-[0.28em] overflow-hidden text-d2 font-semibold">
          {site.name.split(" ").map((word) => (
            <span key={word} className="line-mask">
              <span data-intro-word className="block">
                {word}
              </span>
            </span>
          ))}
        </p>
        <div
          className="h-px w-full origin-left scale-x-0 bg-signal"
          data-intro-bar
        />
      </div>

      <span className="label text-muted" data-intro-meta>
        Loading the studio
      </span>
    </div>
  );
}
