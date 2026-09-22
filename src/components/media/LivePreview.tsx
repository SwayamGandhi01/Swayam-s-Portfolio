"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Loader2,
  Maximize2,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectMedia } from "@/data/projectMedia";
import { LivePreviewModal } from "./LivePreviewModal";

type Viewport = "desktop" | "tablet" | "mobile";

/**
 * Real device dimensions. The iframe is rendered at this exact size and then
 * scaled down to fit — so the site lays itself out as it would on that device,
 * rather than being squeezed into whatever width the column happens to be.
 */
const VIEWPORTS: Record<
  Viewport,
  { label: string; width: number; height: number; Icon: typeof Monitor }
> = {
  desktop: { label: "Desktop", width: 1440, height: 900, Icon: Monitor },
  tablet: { label: "Tablet", width: 834, height: 1112, Icon: Tablet },
  mobile: { label: "Mobile", width: 414, height: 896, Icon: Smartphone },
};

/** If nothing has loaded by now, something is blocking the frame. */
const LOAD_TIMEOUT_MS = 12000;

/**
 * Inline live website preview.
 *
 * Shows the actual site running inside a browser-chrome frame, at true device
 * dimensions scaled to fit the column. Scaling rather than resizing matters:
 * an iframe set to the column's width would trigger the site's own responsive
 * breakpoints and show a narrow layout labelled "desktop".
 *
 * The frame is mounted only once it scrolls into view, so opening a case study
 * doesn't fetch an external site the visitor may never scroll to.
 *
 * Sites that refuse framing — checked from their `X-Frame-Options` and CSP
 * headers, and again via a load watchdog at runtime — get a plain panel and a
 * link. No attempt is made to work around a site's framing policy.
 */
export function LivePreview({
  title,
  url,
  media,
}: {
  title: string;
  url: string;
  media?: ProjectMedia;
}) {
  const declaredBlocked = media?.embed === "blocked";

  const hostRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "blocked">(
    declaredBlocked ? "blocked" : "idle"
  );
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  // Bumping this remounts the iframe, which is how "reload" works for a
  // cross-origin frame we can't reach into.
  const [reloadKey, setReloadKey] = useState(0);

  const device = VIEWPORTS[viewport];

  // Mount the frame only when the section reaches the viewport.
  useEffect(() => {
    if (declaredBlocked) return;
    const host = hostRef.current;
    if (!host) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState((s) => (s === "idle" ? "loading" : s));
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(host);
    return () => io.disconnect();
  }, [declaredBlocked]);

  // Fit the rendered device width into whatever space the column gives us.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const available = host.clientWidth;
      setScale(Math.min(1, available / device.width));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [device.width]);

  // Watchdog for sites that refuse framing without saying so in a header.
  useEffect(() => {
    if (state !== "loading") return;

    const id = setTimeout(() => setState("blocked"), LOAD_TIMEOUT_MS);
    timer.current = id;
    return () => clearTimeout(id);
  }, [state, reloadKey]);

  const onLoad = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("ready");
  };

  const blocked = state === "blocked";

  return (
    <section aria-label={`${title} live preview`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="label text-signal">Live preview</h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
            {blocked
              ? "This site asks browsers not to display it inside another page, so it opens in a new tab instead."
              : "The real site, running here. Interact with it, or switch widths to see how it responds."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!blocked && (
            <div
              role="group"
              aria-label="Preview width"
              className="hidden items-center gap-1 rounded-full border border-[var(--line-strong)] p-1 sm:flex"
            >
              {(Object.keys(VIEWPORTS) as Viewport[]).map((id) => {
                const { label, Icon } = VIEWPORTS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setViewport(id)}
                    aria-pressed={viewport === id}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full transition-colors",
                      viewport === id
                        ? "bg-signal text-ink"
                        : "text-muted hover:text-paper"
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                    <span className="sr-only">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!blocked && state !== "idle" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setState("loading");
                  setReloadKey((k) => k + 1);
                }}
                aria-label="Reload preview"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <RotateCw aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Open preview fullscreen"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <Maximize2 aria-hidden className="size-4" />
              </button>
            </>
          )}

          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full bg-signal px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-paper"
          >
            Open site
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Browser frame */}
      <div className="mt-7 overflow-hidden rounded-sm border border-[var(--line)] bg-ink-2">
        <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[#1b2026] px-4 py-3">
          <div aria-hidden className="flex shrink-0 gap-2">
            <span className="size-2.5 rounded-full bg-signal/85" />
            <span className="size-2.5 rounded-full bg-paper/20" />
            <span className="size-2.5 rounded-full bg-paper/20" />
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-ink/65 px-4 py-1.5">
            <span className="truncate font-mono text-[0.6875rem] text-muted">
              {url}
            </span>
          </div>
        </div>

        <div ref={hostRef} className="relative w-full overflow-hidden bg-ink">
          {blocked ? (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] px-4 py-2">
                <TriangleAlert aria-hidden className="size-4 text-signal" />
                <span className="text-xs text-muted">
                  Embedding not permitted
                </span>
              </span>
              <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
                {title} sends a framing restriction, which is a sensible
                security setting and not something to work around. Open it
                directly to see the live site.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Open live website
                <ArrowUpRight aria-hidden className="size-4" />
              </a>
            </div>
          ) : (
            /* Sized by aspect-ratio rather than a measured pixel height, so
               the box is already the right shape on first paint and the scale
               measurement can't cause a layout shift. */
            <div
              className="relative mx-auto w-full"
              style={{
                maxWidth: device.width,
                aspectRatio: `${device.width} / ${device.height}`,
              }}
            >
              {state === "loading" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink">
                  <Loader2
                    aria-hidden
                    className="size-5 animate-spin text-signal"
                  />
                  <p className="label text-muted">Loading live site…</p>
                </div>
              )}

              {state !== "idle" && (
                <iframe
                  key={reloadKey}
                  src={url}
                  title={`${title} — live website preview`}
                  onLoad={onLoad}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  // Rendered at true device size, then scaled. Pointer
                  // coordinates are mapped through the transform by the
                  // browser, so the frame stays fully interactive.
                  style={{
                    width: device.width,
                    height: device.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  className="absolute left-0 top-0 border-0 bg-paper"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {!blocked && (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Rendered at {device.width}×{device.height} and scaled to fit. The site
          still sees a desktop browser, so genuinely device-specific behaviour
          won&rsquo;t match a real phone.
        </p>
      )}

      {fullscreen && (
        <LivePreviewModal
          open={fullscreen}
          onClose={() => setFullscreen(false)}
          title={title}
          url={url}
          media={media}
        />
      )}
    </section>
  );
}
