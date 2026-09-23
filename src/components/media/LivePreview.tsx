"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
import { formatCaptured, type ProjectMedia } from "@/data/projectMedia";
import { LivePreviewModal } from "./LivePreviewModal";

type Viewport = "desktop" | "tablet" | "mobile";

/**
 * Target viewports. `width` is a ceiling, not a fixed size — see below.
 */
const VIEWPORTS: Record<
  Viewport,
  { label: string; width: number; height: number; Icon: typeof Monitor }
> = {
  desktop: { label: "Desktop", width: 1440, height: 900, Icon: Monitor },
  tablet: { label: "Tablet", width: 768, height: 1024, Icon: Tablet },
  mobile: { label: "Mobile", width: 390, height: 844, Icon: Smartphone },
};

/**
 * Only a safety net for sites that accept the request and then never fire
 * `load` — frame-busters, mostly. The loader is dismissed by the real `load`
 * event, never by a timer.
 */
const LOAD_TIMEOUT_MS = 20000;

/**
 * Inline live website preview.
 *
 * ── Why the iframe is never transformed ─────────────────────────────────────
 * This used to render at a fixed 1440px and then `transform: scale(0.9)` it
 * down to fit. That is what made the preview look like a photograph of a
 * website rather than a website: a cross-origin iframe is composited
 * out-of-process, so the browser rasterises it once at its own layout size and
 * the parent then samples that texture. Scaling it resamples pixels instead of
 * re-rendering text, and everything goes soft.
 *
 * Now the frame is simply *sized* to the space available, capped at the
 * mode's width, and the iframe fills it at 100% × 100%. The embedded site
 * lays itself out at that real width and rasterises at the real device pixel
 * ratio, so text is as crisp as the parent page. No transform, no zoom.
 *
 * The trade is that "Desktop" means "as wide as the column allows, up to
 * 1440" rather than exactly 1440. On a wide screen that is ~1264px — still a
 * desktop viewport, and the caption states the real number.
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

  const frameRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phones default to the mobile viewport. Derived rather than stored, so
  // there's no setState-in-effect and no SSR/client mismatch.
  const isNarrow = useMediaQuery("(max-width: 640px)", false);
  const [override, setOverride] = useState<Viewport | null>(null);
  const viewport: Viewport = override ?? (isNarrow ? "mobile" : "desktop");

  // Starts as "loading", not "idle": the visitor has already opened this
  // project, so the site should be on its way before they finish reading the
  // heading. Previously an IntersectionObserver held the iframe back until
  // the section scrolled into view, which meant the wait *began* when they
  // arrived at it.
  const [state, setState] = useState<"loading" | "ready" | "blocked" | "timeout">(
    declaredBlocked ? "blocked" : "loading"
  );
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [renderedWidth, setRenderedWidth] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Bumping this remounts the iframe — the only way to reload a cross-origin
  // frame we can't reach into. Viewport is deliberately NOT part of the key:
  // switching mode resizes the frame, it doesn't reload the site.
  const [reloadKey, setReloadKey] = useState(0);

  const device = VIEWPORTS[viewport];

  // On phones the frame doesn't scroll: it guarantees no scrollbar and avoids
  // scroll-jail, where a swipe meant for the page is swallowed by the embed.
  const noScroll = isNarrow;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // How much room a scrollbar takes here. Zero on overlay-scrollbar systems
    // (iOS, modern macOS), where there is nothing to hide.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
    document.body.appendChild(probe);
    setScrollbarWidth(probe.offsetWidth - probe.clientWidth);
    probe.remove();

    // Measured for the caption only — layout is pure CSS.
    const measure = () => setRenderedWidth(Math.round(frame.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  // Watchdog for sites that accept the request but never finish.
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

  // A real capture of this site, shown underneath while the frame loads so the
  // preview has something truthful in it from the first paint. It is never a
  // substitute for the live frame — it fades out the moment `load` fires.
  const poster =
    media?.screenshots.find((s) => s.device === viewport) ??
    media?.screenshots.find((s) => s.device === "desktop");

  // Stated on the fallback so a capture is never mistaken for a live view.
  const captured = formatCaptured(poster?.capturedAt ?? null);

  return (
    <section aria-label={`${title} live preview`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="label text-signal">Live preview</h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
            {state === "blocked"
              ? "This site blocks embedding, so here's a real capture of it instead. Open it in a new tab for the live version."
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
              className="flex items-center gap-1 rounded-full border border-[var(--line-strong)] p-1"
            >
              {(Object.keys(VIEWPORTS) as Viewport[]).map((id) => {
                const { label, Icon, width } = VIEWPORTS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOverride(id)}
                    aria-pressed={viewport === id}
                    aria-label={`${label} width, ${width} pixels`}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full transition-colors",
                      viewport === id
                        ? "bg-signal text-ink"
                        : "text-muted hover:text-paper"
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                  </button>
                );
              })}
            </div>
          )}

          {!failed && (
            <>
              <button
                type="button"
                onClick={retry}
                aria-label="Reload the preview"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <RotateCw aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Open the preview fullscreen"
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

      {/* Browser frame. Chrome is one compact row so the site gets the height. */}
      <div className="mt-7 overflow-hidden rounded-sm border border-[var(--line)] bg-ink-2">
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[#1b2026] px-3 py-2">
          <div aria-hidden className="flex shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-signal/85" />
            <span className="size-2.5 rounded-full bg-paper/20" />
            <span className="size-2.5 rounded-full bg-paper/20" />
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-ink/65 px-3 py-1">
            <span className="truncate font-mono text-[0.6875rem] text-muted">
              {url}
            </span>
          </div>
        </div>

        <div className="w-full bg-ink">
          {failed ? (
            /* A site that refuses framing can still be *shown* — we hold a
               real capture of it. Same box as the live frame so the section
               keeps its shape, with the screenshot doing the work an empty
               black panel used to do badly. Labelled as a capture, never
               passed off as live. */
            <div
              className="relative mx-auto w-full overflow-hidden"
              style={{
                maxWidth: VIEWPORTS.desktop.width,
                aspectRatio: `${VIEWPORTS.desktop.width} / ${VIEWPORTS.desktop.height}`,
              }}
            >
              {poster && (
                <Image
                  src={poster.src}
                  alt={`Screenshot of the ${title} website homepage`}
                  fill
                  sizes="(max-width: 640px) 100vw, 1440px"
                  className="object-cover object-top"
                />
              )}

              {/* Scrim so the notice stays legible over any screenshot, while
                  the top of the site — the part worth seeing — stays clear. */}
              <div
                aria-hidden
                // Weighted to the bottom: solid behind the notice, fully clear
                // across the top half so the screenshot is actually readable.
                // A full-height scrim buried the thing it exists to show.
                className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_92%,transparent)_24%,transparent_56%)]"
              />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-6 text-center sm:p-8">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] bg-ink/80 px-4 py-2 backdrop-blur-sm">
                  <TriangleAlert aria-hidden className="size-4 text-signal" />
                  <span className="text-xs text-muted">
                    {state === "blocked"
                      ? "Live preview unavailable for this website"
                      : "Preview didn't load"}
                  </span>
                </span>

                <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
                  {state === "blocked" ? (
                    <>
                      {title} tells browsers not to display it inside another
                      site, which is a sensible security setting and not
                      something to work around. This is a real screenshot of it
                      {captured ? ` from ${captured}` : ""} — open the site for
                      the live version.
                    </>
                  ) : (
                    <>
                      {title} didn&rsquo;t load inside the frame in time. That
                      can be a slow connection rather than a refusal, so it&rsquo;s
                      worth another try. The screenshot behind this is real.
                    </>
                  )}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {state === "timeout" && (
                    <button
                      type="button"
                      onClick={retry}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink/70 px-5 py-3 text-sm font-medium text-muted backdrop-blur-sm transition-colors hover:border-signal hover:text-signal"
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
                    Open website
                    <ArrowUpRight aria-hidden className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Sized entirely in CSS: full width, capped at the mode's width,
               with the aspect ratio holding the height. The iframe then fills
               it at 100% × 100%, so its layout viewport *is* its painted size
               — which is what keeps the render sharp. */
            <div
              ref={frameRef}
              className="relative mx-auto w-full overflow-hidden transition-[max-width] duration-500 ease-[var(--ease-out-expo)]"
              style={{
                maxWidth: device.width,
                aspectRatio: `${device.width} / ${device.height}`,
              }}
            >
              <iframe
                // Keyed on the reload counter only. Changing viewport resizes
                // this element; it must not tear down and re-fetch the site.
                key={reloadKey}
                src={url}
                title={`${title} — live website preview`}
                onLoad={onLoad}
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                scrolling={noScroll ? "no" : undefined}
                // Overscanned by exactly one scrollbar width and clipped by the
                // parent, so the embedded site keeps its scrollbar — and stays
                // scrollable — without it showing inside the frame. Content
                // loses nothing: the site's viewport is still the frame width,
                // because its scrollbar eats the extra.
                style={{
                  width: `calc(100% + ${noScroll ? 0 : scrollbarWidth}px)`,
                  height: "100%",
                }}
                className="absolute left-0 top-0 border-0 bg-paper"
              />

              {/* The real screenshot of this site, holding the space until the
                  live frame is ready. Fades, never lingers. */}
              <div
                className={cn(
                  "absolute inset-0 z-10 transition-opacity duration-500",
                  state === "ready"
                    ? "pointer-events-none opacity-0"
                    : "opacity-100"
                )}
                aria-hidden={state === "ready"}
              >
                {poster ? (
                  <Image
                    src={poster.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 1440px"
                    className="object-cover object-top"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-ink-2" />
                )}

                <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
                  <p
                    role="status"
                    aria-live="polite"
                    className="label inline-flex items-center gap-2.5 rounded-full bg-ink/85 px-4 py-2.5 text-paper backdrop-blur-sm"
                  >
                    <Loader2 aria-hidden className="size-3.5 animate-spin text-signal" />
                    {state === "ready" ? "Ready" : "Loading website…"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!failed && (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          {renderedWidth > 0 ? (
            <>
              Rendered natively at {renderedWidth}px wide — no scaling, so the
              site stays as sharp as this page.
            </>
          ) : (
            <>Rendered natively — no scaling.</>
          )}
          {!isNarrow && viewport !== "desktop" && (
            <> The frame still reports your browser, so genuinely
            device-specific behaviour won&rsquo;t match a real phone.</>
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
