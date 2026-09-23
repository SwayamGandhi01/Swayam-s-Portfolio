"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useSmoothScroll } from "./SmoothScroll";

const SECTION_IDS = site.nav.map((n) => n.href.slice(1));

export function Header() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const active = useActiveSection(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // Deferred a frame so the initial sync (which matters when the page is
    // restored mid-scroll) doesn't cascade a render inside the effect.
    const id = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock scrolling (and Lenis) while the mobile menu owns the screen.
  useEffect(() => {
    if (!open) return;
    lenis.stop();
    document.body.style.overflow = "hidden";
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();

    window.addEventListener("keydown", onKey);
    // Menu links close the menu themselves via `onNavigate`; this covers the
    // one path they can't — a browser back/forward while the menu is open.
    window.addEventListener("popstate", close);

    return () => {
      lenis.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", close);
    };
  }, [open, lenis]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-signal focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-signal"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500",
          scrolled || open
            ? "border-b border-[var(--line)] bg-canvas/72 backdrop-blur-xl"
            : "border-b border-transparent"
        )}
      >
        <div className="shell flex h-[var(--header-h)] items-center justify-between gap-3 sm:gap-6">
          <Link
            href="/"
            className="group flex items-baseline gap-2.5"
            aria-label={`${site.name} — home`}
          >
            <span className="text-base font-semibold tracking-tight">
              {site.name}
            </span>
            <span className="label hidden text-muted transition-colors group-hover:text-signal sm:inline">
              {site.role}
            </span>
          </Link>

          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {site.nav.map((item) => {
              const isActive = onHome && active === item.href.slice(1);
              return (
                <AnchorLink
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative rounded-full px-3.5 py-2 text-sm transition-colors duration-300",
                    isActive ? "text-content" : "text-muted hover:text-content"
                  )}
                >
                  <span className="mr-1.5 font-mono text-[0.625rem] text-signal opacity-0 transition-opacity duration-300 group-hover:opacity-100 data-[on=true]:opacity-100" data-on={isActive}>
                    {item.index}
                  </span>
                  {item.label}
                </AnchorLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 md:inline-flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60 motion-safe-only" />
                <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
              </span>
              <span className="label text-muted">{site.availability}</span>
            </span>

            {/* Sits in the header at every breakpoint rather than being
                duplicated inside the mobile menu. The header is z-50 and the
                menu panel z-40, so this stays on top of the open menu and is
                reachable from it — one control, one place, no second copy to
                keep in sync. */}
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm transition-colors hover:border-signal hover:text-signal lg:hidden"
            >
              <span className="relative flex h-2.5 w-4 flex-col justify-between">
                <span
                  className={cn(
                    "h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                    open && "translate-y-[4.5px] rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                    open && "-translate-y-[4.5px] -rotate-45"
                  )}
                />
              </span>
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {/* Kept mounted and driven by CSS rather than an animation library: one
          clip-path transition on the panel and a staggered transition-delay on
          the items is the whole effect. `inert` takes the links out of the tab
          order and the accessibility tree while it's closed. */}
      <div
        id="mobile-menu"
        inert={!open}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 bg-surface transition-[clip-path] duration-[650ms] ease-[var(--ease-in-out-quint)] lg:hidden",
          open ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)]"
        )}
      >
        <div className="blueprint absolute inset-0 opacity-40" aria-hidden />
        <nav
          aria-label="Sections"
          // `justify-center` centres the list on tall phones; `overflow-y-auto`
          // keeps every item reachable on short ones (e.g. 320×480).
          className="shell relative flex h-full flex-col justify-center gap-1 overflow-y-auto py-6 pt-[calc(var(--header-h)+1.5rem)]"
        >
          {site.nav.map((item, i) => (
            <AnchorLink
              key={item.href}
              href={item.href}
              onNavigate={() => setOpen(false)}
              style={{ transitionDelay: open ? `${180 + i * 50}ms` : "0ms" }}
              className={cn(
                "flex items-baseline gap-4 border-b border-[var(--line)] py-4 text-d3 font-semibold",
                "transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)]",
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              )}
            >
              <span className="font-mono text-xs text-signal">{item.index}</span>
              {item.label}
            </AnchorLink>
          ))}
        </nav>
      </div>
    </>
  );
}
