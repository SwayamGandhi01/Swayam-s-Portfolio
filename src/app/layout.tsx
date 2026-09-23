import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { site, siteUrl } from "@/data/site";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Preloader } from "@/components/layout/Preloader";
import { INTRO_SEEN_KEY } from "@/lib/constants";
import { DEFAULT_THEME, THEME_COLOR, THEME_STORAGE_KEY } from "@/lib/theme";
import { PageTransition } from "@/components/layout/PageTransition";
import { Cursor } from "@/components/layout/Cursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Display face — used only for the italic emphasis inside headlines. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.tagline,
  keywords: [
    "Full Stack Developer",
    "React",
    "Next.js",
    "Node.js",
    "Strapi",
    "TypeScript",
    site.name,
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: "en",
    url: siteUrl,
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.tagline,
  },
  robots: { index: true, follow: true },
};

/**
 * No `themeColor` or `colorScheme` here.
 *
 * Both are per-visitor now, and this export is evaluated once on the server
 * for everybody. `color-scheme` is declared in CSS beside each theme's tokens
 * instead, and `theme-color` is a plain meta tag below, which the theme
 * script rewrites before first paint.
 */
export const viewport: Viewport = {};

/**
 * Runs before first paint. Decides whether the intro overlay is shown at all,
 * so returning visitors and reduced-motion users never see a frame of it.
 * Kept to one statement, no dependencies, and wrapped in try/catch because
 * sessionStorage throws outright in some privacy configurations.
 */
const introGate = `try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='skip'}}catch(e){}`;

/**
 * Also runs before first paint — this is the whole flash-prevention story.
 *
 * Every colour on the page is a custom property keyed off `<html data-theme>`,
 * so setting that attribute synchronously in `<head>`, before the browser has
 * painted a single pixel, means the correct theme is the only one ever on
 * screen. It cannot be done from an effect or a provider: both run after the
 * first paint, and that gap is the flash.
 *
 * Only an explicit choice is honoured — see `DEFAULT_THEME`. To follow the OS
 * instead, the fallback becomes
 * `matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'`.
 *
 * The storage read is wrapped because it throws outright under some privacy
 * settings, and the meta tag is updated in the same breath so the browser
 * chrome never flashes either.
 */
const themeScript = `(function(){var t='${DEFAULT_THEME}';try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s==='light'||s==='dark')t=s}catch(e){}document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==='light'?'${THEME_COLOR.light}':'${THEME_COLOR.dark}'})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The head scripts write data attributes onto <html> before React
      // hydrates; React must not treat those as a mismatch.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
        {/* Rendered by hand rather than through the `viewport` export, so the
            script below is guaranteed to find it already in the document. */}
        <meta name="theme-color" content={THEME_COLOR[DEFAULT_THEME]} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: introGate }} />
      </head>
      <body className="min-h-dvh">
        <SmoothScroll>
          <Preloader />
          <Cursor />
          <Header />
          <PageTransition>
            <main id="main">{children}</main>
            <Footer />
          </PageTransition>
        </SmoothScroll>
      </body>
    </html>
  );
}
