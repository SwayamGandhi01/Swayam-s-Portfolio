"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import {
  careerStartLabel,
  formatDuration,
  monogram,
  roleDates,
  roleMonths,
  roles,
  totalMonths,
  type Role,
} from "@/data/journey";
import Link from "next/link";
import { getProject } from "@/data/projects";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
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

      // Per entry: the card lands, its node snaps on, then the tech pills
      // fill in behind it. One timeline each, so the order is guaranteed
      // rather than three triggers racing.
      gsap.utils.toArray<HTMLElement>("[data-entry]").forEach((entry) => {
        const card = entry.querySelector("[data-card]");
        const node = entry.querySelector("[data-node]");
        const fill = entry.querySelector("[data-node-fill]");
        const tags = entry.querySelectorAll("[data-tag]");

        gsap.set(card, { opacity: 0, y: 36 });
        if (tags.length) gsap.set(tags, { opacity: 0, y: 8 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: entry, start: "top 82%", once: true },
        });

        // Only transforms are tweened. The accent lives on a separate fill
        // layer styled in CSS, because GSAP resolves `var(--color-signal)`
        // once and writes the result inline — which would leave the previous
        // theme's orange frozen on the node after a switch.
        tl.to(card, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" })
          .to(node, { scale: 1, duration: 0.45, ease: "back.out(2)" }, 0.1)
          .to(fill, { scale: 1, duration: 0.45, ease: "back.out(2)" }, 0.1);

        if (tags.length) {
          tl.to(
            tags,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.035,
              ease: "power2.out",
              clearProps: "transform",
            },
            0.35
          );
        }
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <Section id="experience" className="relative overflow-hidden">
      {/* Depth, barely there: a blueprint grid and one warm bloom behind the
          heading. Both masked so they never compete with the type. */}
      <div
        aria-hidden
        className="blueprint pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_45%_at_18%_12%,#000,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 size-[36rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-signal)_11%,transparent),transparent_68%)] blur-2xl"
      />

      <div className="relative">
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
              {/* Derived from today's date, so the value the browser computes
                  can differ from the one baked in at build time once a month
                  rolls over. The browser's is correct. */}
              <span suppressHydrationWarning className="text-content">
                {formatDuration(totalMonths())}
              </span>{" "}
              across two roles, listed most recent first.
            </>
          }
        />

        <div ref={ref} className="relative mt-16">
          {/* Spine */}
          <div
            aria-hidden
            className="absolute bottom-0 left-[7px] top-3 w-px bg-[var(--line)] md:left-[calc(12rem+7px)]"
          >
            <div data-spine className="h-full w-full origin-top bg-signal/70" />
          </div>

          <ol className="space-y-8 md:space-y-10">
            {roles.map((role) => (
              <RoleEntry key={role.id} role={role} reduced={reduced} />
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

function RoleEntry({ role, reduced }: { role: Role; reduced: boolean }) {
  const { from, to } = roleDates(role);
  const current = role.end === null;
  const duration = formatDuration(roleMonths(role));
  const built = (role.projects ?? [])
    .map((slug) => getProject(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <li data-entry className="relative pl-10 md:pl-0">
      <div className="md:grid md:grid-cols-[12rem_1fr] md:gap-0">
        {/* ── Date metadata ──
            Stacked and right-aligned against the spine on desktop; a single
            inline row on mobile, where a narrow column would just cramp. */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pb-4 md:flex-col md:items-end md:gap-y-1.5 md:pb-0 md:pr-10 md:pt-5">
          <span className="label text-content">{from}</span>
          <span aria-hidden className="label text-muted md:hidden">
            —
          </span>
          {/* Vertical tick between the two dates — desktop only, where they
              stack. On mobile the em dash above does the same job inline. */}
          <span
            aria-hidden
            className="hidden h-3 w-px bg-[var(--line-strong)] md:block"
          />
          <span className="label text-muted">{to}</span>
          <span
            suppressHydrationWarning
            className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[0.625rem] tracking-[0.12em] text-muted md:mt-2"
          >
            {duration}
          </span>
        </div>

        {/* ── Card ── */}
        <div className="relative md:pl-10">
          {/* Node on the spine. The current role gets a slow halo; the global
              reduced-motion rule stops it for anyone who asks. */}
          <span
            data-node
            aria-hidden
            className={cn(
              "absolute -left-10 top-6 size-3.5 rounded-full border border-[var(--line-strong)] bg-canvas md:left-0",
              !reduced && "scale-75"
            )}
          >
            <span
              data-node-fill
              className={cn(
                // Inset -1px so the fill covers the ring's own border.
                "absolute inset-[-1px] rounded-full bg-signal",
                !reduced && "scale-0"
              )}
            />
          </span>
          {current && (
            <span
              aria-hidden
              className="motion-safe-only absolute -left-10 top-6 size-3.5 animate-ping rounded-full bg-signal/40 md:left-0"
            />
          )}

          <article
            data-card
            className={cn(
              "group relative overflow-hidden rounded-lg border p-6 sm:p-8",
              "bg-gradient-to-b from-surface/80 to-surface/30 shadow-[var(--shadow-card)]",
              "transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out-expo)]",
              "hover:-translate-y-1 hover:border-signal/35",
              "hover:shadow-[0_18px_48px_-24px_color-mix(in_oklab,var(--color-signal)_55%,transparent)]",
              current ? "border-signal/25" : "border-[var(--line)]"
            )}
          >
            {/* Hairline of accent along the top of the current role's card. */}
            {current && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-signal/70 via-signal/20 to-transparent"
              />
            )}

            <div className="flex items-start gap-4">
              {/* Neutral monogram, built from the company name. Not a logo —
                  we don't hold rights to any of these marks. */}
              <span
                aria-hidden
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md border font-mono text-sm tracking-[0.08em] transition-colors duration-500",
                  current
                    ? "border-signal/30 bg-signal/10 text-signal"
                    : "border-[var(--line-strong)] bg-canvas/40 text-muted"
                )}
              >
                {monogram(role.company)}
              </span>

              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {role.role}
                </h3>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                  <span className="font-medium text-content">{role.company}</span>
                  {current && (
                    <span className="label inline-flex items-center gap-1.5 rounded-full border border-signal/35 bg-signal/10 px-2.5 py-1 text-signal">
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-signal"
                      />
                      Current
                    </span>
                  )}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-[62ch] leading-relaxed text-muted">
              {role.body}
            </p>

            {/* Scannable restatement of the paragraph above. Rendered as a
                real list so a screen reader announces the item count, and
                skipped entirely for roles with nothing confirmed rather than
                leaving an empty stub. */}
            {role.highlights.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {role.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3.5 text-[0.9375rem] leading-relaxed text-muted"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.6875rem] h-px w-3 shrink-0 bg-[var(--line-strong)] transition-colors duration-500 group-hover:bg-signal"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* The projects built in this role, linked to their case studies.
                Resolved from slugs at render time, so a renamed or removed
                project drops out here instead of leaving a dead link. */}
            {built.length > 0 && (
              <div className="mt-6 border-t border-[var(--line)] pt-6">
                <p className="label text-muted">Projects built in this role</p>
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
                  {built.map((project) => (
                    <li key={project.slug}>
                      <Link
                        href={`/work/${project.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-muted transition-colors duration-300 hover:border-signal hover:text-signal"
                      >
                        {project.title}
                        <ArrowUpRight aria-hidden className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {role.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-6">
                {role.tags.map((tag) => (
                  <li
                    key={tag}
                    data-tag
                    className="label inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-canvas/30 px-2.5 py-1.5 text-muted transition-colors duration-300 group-hover:border-[var(--line-strong)]"
                  >
                    <span
                      aria-hidden
                      className="size-1 rounded-full bg-muted transition-colors duration-300 group-hover:bg-signal"
                    />
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </li>
  );
}
