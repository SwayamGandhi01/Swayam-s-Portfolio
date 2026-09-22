import { isPlaceholder, PLACEHOLDER_PREFIX } from "@/data/site";
import { cn } from "@/lib/utils";

export const strip = (value: string) =>
  value.startsWith(PLACEHOLDER_PREFIX)
    ? value.slice(PLACEHOLDER_PREFIX.length).trim()
    : value;

/**
 * Renders a value, and marks it visibly if it is still a placeholder.
 *
 * The point is that nothing unverified can ever be mistaken for a real fact:
 * a placeholder gets a dashed underline and an "edit" tag until someone fills
 * it in, at which point this renders as plain text with no decoration.
 */
export function Editable({
  value,
  className,
  tag = true,
}: {
  value: string;
  className?: string;
  tag?: boolean;
}) {
  if (!isPlaceholder(value)) return <span className={className}>{value}</span>;

  return (
    <span
      className={cn(
        "decoration-dotted underline underline-offset-4 opacity-70",
        className
      )}
      title="Placeholder — update in src/data"
    >
      {strip(value)}
      {tag && (
        <span className="label ml-2 rounded-full border border-[var(--line-strong)] px-1.5 py-0.5 align-middle text-[0.5625rem] opacity-80">
          edit
        </span>
      )}
    </span>
  );
}

/**
 * A link that degrades to plain text when the destination is a placeholder or
 * missing — so the site never ships a link that goes nowhere.
 */
export function EditableLink({
  href,
  children,
  className,
  fallbackLabel = "link pending",
}: {
  href: string | null;
  children: React.ReactNode;
  className?: string;
  fallbackLabel?: string;
}) {
  const unresolved = !href || isPlaceholder(href);

  if (unresolved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 opacity-45 cursor-not-allowed",
          className
        )}
        title="No URL set yet — add one in src/data/projects.ts"
      >
        {children}
        <span className="label text-[0.5625rem]">{fallbackLabel}</span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
    >
      {children}
    </a>
  );
}
