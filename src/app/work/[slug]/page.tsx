import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import {
  adjacentProjects,
  categoryLabel,
  getProject,
  projects,
} from "@/data/projects";
import { isPlaceholder } from "@/data/site";
import {
  coverFor,
  formatCaptured,
  getMedia,
  hasScreenshots,
  lastCapturedAt,
} from "@/data/projectMedia";
import { LivePreview } from "@/components/media/LivePreview";
import { ScreenshotGallery } from "@/components/media/ScreenshotGallery";
import { ProjectMediaActions } from "@/components/media/ProjectMediaActions";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/ui/RevealText";
import { SketchReveal } from "@/components/ui/SketchReveal";
import { Editable, EditableLink, strip } from "@/components/ui/Editable";

// A fixed list of slugs with no external data source — prerender them all.
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const title = strip(project.title);
  const description = strip(project.description);
  // The real desktop screenshot doubles as the share card.
  const cover = project.image ?? coverFor(project.slug, title);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cover ? [cover] : undefined,
    },
    // Entries whose brief isn't confirmed shouldn't be indexed yet.
    robots: isPlaceholder(project.description) ? { index: false } : undefined,
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { prev, next } = adjacentProjects(slug);
  const media = getMedia(project.slug, strip(project.title));
  const cover = project.image ?? coverFor(project.slug, strip(project.title));
  const lastCapture = lastCapturedAt(media);
  const capturedOn = formatCaptured(lastCapture);
  const contributionConfirmed = project.contribution.some(
    (c) => !isPlaceholder(c)
  );

  return (
    <article className="pt-[var(--header-h)]">
      {/* ---- Header ---- */}
      <header className="shell pb-16 pt-16 md:pt-24">
        <Reveal y={16}>
          <Link
            href="/#projects"
            className="label group inline-flex items-center gap-2.5 text-muted transition-colors hover:text-signal"
          >
            <ArrowLeft
              aria-hidden
              className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-x-1"
            />
            All projects
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <RevealText as="h1" className="text-d1 font-semibold" stagger={0.09}>
              <Editable value={project.title} tag={false} />
            </RevealText>

            <Reveal y={20} delay={0.15} className="mt-7 max-w-[54ch]">
              <p className="text-lead text-muted">
                <Editable value={project.description} tag={false} />
              </p>
            </Reveal>

            <Reveal y={16} delay={0.2} className="mt-7">
              <ul className="flex flex-wrap gap-2">
                {project.category.map((c) => (
                  <li
                    key={c}
                    className="label rounded-full border border-[var(--line)] px-3 py-1.5 text-muted"
                  >
                    {categoryLabel(c)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:pl-6">
            <Reveal stagger={0.08} className="hairline-t pt-5">
              {project.year && (
                <div className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                  <span className="label text-muted">Year</span>
                  <span className="text-right text-sm">{project.year}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                <span className="label text-muted">Live</span>
                <span className="text-right text-sm">
                  <EditableLink
                    href={project.liveUrl ?? null}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-signal"
                    fallbackLabel="url pending"
                  >
                    Visit site
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </EditableLink>
                </span>
              </div>
              {project.productionUrl && (
                <div className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                  <span className="label text-muted">Production</span>
                  <span className="text-right text-sm">
                    <a
                      href={project.productionUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-signal"
                    >
                      Visit site
                      <ArrowUpRight aria-hidden className="size-3.5" />
                    </a>
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                <span className="label text-muted">Code</span>
                <span className="text-right text-sm">
                  <EditableLink
                    href={project.githubUrl ?? null}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-signal"
                    fallbackLabel="private"
                  >
                    Repository
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </EditableLink>
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ---- Cover: the real desktop screenshot ---- */}
      {cover && (
        <div className="shell">
          <Reveal y={28}>
            <SketchReveal
              src={cover}
              alt={`Screenshot of the ${strip(project.title)} website homepage`}
              sizes="100vw"
              priority
              mode="inview"
              className="aspect-16/9 w-full rounded-sm border border-[var(--line)] md:aspect-21/9"
            />
          </Reveal>
          {capturedOn && (
            <p className="mt-3 text-xs text-muted">
              Captured from the live site on{" "}
              <time dateTime={lastCapture ?? undefined}>{capturedOn}</time>
            </p>
          )}
        </div>
      )}

      {/* ---- Body ---- */}
      <div className="shell grid gap-14 py-24 lg:grid-cols-12 lg:gap-12 lg:py-32">
        <div className="lg:col-span-7">
          {project.overview && (
            <Reveal stagger={0.1}>
              <h2 className="label text-signal">Overview</h2>
              <p className="mt-6 text-lead leading-relaxed text-muted">
                <Editable value={project.overview} tag={false} />
              </p>
            </Reveal>
          )}

          <Reveal stagger={0.08} className={project.overview ? "mt-16" : ""}>
            <h2 className="label text-signal">My contribution</h2>

            {contributionConfirmed ? (
              <ul className="mt-6 space-y-px">
                {project.contribution.map((item, i) => (
                  <li
                    key={item}
                    className="flex gap-5 border-b border-[var(--line)] py-4"
                  >
                    <span className="mt-1 font-mono text-[0.625rem] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-relaxed">
                      <Editable value={item} tag={false} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              /* Explicitly says nothing is claimed yet, rather than leaving a
                 blank section that reads as "nothing to say". */
              <div className="mt-6 rounded-sm border border-dashed border-[var(--line-strong)] p-6">
                <p className="text-sm leading-relaxed text-muted">
                  This case study is awaiting its write-up. The site is live and
                  linked above, but the specific contribution hasn&rsquo;t been
                  documented here yet — so nothing is claimed for it.
                </p>
                <p className="mt-3 font-mono text-xs text-muted">
                  Add it to <code>contribution</code> in{" "}
                  <code>src/data/projects.ts</code>.
                </p>
              </div>
            )}
          </Reveal>
        </div>

        <aside className="lg:col-span-5 lg:pl-8">
          <Reveal y={28} className="lg:sticky lg:top-28">
            <div className="rounded-sm border border-[var(--line)] bg-ink-2/50 p-7">
              {project.features && project.features.length > 0 && (
                <>
                  <h2 className="label text-signal">Key features</h2>
                  <ul className="mt-5 space-y-3">
                    {project.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-sm leading-relaxed"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.5rem] size-1 shrink-0 rounded-full bg-signal"
                        />
                        <span className="text-muted">
                          <Editable value={feature} tag={false} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h2
                className={`label text-signal ${project.features?.length ? "mt-10" : ""}`}
              >
                Technologies
              </h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <li
                    key={tech}
                    className="label rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-muted"
                  >
                    <Editable value={tech} />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </aside>
      </div>

      {/* ---- Live preview ---- */}
      {project.liveUrl && (
        <div className="shell pb-24 lg:pb-32">
          <div className="hairline-t pt-12">
            <LivePreview
              title={strip(project.title)}
              url={project.liveUrl}
              media={media}
            />
          </div>

          {/* The screenshot gallery appears here automatically once real
              captures replace the placeholders — see MEDIA.md. Until then it
              would only show empty frames, so it stays hidden. */}
          {hasScreenshots(media) && media && (
            <div className="mt-20">
              <ScreenshotGallery
                shots={media.screenshots}
                projectTitle={strip(project.title)}
              />
            </div>
          )}

          {media?.video && (
            <div className="mt-16 flex flex-col gap-5 rounded-sm border border-[var(--line)] bg-ink-2/50 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Website walkthrough
                </h2>
                <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted">
                  A short recorded tour of the build.
                </p>
              </div>

              <ProjectMediaActions
                title={strip(project.title)}
                media={media}
                variant="detail"
                className="shrink-0"
              />
            </div>
          )}
        </div>
      )}

      {/* ---- Prev / next ---- */}
      {prev && next && (
        <nav
          aria-label="More projects"
          className="shell hairline-t grid gap-px pb-24 sm:grid-cols-2"
        >
          <Link
            href={`/work/${prev.slug}`}
            className="group flex flex-col gap-2 py-9 pr-6"
          >
            <span className="label flex items-center gap-2.5 text-muted transition-colors group-hover:text-signal">
              <ArrowLeft
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-x-1"
              />
              Previous
            </span>
            <span className="text-2xl font-semibold tracking-tight transition-colors group-hover:text-signal">
              <Editable value={prev.title} tag={false} />
            </span>
          </Link>
          <Link
            href={`/work/${next.slug}`}
            className="group flex flex-col items-start gap-2 border-t border-[var(--line)] py-9 sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:text-right"
          >
            <span className="label flex items-center gap-2.5 text-muted transition-colors group-hover:text-signal">
              Next
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
              />
            </span>
            <span className="text-2xl font-semibold tracking-tight transition-colors group-hover:text-signal">
              <Editable value={next.title} tag={false} />
            </span>
          </Link>
        </nav>
      )}
    </article>
  );
}
