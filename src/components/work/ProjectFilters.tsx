"use client";

import { cn } from "@/lib/utils";

export type FilterOption = {
  id: string;
  label: string;
  count: number;
};

/**
 * Category filter bar.
 *
 * Built as a radio group rather than a row of buttons: exactly one option is
 * active at a time, which is what a radio group means, and it gives arrow-key
 * navigation for free. Only the selected chip is in the tab order (roving
 * tabindex is the browser's default behaviour for same-named radios), so
 * keyboard users don't have to tab through nine chips to reach the grid.
 */
export function ProjectFilters({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Filter projects by category</legend>

      <div
        // Horizontally scrollable on narrow screens instead of wrapping into
        // four cramped rows.
        className="no-scrollbar -mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {options.map((option) => {
          const active = option.id === value;
          return (
            <label
              key={option.id}
              className={cn(
                "group/chip shrink-0 cursor-pointer select-none rounded-full border px-4 py-2.5",
                "transition-colors duration-300",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
                "has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-signal",
                active
                  ? "border-signal bg-signal text-ink"
                  : "border-[var(--line-strong)] text-muted hover:border-paper/40 hover:text-paper"
              )}
            >
              <input
                type="radio"
                name="project-filter"
                value={option.id}
                checked={active}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              <span className="text-sm font-medium tracking-tight">
                {option.label}
              </span>
              <span
                className={cn(
                  "ml-2 font-mono text-[0.625rem] tabular-nums",
                  active ? "text-ink/60" : "text-muted"
                )}
              >
                {option.count}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
