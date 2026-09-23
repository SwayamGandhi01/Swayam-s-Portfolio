"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnchorLink } from "./AnchorLink";
import { Magnetic } from "./Magnetic";

type Variant = "solid" | "outline" | "ghost";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full " +
  "px-6 py-3 text-sm font-medium tracking-tight transition-colors duration-300 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  solid:
    "bg-signal text-on-signal hover:bg-content focus-visible:bg-content",
  outline:
    "border border-[var(--line-strong)] text-current hover:border-signal hover:text-signal",
  // The tertiary action. A transparent border keeps its box identical to the
  // outline variant, so a row of mixed buttons still lines up on the same
  // edges; the underline gives it an affordance on touch, where there is no
  // hover state to discover it with.
  ghost:
    "border border-transparent text-muted underline decoration-[var(--line-strong)] " +
    "decoration-1 underline-offset-4 hover:text-signal hover:decoration-signal",
};

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** Adds the diagonal arrow that rotates on hover. */
  arrow?: boolean;
  magnetic?: boolean;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<React.ComponentPropsWithoutRef<"a">, keyof CommonProps | "href">;

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<React.ComponentPropsWithoutRef<"button">, keyof CommonProps>;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    children,
    variant = "outline",
    className,
    arrow = false,
    magnetic = true,
    ...rest
  } = props;

  const classes = cn(base, variants[variant], className);

  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
        />
      )}
    </>
  );

  const node =
    "href" in props && props.href !== undefined ? (
      // An in-page target goes through the same Lenis-aware anchor the header
      // uses. A plain next/link would do a native hash jump, which lands in
      // the right place but skips the smooth scroll — so the header nav and a
      // hero CTA pointing at the same section behaved differently.
      // A download must stay a plain anchor. `next/link` calls
      // `preventDefault()` on click and hands the URL to the router, which
      // cancels the download and then fails to resolve a route for a file in
      // `public/`. The `download` attribute is in `rest`, so it still lands on
      // the element.
      "download" in props ? (
        <a
          {...(rest as React.ComponentPropsWithoutRef<"a">)}
          href={props.href}
          className={classes}
        >
          {inner}
        </a>
      ) : props.href.startsWith("#") && !(props as ButtonAsLink).external ? (
        <AnchorLink
          {...(rest as Omit<React.ComponentPropsWithoutRef<"a">, "href" | "onClick">)}
          href={props.href}
          className={classes}
        >
          {inner}
        </AnchorLink>
      ) : (props as ButtonAsLink).external ? (
        <a
          {...(rest as React.ComponentPropsWithoutRef<"a">)}
          href={props.href}
          target="_blank"
          rel="noreferrer noopener"
          className={classes}
        >
          {inner}
        </a>
      ) : (
        <Link
          {...(rest as Omit<React.ComponentPropsWithoutRef<"a">, "href">)}
          href={props.href}
          className={classes}
        >
          {inner}
        </Link>
      )
    ) : (
      <button
        {...(rest as React.ComponentPropsWithoutRef<"button">)}
        className={classes}
      >
        {inner}
      </button>
    );

  return magnetic ? <Magnetic strength={0.2}>{node}</Magnetic> : node;
}
