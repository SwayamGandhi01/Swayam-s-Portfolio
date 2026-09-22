import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { site, siteUrl } from "@/data/site";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Preloader } from "@/components/layout/Preloader";
import { INTRO_SEEN_KEY } from "@/lib/constants";
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

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  colorScheme: "dark",
};

/**
 * Runs before first paint. Decides whether the intro overlay is shown at all,
 * so returning visitors and reduced-motion users never see a frame of it.
 * Kept to one statement, no dependencies, and wrapped in try/catch because
 * sessionStorage throws outright in some privacy configurations.
 */
const introGate = `try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='skip'}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The gate script writes a data attribute onto <html> before React
      // hydrates; React must not treat that as a mismatch.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
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
