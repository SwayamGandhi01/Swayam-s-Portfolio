"use client";

import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectMedia } from "@/data/projectMedia";
import { LivePreviewModal } from "./LivePreviewModal";
import { VideoModal } from "./VideoModal";

/**
 * The "explore live" / "watch walkthrough" pair, shared by project cards and
 * case-study pages so there is one implementation of each modal.
 *
 * Both modals are mounted only while open, which keeps the iframe and the
 * video element — and therefore all their network traffic — out of the page
 * until someone asks for them. On a grid of 16 cards that's the difference
 * between one page and sixteen embedded websites.
 *
 * The walkthrough button renders only when a video actually exists, rather
 * than showing a disabled control or an empty player.
 */
export function ProjectMediaActions({
  title,
  liveUrl,
  media,
  variant = "card",
  className,
}: {
  title: string;
  liveUrl?: string;
  media?: ProjectMedia;
  variant?: "card" | "detail";
  className?: string;
}) {
  const [preview, setPreview] = useState(false);
  const [video, setVideo] = useState(false);

  const hasVideo = Boolean(media?.video);
  if (!liveUrl && !hasVideo) return null;

  const detail = variant === "detail";

  const base = cn(
    "inline-flex items-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-300",
    detail ? "px-6 py-3 text-sm" : "px-3.5 py-2 text-xs"
  );

  return (
    <>
      <div
        className={cn(
          // Sits above the card's full-tile title-link overlay so these stay
          // independently clickable.
          "relative z-10 flex flex-wrap items-center gap-2",
          className
        )}
      >
        {liveUrl && (
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={cn(
              base,
              detail
                ? "bg-signal text-on-signal hover:bg-content"
                : "border border-[var(--line-strong)] text-muted hover:border-signal hover:text-signal"
            )}
          >
            <ExternalLink aria-hidden className={detail ? "size-4" : "size-3.5"} />
            Explore live site
            <span className="sr-only"> — {title}, opens a preview</span>
          </button>
        )}

        {hasVideo && (
          <button
            type="button"
            onClick={() => setVideo(true)}
            className={cn(
              base,
              "border border-[var(--line-strong)] text-muted hover:border-signal hover:text-signal"
            )}
          >
            <PlayCircle aria-hidden className={detail ? "size-4" : "size-3.5"} />
            Watch walkthrough
            <span className="sr-only"> — {title}</span>
          </button>
        )}
      </div>

      {liveUrl && preview && (
        <LivePreviewModal
          open={preview}
          onClose={() => setPreview(false)}
          title={title}
          url={liveUrl}
          media={media}
        />
      )}

      {media?.video && video && (
        <VideoModal
          open={video}
          onClose={() => setVideo(false)}
          title={title}
          video={media.video}
        />
      )}
    </>
  );
}
