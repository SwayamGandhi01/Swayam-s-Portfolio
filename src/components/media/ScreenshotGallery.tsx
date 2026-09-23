"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  formatCaptured,
  type Device,
  type Screenshot,
} from "@/data/projectMedia";

const DEVICE_ICON: Record<Device, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

/**
 * Screenshot gallery: one large featured shot with a thumbnail rail beneath,
 * and a fullscreen lightbox.
 *
 * Every shot carries a `pending` flag. While it's set, a device-framed
 * placeholder is shown and captioned as awaiting capture — so an unfinished
 * gallery reads as unfinished rather than as finished work, and there are no
 * broken image paths. Dropping the real file in and deleting the flag is the
 * entire publish step.
 *
 * Keyboard: the rail is a tablist (arrow keys move between shots), and the
 * lightbox responds to ← / →. Everything reachable by pointer is reachable by
 * keyboard; nothing is hover-only.
 */
export function ScreenshotGallery({
  shots,
  projectTitle,
}: {
  shots: Screenshot[];
  projectTitle: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = shots.length;
  const current = shots[index];
  const captured = formatCaptured(current?.capturedAt ?? null);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count]
  );

  // Arrow keys drive the lightbox while it's open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (count === 0) return null;

  const captionFor = (shot: Screenshot) => shot.caption;
  const altFor = (shot: Screenshot) => shot.alt;

  return (
    <section aria-label={`${projectTitle} screenshots`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="label text-signal">Screenshots</h2>
          {/* Stored captures, not a live view — say when they are from
              rather than letting them imply currency. */}
          {captured && (
            <p className="mt-3 text-sm text-muted">
              Captured from the live site on{" "}
              <time dateTime={current.capturedAt}>{captured}</time>
            </p>
          )}
        </div>
        <p className="label text-muted">
          {index + 1} / {count}
        </p>
      </div>

      {/* Featured shot */}
      <figure className="mt-6">
        <div
          className={cn(
            "group relative overflow-hidden rounded-sm border border-[var(--line)] bg-surface",
            current.device === "mobile"
              ? "mx-auto aspect-9/16 max-w-sm"
              : current.device === "tablet"
                ? "mx-auto aspect-3/4 max-w-xl"
                : "aspect-16/10"
          )}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={altFor(current)}
            fill
            // The featured shot is below the fold on a case-study page, so
            // it loads lazily like the rest.
            sizes="(max-width: 1024px) 92vw, 64rem"
            className="object-cover object-top"
          />

          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute inset-0 flex items-end justify-end p-4 focus-visible:outline-offset-[-4px]"
          >
            <span className="label inline-flex items-center gap-2 rounded-full bg-canvas/85 px-3.5 py-2 text-content opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 max-lg:opacity-100">
              <Maximize2 aria-hidden className="size-3.5" />
              View full size
            </span>
            <span className="sr-only">
              Open {captionFor(current) ?? "screenshot"} full size
            </span>
          </button>

          {count > 1 && (
            <>
              <GalleryArrow direction="prev" onClick={() => go(-1)} />
              <GalleryArrow direction="next" onClick={() => go(1)} />
            </>
          )}
        </div>

        {current.caption && (
          <figcaption className="mt-3.5 flex items-center gap-2.5 text-sm text-muted">
            <DeviceBadge device={current.device} />
            {captionFor(current)}
          </figcaption>
        )}
      </figure>

      {/* Thumbnail rail */}
      {count > 1 && (
        <div
          role="tablist"
          aria-label="Choose a screenshot"
          className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1"
        >
          {shots.map((shot, i) => (
            <button
              key={shot.src}
              role="tab"
              aria-selected={i === index}
              // Roving tabindex: one stop for the whole rail.
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") go(1);
                if (e.key === "ArrowLeft") go(-1);
              }}
              className={cn(
                "relative aspect-16/10 w-28 shrink-0 overflow-hidden rounded-sm border transition-colors duration-300 sm:w-36",
                i === index
                  ? "border-signal"
                  : "border-[var(--line)] opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={shot.src}
                alt=""
                fill
                sizes="9rem"
                className="object-cover object-top"
              />
              <span className="sr-only">{captionFor(shot) ?? `Screenshot ${i + 1}`}</span>
              <span className="absolute bottom-1 right-1 rounded-full bg-canvas/80 p-1">
                <DeviceBadge device={shot.device} compact />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Modal
        open={lightbox}
        onClose={() => setLightbox(false)}
        title={`${projectTitle} — ${captionFor(current) ?? "screenshot"}`}
        toolbar={
          count > 1 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous screenshot"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next screenshot"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
          ) : undefined
        }
      >
        {/* Clicking the empty space around the image dismisses it. Guarded on
            `target === currentTarget` so clicks on the image itself don't. */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(false);
          }}
          className="flex h-full flex-col items-center justify-center gap-4 p-4 sm:p-8"
        >
          {lightbox && (
            <div className="relative min-h-0 w-full flex-1">
              <Image
                src={current.src}
                alt={altFor(current)}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}
          <p className="shrink-0 text-center text-sm text-muted">
            {captionFor(current)}
          </p>
        </div>
      </Modal>
    </section>
  );
}

function DeviceBadge({
  device,
  compact = false,
}: {
  device: Device;
  compact?: boolean;
}) {
  const Icon = DEVICE_ICON[device];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-3.5 text-signal" />
      {!compact && <span className="label sr-only sm:not-sr-only">{device}</span>}
      {compact && <span className="sr-only">{device}</span>}
    </span>
  );
}

function GalleryArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous screenshot" : "Next screenshot"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-[var(--line-strong)] bg-canvas/80 text-content backdrop-blur-sm",
        "transition-[opacity,border-color] duration-300 hover:border-signal hover:text-signal",
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-lg:opacity-100",
        direction === "prev" ? "left-3" : "right-3"
      )}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}
