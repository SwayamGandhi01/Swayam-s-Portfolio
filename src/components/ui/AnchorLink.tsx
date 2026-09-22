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
        onNavigate?.();
        // Clear the fixed header (4.5rem) plus breathing room, matching the
        // `scroll-mt-24` that native anchor jumps use.
        lenis.scrollTo(target, -96);
        history.replaceState(null, "", href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
