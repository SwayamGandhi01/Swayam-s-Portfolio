import { cn } from "@/lib/utils";

/**
 * Infinite horizontal ticker.
 *
 * The track holds the items twice and translates by exactly -50%, so the loop
 * is seamless without measuring anything. It's a single CSS animation on one
 * compositor-friendly transform — no JS, no scroll listener, nothing to clean
 * up. The duplicate is `aria-hidden`, so it is announced once.
 *
 * Under reduced motion the global rule freezes the animation and the row
 * simply reads as a static, horizontally scrollable strip.
 */
function Row({ items, hidden }: { items: string[]; hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center gap-10">
          <span className="whitespace-nowrap text-xl font-medium tracking-tight sm:text-2xl">
            {item}
          </span>
          <span aria-hidden className="size-1 rounded-full bg-signal" />
        </li>
      ))}
    </ul>
  );
}

export function Marquee({
  items,
  speed = 42,
  className,
  reverse = false,
}: {
  items: string[];
  /** Seconds per full cycle. */
  speed?: number;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-x-auto no-scrollbar",
        "[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]",
        className
      )}
    >
      <div
        className="flex min-w-max animate-[marquee-x_linear_infinite] motion-reduce:animate-none group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <Row items={items} />
        <Row items={items} hidden />
      </div>
    </div>
  );
}
