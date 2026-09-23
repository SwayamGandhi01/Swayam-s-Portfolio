"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";

/**
 * In-page anchor that cooperates with Lenis.
 *
 * On the home page it intercepts the click and hands the scroll to Lenis (a
 * native `#hash` jump would fight the smooth-scroll loop), while still
 * updating `location.hash` so the section stays linkable and the back button
 * behaves. From any other route it degrades to a normal `/#section` link.
 */
export function AnchorLink({
  href,
  children,
  className,
  onNavigate,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "onClick">) {
  const pathname = usePathname();
  const lenis = useSmoothScroll();
  const isHash = href.startsWith("#");
  const onHome = pathname === "/";

  if (isHash && !onHome) {
    return (
      <Link href={`/${href}`} className={className} onClick={onNavigate} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (!isHash) return;
        const target = document.querySelector<HTMLElement>(href);
        if (!target) return;
        e.preventDefault();
        history.replaceState(null, "", href);

        // `onNavigate` closes the mobile menu, and that teardown restarts
        // Lenis. Lenis's `start()` calls `reset()` internally, which cancels
        // any scroll already in flight — so scrolling first and closing second
        // meant the menu shut, the hash updated, and the page never moved.
        //
        // Closing first and scrolling on the next frame puts the navigation
        // after the teardown instead of underneath it.
        onNavigate?.();
        requestAnimationFrame(() => {
          // No manual offset: Lenis honours the section's `scroll-mt-24`
          // (96px) the same way a native anchor jump does. Passing -96 on top
          // of it double-counted the header clearance and left every section
          // sitting 192px down. The CSS is the single source of truth.
          lenis.scrollTo(target);
        });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
