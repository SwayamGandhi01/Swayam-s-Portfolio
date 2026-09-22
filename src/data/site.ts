
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
  tagline:
    "Full stack developer working across React and Next.js interfaces, Node and Strapi back ends, and the integrations that hold them together.",
  location: placeholder("City, Country"),
  availability: "Open to new projects",

  /* --- Contact ---------------------------------------------------------- */
  email: "gandhiswayam772@gmail.com",
  /** E.164, for the `tel:` href. Never displayed directly. */
  phone: "+918284905725",
  /** Grouped for readability. Only ever shown, never used in an href. */
  phoneDisplay: "+91 82849 05725",
  resumeUrl: placeholder("/resume.pdf"),

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

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
