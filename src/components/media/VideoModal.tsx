"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ProjectVideo } from "@/data/projectMedia";

/**
 * Walkthrough video modal.
 *
 * The `<video>` element is only mounted while the modal is open, so no video
 * bytes are requested until someone asks to watch one — and closing the modal
 * unmounts it, which tears down the media element and stops any buffering.
 *
 * `preload="metadata"` fetches only enough to show duration and wire up the
 * scrubber. There is no autoplay: native controls, user-initiated playback.
 */
export function VideoModal({
  open,
  onClose,
  title,
  video,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  video: ProjectVideo;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause on close so audio can't continue behind a dismissed dialog.
  useEffect(() => {
    if (!open) videoRef.current?.pause();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={video.title || `${title} — walkthrough`}
      labelledBy="video-modal-title"
    >
      <div className="flex h-full items-center justify-center p-4 sm:p-8">
        {open && (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            poster={video.poster}
            aria-label={video.title}
            className="max-h-full w-full max-w-5xl rounded-sm border border-[var(--line)] bg-canvas"
          >
            <source src={video.src} type="video/mp4" />
            {/* Shown by browsers that can't play the source at all. */}
            Your browser doesn&rsquo;t support video playback.{" "}
            <a href={video.src} className="underline">
              Download the walkthrough
            </a>{" "}
            instead.
          </video>
        )}
      </div>
    </Modal>
  );
}
