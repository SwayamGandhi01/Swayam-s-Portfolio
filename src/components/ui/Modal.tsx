"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";

/**
 * Modal built on the native `<dialog>` element.
 *
 * `showModal()` gives us, for free and correctly, the things hand-rolled
 * modals usually get wrong: focus is trapped inside the dialog, the rest of
 * the page becomes inert to assistive technology, Escape closes it, and it
 * renders in the top layer so no z-index or stacking context can occlude it.
 * A div-based modal would mean re-implementing all of that, worse.
 *
 * What still has to be done by hand:
 *  • Locking Lenis, which has its own wheel loop and ignores `overflow`.
 *  • Returning focus to the trigger — the browser restores it to the dialog's
 *    opener only in some engines, so we capture and restore it explicitly.
 *
 * The dialog fills the viewport, so there is no visible `::backdrop` to click.
 * Dismissal is Escape or the close button; content that wants click-to-dismiss
 * on its own empty space handles it there, where the hit area actually exists.
 */
export function Modal({
  open,
  onClose,
  title,
  /** Rendered next to the title — device toggles, URL display, etc. */
  toolbar,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const lenis = useSmoothScroll();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      lenis.stop();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, lenis]);

  // `close` fires for Escape and for programmatic closes alike, so all the
  // teardown lives in one place.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      document.body.style.overflow = "";
      lenis.start();
      opener.current?.focus?.();
      opener.current = null;
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, lenis]);

  // Release the locks if the component unmounts while still open.
  useEffect(
    () => () => {
      document.body.style.overflow = "";
      lenis.start();
    },
    [lenis]
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : title}
      className={cn(
        "m-0 max-h-none max-w-none bg-transparent p-0 text-paper",
        "h-full w-full backdrop:bg-ink/85 backdrop:backdrop-blur-sm",
        "open:flex open:flex-col"
      )}
    >
      <div className={cn("flex h-full w-full flex-col", className)}>
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] bg-ink px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <h2
              id={labelledBy}
              className="truncate text-sm font-semibold tracking-tight"
            >
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {toolbar}
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-colors hover:border-signal hover:text-signal"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-ink-2">{children}</div>
      </div>
    </dialog>
  );
}
