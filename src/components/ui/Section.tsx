import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/**
 * Section shell. Every major band of the page uses this so vertical rhythm,
 * content width and the hairline rules stay identical throughout.
 */
export function Section({
  id,
  children,
  className,
  bare = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Skip the `.shell` wrapper for full-bleed content. */
  bare?: boolean;
}) {
  return (
    <section
      id={id}
      // scroll-margin keeps anchor targets clear of the fixed header
      className={cn("relative scroll-mt-24 py-24 md:py-32 lg:py-40", className)}
    >
      {bare ? children : <div className="shell">{children}</div>}
    </section>
  );
}

/**
 * The recurring section header: a mono index + label on the rule, then the
 * headline. Consistent across all six sections.
 */
export function SectionHeading({
  index,
  label,
  title,
  intro,
  className,
}: {
  index: string;
  label: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("hairline-t pt-6", className)}>
      <Reveal stagger={0.08}>
        <div className="label flex items-center gap-3 text-muted">
          <span className="text-signal">{index}</span>
          <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
          <span>{label}</span>
        </div>
        <h2 className="mt-8 max-w-[22ch] text-d2 font-semibold">{title}</h2>
        {intro && (
          <p className="mt-6 max-w-[52ch] text-lead text-muted">{intro}</p>
        )}
      </Reveal>
    </header>
  );
}
