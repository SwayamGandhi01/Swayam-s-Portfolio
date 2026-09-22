"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copies a value to the clipboard and confirms it.
 *
 * `navigator.clipboard` requires a secure context and can be blocked by
 * permissions policy, so the failure path is handled rather than assumed
 * away: if the write throws, the button says so instead of showing a tick for
 * something that never reached the clipboard.
 *
 * The result is announced through a live region, since a tick icon alone
 * tells a screen-reader user nothing.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** What is being copied, for the accessible name. */
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2200);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
          "border border-[var(--line-strong)] text-muted transition-colors duration-300",
          "hover:border-signal hover:text-signal",
          className
        )}
      >
        {state === "copied" ? (
          <Check aria-hidden className="size-3.5 text-signal" />
        ) : (
          <Copy aria-hidden className="size-3.5" />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" && `${label} copied to clipboard`}
        {state === "failed" && `Couldn't copy ${label}. Please select it manually.`}
      </span>
    </>
  );
}
