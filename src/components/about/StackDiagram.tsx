"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * A cross-section of a full stack build, in place of a portrait.
 *
 * This exists to carry the section's actual claim — that the interface and
 * the systems underneath it get built as one thing — rather than to fill the
 * column the photo used to occupy. The API layer is marked as the seam
 * because that is where the two halves meet and where most of the friction
 * in a project lives; the copy next to it says exactly that.
 *
 * Every technology named here also appears in `src/data/stack.ts`. This is a
 * curated cross-section of that list, framed as layers rather than as
 * categories.
 */

type Layer = {
  index: string;
  name: string;
  role: string;
  tech: string[];
  /** The frontend/backend boundary, highlighted in the accent. */
  seam?: boolean;
};

const LAYERS: Layer[] = [
  {
    index: "01",
    name: "Interface",
    role: "What people touch",
    tech: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
  },
  {
    index: "02",
    name: "API surface",
    role: "Where the halves meet",
    tech: ["REST APIs", "Integrations", "Response shape"],
    seam: true,
  },
  {
    index: "03",
    name: "Services",
    role: "What runs behind it",
    tech: ["Node.js", "Express.js", "Strapi CMS"],
  },
  {
    index: "04",
    name: "Data",
    role: "What it rests on",
    tech: ["MongoDB", "Content models"],
  },
];

export function StackDiagram({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-layer]");
      gsap.set(layers, { opacity: 0, y: 22 });
      gsap.set("[data-spine]", { scaleY: 0 });

      // One timeline: the spine draws downward and each layer lands as it
      // passes. Transform and opacity only, so it stays on the compositor.
      gsap
        .timeline({
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        })
        .to("[data-spine]", { scaleY: 1, duration: 0.9, ease: "power2.inOut" })
        .to(
          layers,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.12,
            clearProps: "transform",
          },
          0.15
        );
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    // Not `role="img"` — that would make this a leaf node and hide the
    // technology names from assistive tech. It is a list of text, so it stays
    // a list of text.
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Spine linking the layers, aligned to the centre of each node:
          16px panel padding + 5px half-node = 21px. The panels are
          translucent, so it reads as running behind them. */}
      <div
        aria-hidden
        className="absolute bottom-6 left-[21px] top-6 w-px bg-[var(--line-strong)]"
      >
        <div data-spine className="h-full w-full origin-top bg-signal/50" />
      </div>

      <ol className="space-y-3">
        {LAYERS.map((layer) => (
          <li key={layer.index} data-layer>
            <div
              className={cn(
                "group relative flex gap-4 rounded-sm border bg-paper-2/60 p-4 transition-colors duration-500",
                layer.seam
                  ? "border-signal/35 bg-signal/[0.06]"
                  : "border-[var(--line)] hover:border-[var(--line-strong)]"
              )}
            >
              {/* Node on the spine. */}
              <span
                aria-hidden
                className={cn(
                  "relative mt-0.5 size-2.5 shrink-0 rounded-full",
                  layer.seam ? "bg-signal" : "bg-ink/35"
                )}
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-mono text-[0.625rem] tracking-[0.16em] text-signal">
                    {layer.index}
                  </span>
                  <h3 className="text-[0.9375rem] font-semibold tracking-tight">
                    {layer.name}
                  </h3>
                  <span className="label text-muted-ink">{layer.role}</span>
                </div>

                <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                  {layer.tech.map((item) => (
                    <li
                      key={item}
                      className="font-mono text-[0.6875rem] text-muted-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
