"use client";

import { Download } from "lucide-react";
import { isPlaceholder, site } from "@/data/site";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

const label = (
  <span className="inline-flex items-center gap-2.5">
    <Download aria-hidden className="size-4" />
    Download resume
  </span>
);

/**
 * The resume CTA, which is only a link once there is something to link to.
 *
 * The file lives in `public/`, so this is a plain same-origin download rather
 * than a new tab — the button says "Download", and that is what it does. The
 * `download` attribute renames the saved copy, because the URL's filename is
 * the one on disk and not necessarily the one a recruiter should end up with.
 *
 * The placeholder branch stays for the same reason it was written: if
 * `resumeUrl` is ever cleared or reverted, this degrades to a dimmed,
 * non-focusable chip instead of shipping a 404 behind a Download button.
 */
export function ResumeButton({ className }: { className?: string }) {
  const href = site.resumeUrl;

  if (!href || isPlaceholder(href)) {
    return (
      <span
        className={cn(
          "inline-flex cursor-not-allowed items-center gap-2.5 rounded-full",
          "border border-dashed border-[var(--line-strong)] px-6 py-3",
          "text-sm font-medium tracking-tight text-muted opacity-60",
          className
        )}
        title="No resume file yet — add the PDF to public/, then set resumeUrl in src/data/site.ts"
      >
        {label}
        <span className="label text-[0.5625rem]">file pending</span>
      </span>
    );
  }

  return (
    <Button
      href={href}
      download={site.resumeDownloadName}
      variant="outline"
      className={className}
    >
      {label}
    </Button>
  );
}
