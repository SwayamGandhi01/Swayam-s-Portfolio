"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ImageOff } from "lucide-react";
import type { Project } from "@/data/projects";
import { categoryLabel } from "@/data/projects";
import { isPlaceholder } from "@/data/site";
import { cn } from "@/lib/utils";
import { Editable } from "@/components/ui/Editable";
import { coverFor, getMedia } from "@/data/projectMedia";
import { ProjectMediaActions } from "@/components/media/ProjectMediaActions";

/**
 * A project tile in the filterable grid.
 *
 * Link structure matters here. The card is not one big `<a>` — the title link
 * carries an `::after` overlay that covers the tile, which gives a single tab
 * stop and the whole card as a click target, while the "Visit site" link sits
 * above that overlay on its own. Nesting one anchor inside another would be
 * invalid and unreachable by keyboard.
 *
 * Entry and filter motion are owned by the parent grid (one batched
 * ScrollTrigger and one Flip timeline), not by per-card triggers — 16 cards
 * each with their own scroll trigger and parallax would be a lot of work per
 * frame for very little visible gain.
 */
export function ProjectCard({
  project,
  hidden,
}: {
  project: Project;
  hidden: boolean;
}) {
  // Only show technology chips once they're real; a row of "[edit]" pills is
  // noise. Categories always carry useful information, so they show instead.
  const techConfirmed = project.technologies.some((t) => !isPlaceholder(t));
  const media = getMedia(project.slug, project.title);
  const cover = project.image ?? coverFor(project.slug, project.title);

  return (
    <article
      data-project
      data-slug={project.slug}
      className={cn(
        "group/card relative flex flex-col",
        hidden && "hidden"
      )}
    >
      <div className="relative overflow-hidden rounded-lg border border-[var(--line)] shadow-[var(--shadow-card)] transition-colors duration-500 group-hover/card:border-signal/45 group-focus-within/card:border-signal/45">
        {/* The aspect box reserves the space before the image decodes, so a
            grid of sixteen screenshots never shifts the layout. */}
        <div className="relative aspect-16/10">
          {cover ? (
            /* Shown in full colour. These are real captures of the client
               sites, so their own branding is the point — a desaturating
               filter here would be actively working against the content. */
            <Image
              src={cover}
              alt={`Screenshot of the ${project.title} website homepage`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-top transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.04]"
            />
          ) : (
            /* No capture on file — a designed empty state, never a broken
               image. The live link below stays available regardless. */
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface">
              <div className="blueprint absolute inset-0 opacity-40" aria-hidden />
              <ImageOff aria-hidden className="relative size-5 text-muted" />
              <p className="label relative text-muted">Preview unavailable</p>
            </div>
          )}
        </div>

        {project.featured && (
          <span className="label absolute left-3 top-3 rounded-full bg-canvas/80 px-2.5 py-1.5 text-content backdrop-blur-sm">
            Featured
          </span>
        )}

        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-signal transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover/card:scale-x-100 group-focus-within/card:scale-x-100"
        />
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <ul className="flex flex-wrap gap-x-2.5 gap-y-1">
          {project.category.map((c) => (
            <li key={c} className="label text-muted">
              {categoryLabel(c)}
            </li>
          ))}
        </ul>

        <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          <Link
            href={`/work/${project.slug}`}
            data-cursor="Open case"
            // The overlay makes the whole tile clickable from one anchor.
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-8"
          >
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-[var(--ease-out-expo)] group-hover/card:bg-[length:100%_1px]">
              <Editable value={project.title} tag={false} />
            </span>
          </Link>
        </h3>

        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
          <Editable value={project.description} tag={false} />
        </p>

        {techConfirmed && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((t) => (
              <li
                key={t}
                className="label rounded-full border border-[var(--line)] px-2.5 py-1.5 text-muted"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* Pushed to the bottom so action rows line up across a row of
            cards whose descriptions differ in length. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectMediaActions
              title={project.title}
              liveUrl={project.liveUrl}
              media={media}
            />
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                // Above the title link's overlay, so it stays independently
                // clickable and focusable.
                className="label relative z-10 inline-flex items-center gap-1.5 text-muted transition-colors hover:text-signal"
              >
                Open site
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            )}
          </div>

          {/* Visible affordance for the case study. Deliberately a span, not
              a link: the title's ::after already covers the whole tile, and a
              second anchor inside it would be invalid and unreachable. It's
              hidden from assistive tech because the title link says the same
              thing and is the real control. */}
          <span
            aria-hidden
            className="label inline-flex items-center gap-1.5 text-muted transition-colors duration-300 group-hover/card:text-signal group-focus-within/card:text-signal"
          >
            Case study
            <ArrowRight
              className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/card:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
