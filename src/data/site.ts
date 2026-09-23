
/**
 * Single source of truth for identity, contact details and social links.
 *
 * Anything wrapped in `PLACEHOLDER` has NOT been verified — replace the value
 * and the marker disappears from the UI automatically (see `isPlaceholder`).
 */

export const PLACEHOLDER_PREFIX = "[edit]";

/** Marks a value as unverified so the UI can flag it instead of faking it. */
export const placeholder = (hint: string) => `${PLACEHOLDER_PREFIX} ${hint}`;

export const isPlaceholder = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.startsWith(PLACEHOLDER_PREFIX);

export const site = {
  name: "Swayam Gandhi",
  role: "Full Stack Developer",
  /** Hero headline, split so one word can be set in serif italic. */
  headline: {
    lead: "Building thoughtful",
    emphasis: "experiences",
    trail: "from frontend to backend",
  },
  /**
   * One sentence that says what gets built and what it is built with. Doubles
   * as the hero's lead paragraph and the site's meta description, so it has to
   * read as a sentence rather than a keyword list.
   */
  tagline:
    "Full stack developer building production websites, REST APIs and CMS-powered platforms with React, Next.js, Node and Strapi.",
  /** The second hero line: how the work is split, in one scannable clause. */
  taglineDetail:
    "Responsive interfaces on the front, services and content models behind them — plus the integrations and performance work that hold the two together.",
  /** Primary stack, shown as hero metadata. Mirrors the Skills section. */
  stackSummary: "React · Next.js · Node · Strapi",
  location: "Khanna, Punjab, India",
  availability: "Open to new projects",

  /* --- Contact ---------------------------------------------------------- */
  email: "gandhiswayam772@gmail.com",
  /** E.164, for the `tel:` href. Never displayed directly. */
  phone: "+918284905725",
  /** Grouped for readability. Only ever shown, never used in an href. */
  phoneDisplay: "+91 82849 05725",
  /**
   * Served straight from `public/`, so the path is the filename. Replacing the
   * PDF under the same name is all a refresh takes — nothing here changes.
   */
  resumeUrl: "/Swayam_Gandhi_Resume.pdf",
  /** Filename the browser saves it under, rather than whatever is in the URL. */
  resumeDownloadName: "Swayam-Gandhi-Resume.pdf",

  socials: [
    { label: "GitHub", href: "https://github.com/SwayamGandhi01" },
    {
      label: "LinkedIn",
      // Needs the PUBLIC profile URL (linkedin.com/in/…), not a settings or
      // feed URL. Left as a placeholder so it can't ship broken.
      href: placeholder("https://www.linkedin.com/in/your-public-handle"),
    },
  ],

  nav: [
    { label: "Home", href: "#top", index: "01" },
    { label: "About", href: "#about", index: "02" },
    { label: "Skills", href: "#skills", index: "03" },
    { label: "Projects", href: "#projects", index: "04" },
    { label: "Experience", href: "#experience", index: "05" },
    { label: "Services", href: "#services", index: "06" },
    { label: "Contact", href: "#contact", index: "07" },
  ],
} as const;

/**
 * The origin every absolute URL is built from — canonicals, Open Graph,
 * sitemap.xml, robots.txt and the JSON-LD node ids.
 *
 * Order matters, and the second entry is the important one. This used to fall
 * straight through to `https://example.com`, and because `NEXT_PUBLIC_SITE_URL`
 * was never set on Vercel, the deployed site published a robots.txt pointing
 * crawlers at `https://example.com/sitemap.xml` and a sitemap listing sixteen
 * URLs on a domain nobody here owns. Nothing was indexable.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is set automatically by Vercel and is the
 * stable production hostname — not `VERCEL_URL`, which is the per-deployment
 * hostname and would make the canonical change on every push. It is a bare
 * host with no scheme, hence the prefix.
 *
 * Read on the server only: none of these are `NEXT_PUBLIC_`, and every
 * consumer (metadata, sitemap, robots, structured data) is server-rendered.
 * Setting `NEXT_PUBLIC_SITE_URL` still wins, which is what a custom domain
 * needs.
 */
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
