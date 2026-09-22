"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { EditableLink } from "@/components/ui/Editable";
import { useSmoothScroll } from "./SmoothScroll";

export function Footer() {
  const lenis = useSmoothScroll();
  const [time, setTime] = useState<string | null>(null);

  // Local clock — rendered only after mount so the server and client never
  // disagree about what time it is.
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="hairline-t relative overflow-hidden">
      <div className="shell py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-muted">Back to</p>
            <button
              type="button"
              onClick={() => lenis.scrollTo(0)}
              className="mt-3 text-d3 font-semibold tracking-tight transition-colors hover:text-signal"
            >
              Top ↑
            </button>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {site.nav.map((item) => (
              <AnchorLink
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-paper"
              >
                {item.label}
              </AnchorLink>
            ))}
          </nav>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {site.socials.map((s) => (
              <li key={s.label}>
                <EditableLink
                  href={s.href}
                  className="text-sm text-muted transition-colors hover:text-signal"
                  fallbackLabel="tbc"
                >
                  {s.label}
                </EditableLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="hairline-t mt-12 flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-muted">
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="label text-muted">
            Built with Next.js, GSAP & Three.js
            {time && <span className="ml-4 tabular-nums">Local {time}</span>}
          </p>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the viewport edge. */}
      <div
        aria-hidden
        className="pointer-events-none select-none px-gutter pb-2"
      >
        <span className="block whitespace-nowrap text-[18vw] font-semibold leading-[0.78] tracking-[-0.055em] text-paper/[0.045]">
          {site.name}
        </span>
      </div>
    </footer>
  );
}
