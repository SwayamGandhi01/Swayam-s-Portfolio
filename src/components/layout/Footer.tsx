"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { EditableLink } from "@/components/ui/Editable";
import { useSmoothScroll } from "./SmoothScroll";

/**
 * Wordmark geometry, derived from the name's length.
 *
 * The font size is chosen so the name's *natural* width lands close to the
 * viewBox width (≈0.52em average advance for this face), which leaves
 * `lengthAdjust="spacing"` only a hair of tracking to correct. Without that,
 * a much longer or shorter name would be stretched or crushed to fit.
 */
const WORDMARK_W = 1000;
const WORDMARK_SIZE = Math.round(WORDMARK_W / (site.name.length * 0.52));
const WORDMARK_BASELINE = Math.round(WORDMARK_SIZE * 0.8);
const WORDMARK_H = Math.round(WORDMARK_SIZE * 1.02);

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

      {/* Oversized wordmark.
          Drawn as SVG text rather than a `18vw` heading: a viewport-relative
          font size can't know how wide the name actually renders, so it
          overflowed and clipped mid-word. `textLength` + `lengthAdjust` pin
          the text to the box width instead, so the full name fits edge to
          edge at every viewport and for any name length. */}
      <div
        aria-hidden
        className="pointer-events-none select-none px-gutter pb-6 pt-2"
      >
        <svg
          viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
          className="block w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="0"
            y={WORDMARK_BASELINE}
            textLength={WORDMARK_W}
            // `spacing` tracks the letters out or in to hit the exact width;
            // it never distorts the glyphs themselves.
            lengthAdjust="spacing"
            fontSize={WORDMARK_SIZE}
            className="fill-paper/[0.05] font-semibold"
          >
            {site.name}
          </text>
        </svg>
      </div>
    </footer>
  );
}
