"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Flip, gsap, ScrollTrigger } from "@/lib/gsap";
import { categoriesInUse, orderedProjects } from "@/data/projects";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ProjectFilters } from "@/components/work/ProjectFilters";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The filterable project showcase.
 *
 * Every card stays mounted and filtering toggles a `hidden` class, for two
 * reasons: all 16 projects are then present in the server HTML for crawlers,
 * and GSAP Flip can animate the re-layout because it has the same DOM nodes
 * before and after. Unmounting would give Flip nothing to match against.
 *
 * The Flip state is captured in the click handler — *before* React re-renders
 * — and replayed in a layout effect once the new layout has been committed
 * but before the browser paints it. That's the whole trick: the user sees one
 * continuous motion from the old grid to the new one rather than a jump.
 */
export function Projects() {
  const [filter, setFilter] = useState<string>("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const reduced = useReducedMotion();

  const matches = useCallback(
    (categories: readonly string[]) =>
      filter === "all" || categories.includes(filter),
    [filter]
  );

  const handleChange = useCallback(
    (next: string) => {
      if (!reduced && gridRef.current) {
        flipState.current = Flip.getState(
          gridRef.current.querySelectorAll("[data-project]")
        );
      }
      setFilter(next);
    },
    [reduced]
  );

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || reduced) return;
    flipState.current = null;

    Flip.from(state, {
      duration: 0.62,
      ease: "power3.inOut",
      scale: true,
      // Take the moving cards out of flow for the duration, so the rest of
      // the grid doesn't reflow underneath them mid-animation.
      absolute: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.45, delay: 0.12, ease: "power2.out" }
        ),
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3, ease: "power2.in" }),
      // The section's height just changed, so every trigger below it is now
      // measured against a stale document height.
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter, reduced]);

  // One batched entry animation for the whole grid rather than 16 triggers.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduced) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-project]", grid);
      gsap.set(cards, { opacity: 0, y: 48 });

      ScrollTrigger.batch(cards, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "expo.out",
            stagger: 0.08,
            // Hand a clean transform state to Flip, which reads computed
            // layout and would otherwise inherit these leftovers.
            clearProps: "transform,opacity",
          }),
      });
    }, grid);

    return () => ctx.revert();
  }, [reduced]);

  const visibleCount = orderedProjects.filter((p) =>
    matches(p.category)
  ).length;

  return (
    <Section id="projects">
      <SectionHeading
        index="04"
        label="Projects"
        title={
          <>
            Selected work, and the{" "}
            <span className="em-serif text-signal">part</span> I played in it
          </>
        }
        intro="Frontend builds, backend services, CMS architecture, redesigns and landing pages. Filter by discipline or sector — each case study covers what the project was and exactly what I contributed."
      />

      <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <ProjectFilters
          options={categoriesInUse}
          value={filter}
          onChange={handleChange}
        />
        <p aria-live="polite" className="label shrink-0 text-muted">
          {visibleCount} {visibleCount === 1 ? "project" : "projects"}
        </p>
      </div>

      <div
        ref={gridRef}
        className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3"
      >
        {orderedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            hidden={!matches(project.category)}
          />
        ))}
      </div>
    </Section>
  );
}
