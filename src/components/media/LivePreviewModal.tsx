"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  TriangleAlert,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { ProjectMedia } from "@/data/projectMedia";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: {
  id: Viewport;
  label: string;
  width: number;
  Icon: typeof Monitor;
}[] = [
  { id: "desktop", label: "Desktop", width: 1440, Icon: Monitor },
  { id: "tablet", label: "Tablet", width: 834, Icon: Tablet },
  { id: "mobile", label: "Mobile", width: 414, Icon: Smartphone },
];

/** If the frame hasn't loaded by now, assume something is blocking it. */
const LOAD_TIMEOUT_MS = 9000;

/**
 * Live website preview.
 *
 * The iframe is only created once the modal is actually open, so no visitor
 * pays to load sixteen external websites while scrolling the grid.
 *
 * Framing gets refused in two different ways and both are handled:
 *  • Known up front — `media.embed` records what the site's `X-Frame-Options`
 *    and CSP headers said when they were last checked, so sites that refuse
 *    framing go straight to the fallback and never flash an empty frame.
 *  • Discovered at runtime — headers change, and some sites bust frames from
 *    JavaScript, which no header check can see. A load timeout catches those.
 *
 * Nothing here tries to defeat a site's framing policy. When a site says no,
 * the answer is a proper preview card and a link that opens it in a new tab.
 */
export function LivePreviewModal({
  open,
  onClose,
  title,
  url,
  media,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  media?: ProjectMedia;
}) {
  const declaredBlocked = media?.embed === "blocked";

  // This component is mounted only while the modal is open, so state starts
  // fresh on every open and needs no reset effect.
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [state, setState] = useState<"loading" | "ready" | "blocked">(
    declaredBlocked ? "blocked" : "loading"
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFrame = open && !declaredBlocked && state !== "blocked";

  // Watchdog for the sites that refuse framing without saying so in a header.
  useEffect(() => {
    if (declaredBlocked) return;

    const id = setTimeout(() => setState("blocked"), LOAD_TIMEOUT_MS);
    timer.current = id;

    return () => clearTimeout(id);
  }, [declaredBlocked]);

  const onFrameLoad = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("ready");
  };

  // A site that refuses framing can still show what it looks like.
  const hero = media?.screenshots.find((s) => s.device === "desktop");
  const frameWidth = VIEWPORTS.find((v) => v.id === viewport)?.width ?? 1440;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      labelledBy="live-preview-title"
      toolbar={
        <>
          {showFrame && (
            <div
              role="group"
              aria-label="Preview width"
              // Shown at every size — hiding it on phones left mobile
              // visitors with no way off the desktop width.
              className="mr-1 flex items-center gap-1 rounded-full border border-[var(--line-strong)] p-1"
            >
              {VIEWPORTS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewport(id)}
                  aria-pressed={viewport === id}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                    viewport === id
                      ? "bg-signal text-on-signal"
                      : "text-muted hover:text-content"
                  )}
                >
                  <Icon aria-hidden className="size-3.5" />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          )}

          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-xs font-medium text-on-signal transition-colors hover:bg-content"
          >
            Open in new tab
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        </>
      }
    >
      {/* URL bar — always shows exactly what is being previewed. */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-canvas px-4 py-2 sm:px-6">
        <span className="label shrink-0 text-muted">URL</span>
        <span className="truncate font-mono text-xs text-muted">{url}</span>
      </div>

      <div className="relative h-full overflow-auto bg-surface p-3 sm:p-6">
        {showFrame ? (
          <div
            className="mx-auto h-full transition-[max-width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ maxWidth: frameWidth }}
          >
            <div className="relative h-full min-h-[60vh] overflow-hidden rounded-sm border border-[var(--line)] bg-canvas">
              {state === "loading" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-canvas">
                  <Loader2
                    aria-hidden
                    className="size-5 animate-spin text-signal"
                  />
                  <p className="label text-muted">Loading live site…</p>
                </div>
              )}

              <iframe
                src={url}
                title={`${title} — live website preview`}
                onLoad={onFrameLoad}
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                className="size-full border-0"
              />
            </div>
          </div>
        ) : (
          /* ---- Fallback: framing refused ---- */
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-7 py-10 text-center">
            <div className="flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] px-4 py-2">
              <TriangleAlert aria-hidden className="size-4 text-signal" />
              <p className="text-xs text-muted">
                This site doesn&rsquo;t allow embedding
              </p>
            </div>

            <div>
              <h3 className="text-d3 font-semibold tracking-tight">{title}</h3>
              <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-muted">
                Its server asks browsers not to display it inside another site.
                That&rsquo;s a sensible security setting, not something to work
                around — so open the real thing in a new tab instead.
              </p>
            </div>

            {hero && (
              <div className="relative aspect-16/10 w-full max-w-2xl overflow-hidden rounded-sm border border-[var(--line)]">
                <Image
                  src={hero.src}
                  alt={hero.alt}
                  fill
                  sizes="(max-width: 768px) 92vw, 42rem"
                  className="object-cover object-top"
                />
              </div>
            )}

            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-on-signal transition-colors hover:bg-content"
            >
              Open live website
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
        )}
      </div>

      {showFrame && (
        <p className="border-t border-[var(--line)] bg-canvas px-4 py-2 text-center text-[0.6875rem] leading-relaxed text-muted sm:px-6">
          This resizes the preview frame only. It doesn&rsquo;t reproduce a real
          device — the site still sees a desktop browser, so device-specific
          behaviour won&rsquo;t match.
        </p>
      )}
    </Modal>
  );
}
