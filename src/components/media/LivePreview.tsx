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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ProjectMedia } from "@/data/projectMedia";
import { LivePreviewModal } from "./LivePreviewModal";

type Viewport = "desktop" | "tablet" | "mobile";

/**
 * Real device dimensions. The iframe is rendered at this exact size and then
 * scaled to fit — so the site lays itself out as it would on that device,
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

/**
 * Generous, because this is a whole third-party site loading over whatever
 * connection the visitor has. Timing out is not the same as being refused,
 * and the two are reported differently below.
 */
const LOAD_TIMEOUT_MS = 20000;

/**
 * Inline live website preview.
 *
 * Shows the actual site running inside a browser-chrome frame, at true device
 * dimensions scaled to fit the column. Scaling rather than resizing matters:
 * an iframe set to the column's width would trigger the site's own responsive
 * breakpoints and show a narrow layout labelled "desktop".
 *
 * On a phone that logic inverts. A 1440px desktop page scaled into a ~350px
 * column lands at roughly 0.24 — a legible layout becomes an unreadable
 * smear, and the box is barely 200px tall. So phones default to the mobile
 * viewport, which renders near 1:1 and needs no transform at all. That also
 * sidesteps iOS Safari, which composites transformed iframes unreliably.
 *
 * The frame is mounted only once it scrolls into view, so opening a case study
 * doesn't fetch an external site the visitor may never scroll to.
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

  // Phones get the mobile viewport by default. Derived rather than stored, so
  // there's no setState-in-effect and no SSR/client mismatch: the server
  // renders the desktop default and the client corrects it on hydration.
  const isNarrow = useMediaQuery("(max-width: 640px)", false);
  const [override, setOverride] = useState<Viewport | null>(null);
  const viewport: Viewport = override ?? (isNarrow ? "mobile" : "desktop");

  const [state, setState] = useState<"idle" | "loading" | "ready" | "blocked" | "timeout">(
    declaredBlocked ? "blocked" : "idle"
  );
  const [hostWidth, setHostWidth] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Bumping this remounts the iframe, which is how "reload" works for a
  // cross-origin frame we can't reach into.
  const [reloadKey, setReloadKey] = useState(0);

  const device = VIEWPORTS[viewport];

  /**
   * On a phone the column is narrower than the 414px mobile reference. Rather
   * than render at 414 and scale down, render the frame at the column's own
   * width: the site shows the same mobile layout either way, and the frame
   * then needs no transform at all — which is the part iOS Safari composites
   * least reliably. Desktop and tablet still render at true size and scale,
   * because that's the whole point of previewing them on a wide screen.
   */
  const exact =
    viewport === "mobile" && hostWidth > 0 && hostWidth < device.width;
  const frameWidth = exact ? Math.round(hostWidth) : device.width;
  const frameHeight = exact
    ? Math.round(device.height * (hostWidth / device.width))
    : device.height;
  const scale = hostWidth > 0 ? Math.min(1, hostWidth / frameWidth) : 1;

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

  // Track the column width; the frame size derives from it above.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const available = host.clientWidth;
      if (available > 0) setHostWidth(available);
    };

    // How much room a scrollbar takes on this platform. Zero on systems with
    // overlay scrollbars (iOS, modern macOS), where nothing needs hiding.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
    document.body.appendChild(probe);
    setScrollbarWidth(probe.offsetWidth - probe.clientWidth);
    probe.remove();

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Watchdog for sites that refuse framing without saying so in a header.
  useEffect(() => {
    if (state !== "loading") return;

    const id = setTimeout(() => setState("timeout"), LOAD_TIMEOUT_MS);
    timer.current = id;
    return () => clearTimeout(id);
  }, [state, reloadKey]);

  const onLoad = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("ready");
  };

  const retry = () => {
    setState("loading");
    setReloadKey((k) => k + 1);
  };

  const failed = state === "blocked" || state === "timeout";
  // Within a rounding error of 1:1 the transform buys nothing and costs
  // rendering fidelity — iOS Safari especially.
  const needsScale = scale < 0.999;

  return (
    <section aria-label={`${title} live preview`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="label text-signal">Live preview</h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
            {state === "blocked"
              ? "This site asks browsers not to display it inside another page, so it opens in a new tab instead."
              : state === "timeout"
                ? "The preview didn't finish loading. It may be slow, or refusing to be embedded."
                : "The real site, running here. Interact with it, or switch widths to see how it responds."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!failed && (
            <div
              role="group"
              aria-label="Preview width"
              // Visible at every size. Hiding this on phones left mobile
              // visitors stuck on the desktop preview with no way out.
              className="flex items-center gap-1 rounded-full border border-[var(--line-strong)] p-1"
            >
              {(Object.keys(VIEWPORTS) as Viewport[]).map((id) => {
                const { label, Icon } = VIEWPORTS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOverride(id)}
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

          {!failed && state !== "idle" && (
            <>
              <button
                type="button"
                onClick={retry}
                aria-label="Reload preview"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <RotateCw aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Open preview fullscreen"
                className="hidden size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal sm:inline-flex"
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
          {failed ? (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] px-4 py-2">
                <TriangleAlert aria-hidden className="size-4 text-signal" />
                <span className="text-xs text-muted">
                  {state === "blocked"
                    ? "Embedding not permitted"
                    : "Preview didn't load"}
                </span>
              </span>

              <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
                {state === "blocked"
                  ? `${title} sends a framing restriction, which is a sensible security setting and not something to work around. Open it directly to see the live site.`
                  : `${title} didn't load inside the frame in time. That can be a slow connection rather than a refusal — it's worth another try.`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* A timeout isn't a verdict, so offer another go. A header
                    that says no is a verdict, so don't. */}
                {state === "timeout" && (
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-signal hover:text-signal"
                  >
                    <RotateCw aria-hidden className="size-4" />
                    Try again
                  </button>
                )}
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
            </div>
          ) : (
            /* Sized by aspect-ratio rather than a measured pixel height, so
               the box is already the right shape on first paint and the scale
               measurement can't cause a layout shift. */
            <div
              // Clips the overscan that hides the embedded site's scrollbar.
              className="relative mx-auto w-full overflow-hidden"
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
                  key={`${viewport}-${reloadKey}`}
                  src={url}
                  title={`${title} — live website preview`}
                  onLoad={onLoad}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  // On phones the frame doesn't scroll at all. Two reasons:
                  // it guarantees no scrollbar (the overscan below depends on
                  // measuring one, which is zero on overlay-scrollbar
                  // systems), and it avoids scroll-jail — a swipe meant for
                  // the page would otherwise be swallowed by the embed with
                  // no obvious way out. "Open site" covers exploring further.
                  //
                  // `scrolling` is deprecated but has no replacement: an
                  // iframe's inner scrollbars can't be reached any other way
                  // from outside, and every current browser still honours it.
                  scrolling={isNarrow ? "no" : undefined}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  // Width/height as attributes as well as styles: iOS Safari
                  // has a long history of sizing iframes from their content
                  // when only CSS is given.
                  // Overscanned by exactly one scrollbar's width, with the
                  // parent clipping that strip off. The embedded site keeps
                  // its scrollbar — and stays scrollable — but it sits just
                  // outside the visible frame, so the preview reads as a
                  // screen rather than a widget. Content loses nothing: the
                  // site's own viewport is still `frameWidth` wide, because
                  // its scrollbar eats the extra.
                  width={frameWidth + scrollbarWidth}
                  height={frameHeight}
                  style={{
                    width: frameWidth + scrollbarWidth,
                    height: frameHeight,
                    ...(needsScale
                      ? {
                          transform: `scale(${scale})`,
                          transformOrigin: "top left",
                        }
                      : null),
                  }}
                  className="absolute left-0 top-0 border-0 bg-paper"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {!failed && (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Rendered at {frameWidth}×{frameHeight}
          {needsScale ? " and scaled to fit" : ""}.
          {/* The frame inherits the visitor's own user agent. That caveat is
              only true when someone on a desktop previews a narrower width —
              on a phone the site really does see a mobile browser. */}
          {!isNarrow && viewport !== "desktop" && (
            <>
              {" "}
              The site still sees a desktop browser, so genuinely
              device-specific behaviour won&rsquo;t match a real phone.
            </>
          )}
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
