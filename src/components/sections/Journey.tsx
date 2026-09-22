"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import {
  careerStartLabel,
  formatDuration,
  rolePeriod,
  roleMonths,
  roles,
  totalMonths,
} from "@/data/journey";
import { Section, SectionHeading } from "@/components/ui/Section";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      // The spine fills as the section passes through the viewport.
      gsap.fromTo(
        "[data-spine]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 70%",
            end: "bottom 75%",
            scrub: 0.5,
          },
        }
      );

      // Each entry fades up and its node snaps on as it arrives.
      gsap.utils.toArray<HTMLElement>("[data-entry]").forEach((entry) => {
        gsap.set(entry, { opacity: 0, y: 36 });
        gsap.to(entry, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: entry, start: "top 82%", once: true },
        });
        gsap.to(entry.querySelector("[data-node]"), {
          backgroundColor: "var(--color-signal)",
          borderColor: "var(--color-signal)",
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          scrollTrigger: { trigger: entry, start: "top 78%", once: true },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <Section id="experience">
      <SectionHeading
        index="05"
        label="Experience"
        title={
          <>
            Where the work has{" "}
            <span className="em-serif text-signal">happened</span>
          </>
        }
        intro={
          <>
            Working professionally since {careerStartLabel} —{" "}
            {/* Durations are measured against today's date, so what the
                browser computes can differ from what was baked in at build
                time once a month rolls over. The browser's value is the
                correct one; React is told not to warn about the difference. */}
            <span suppressHydrationWarning className="text-paper">
              {formatDuration(totalMonths())}
            </span>{" "}
            across two roles, listed most recent first.
          </>
        }
      />

      <div ref={ref} className="relative mt-20">
        {/* Spine */}
        <div
          aria-hidden
          className="absolute bottom-0 left-[7px] top-2 w-px bg-[var(--line)] md:left-[calc(11rem+7px)]"
        >
          <div data-spine className="h-full w-full origin-top bg-signal/70" />
        </div>

        <ol className="space-y-14">
          {roles.map((role) => (
            <li key={role.id} data-entry className="relative pl-10 md:pl-0">
              <div className="md:grid md:grid-cols-[11rem_1fr] md:gap-0">
                <div className="md:pr-10 md:text-right">
                  <p className="label text-muted">{rolePeriod(role)}</p>
                  <p
                    suppressHydrationWarning
                    className="mt-1 font-mono text-[0.625rem] tracking-[0.16em] text-muted"
                  >
                    {formatDuration(roleMonths(role))}
                  </p>
                </div>

                <div className="relative md:pl-10">
                  {/* Node */}
                  <span
                    data-node
                    aria-hidden
                    className="absolute -left-10 top-1.5 size-3.5 scale-75 rounded-full border border-[var(--line-strong)] bg-ink md:left-0"
                    style={
                      reduced
                        ? {
                            backgroundColor: "var(--color-signal)",
                            borderColor: "var(--color-signal)",
                            transform: "scale(1)",
                          }
                        : undefined
                    }
                  />

                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {role.role}
                  </h3>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-paper">
                      {role.company}
                    </span>
                    {role.end === null && (
                      <span className="label inline-flex items-center gap-1.5 text-signal">
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-signal"
                        />
                        Current
                      </span>
                    )}
                  </p>

                  <p className="mt-4 max-w-[58ch] leading-relaxed text-muted">
                    {role.body}
                  </p>

                  {role.tags.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <li
                          key={tag}
                          className="label rounded-full border border-[var(--line)] px-2.5 py-1.5 text-muted"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
