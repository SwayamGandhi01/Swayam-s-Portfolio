import { placeholder } from "./site";

/**
 * Project portfolio.
 *
 * Ground rules for this file — please keep them when adding entries:
 *
 *  • `contribution` and `technologies` describe work that actually happened.
 *    Where they are not confirmed they use `placeholder(...)`, which renders
 *    as a visible "[edit]" chip so nothing unverified reads as fact.
 *
 *  • `description` states what the live site *is*. For projects without a
 *    confirmed brief, these were written from the published site itself, not
 *    invented — they describe the client's business, never a claim about who
 *    built what.
 *
 *  • No metrics, outcomes, testimonials or awards anywhere. Not one.
 *
 * Adding a project: append an object here. The filter grid, the detail route
 * (`/work/[slug]`), the category counts and the sitemap all pick it up with
 * no other changes. Run `npm run capture` to
 * screenshot its live site.
 */

/* ------------------------------------------------------------------------ */
/* Categories                                                               */
/* ------------------------------------------------------------------------ */

export const CATEGORIES = [
  { id: "all", label: "All projects" },
  { id: "fullstack", label: "Full stack" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend & APIs" },
  { id: "cms", label: "CMS & integrations" },
  { id: "corporate", label: "Corporate & business" },
  { id: "hospitality", label: "Hospitality" },
  { id: "landing", label: "Landing pages" },
  { id: "mining", label: "Mining & investment" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ------------------------------------------------------------------------ */
/* Types                                                                    */
/* ------------------------------------------------------------------------ */

export type Project = {
  id: string;
  title: string;
  slug: string;
  category: Exclude<CategoryId, "all">[];
  /** One sentence: what the live site is. */
  description: string;
  technologies: string[];
  contribution: string[];
  liveUrl?: string;
  /** Set when `liveUrl` is a preview/staging deploy and production differs. */
  productionUrl?: string;
  githubUrl?: string;
  /** Optional cover override. Defaults to the captured desktop screenshot. */
  image?: string;
  featured: boolean;

  /* Optional case-study extras — omit until confirmed. */
  /** Longer framing shown on the detail page. */
  overview?: string;
  /** What the product does. */
  features?: string[];
  /** Year, hidden in the UI while undefined. */
  year?: string;
  /**
   * The slice of the build that was yours, in two or three words — "Backend",
   * "Frontend & design", "Full stack".
   *
   * Every value below is a summary of that project's own `contribution` list
   * and nothing more. It is not a job title: on MIDIS the work was the backend
   * only, so that is what it says, regardless of the title on the contract.
   * Omit it rather than guess.
   */
  role?: string;
  /**
   * The hard part, and what was done about it. Both render only when set, and
   * both are deliberately empty right now — the honest version of these has to
   * come from the person who did the work, not be reconstructed from a live
   * site. Add them in pairs; a challenge without a solution reads as an
   * excuse.
   */
  challenge?: string;
  solution?: string;
};

/* ------------------------------------------------------------------------ */
/* Projects                                                                 */
/* ------------------------------------------------------------------------ */

const UNCONFIRMED_CONTRIBUTION = [
  placeholder(
    "Describe your contribution to this project — one bullet per piece of work."
  ),
];

const UNCONFIRMED_TECH = [placeholder("Tech")];

export const projects: Project[] = [
  /* --- Confirmed briefs ------------------------------------------------- */
  {
    id: "mobile-tyre-champions",
    slug: "mobile-tyre-champions",
    title: "Mobile Tyre Champions",
    category: ["fullstack", "frontend", "backend"],
    description:
      "A 24/7 mobile tyre-fitting service covering Surrey, Hampshire and Berkshire, with location pages, news and enquiry handling.",
    overview:
      "The site ran as a client-rendered React application. I migrated it to Next.js so pages could be served as real HTML, then used that foundation to rebuild the parts of the site that drive search visibility and enquiries.",
    contribution: [
      "Migrated the existing React application to Next.js.",
      "Integrated the backend with the frontend.",
      "Built the contact form and its email template.",
      "Implemented the sitemap so every public route is discoverable.",
      "Reworked the site's SEO.",
      "Built the news section.",
      "Built the areas-covered content.",
      "Implemented filtering.",
    ],
    features: [
      "Server-rendered pages across the public site",
      "Generated sitemap covering static and dynamic routes",
      "Contact form with a templated email",
      "News listing and article pages",
      "Areas-covered pages with filtering",
    ],
    technologies: ["Next.js", "React.js", "JavaScript", "SEO", "Email templates"],
    role: "Full stack",
    liveUrl: "https://mobiletyrechampions.com/",
    featured: true,
  },
  {
    id: "midis",
    slug: "midis",
    title: "MIDIS",
    category: ["fullstack", "backend"],
    description:
      "A platform with forms, editorial content and a chat feature, served by a Node and Express backend.",
    overview:
      "MIDIS needed server-side foundations: the endpoints behind its forms and blog content, plus a chat feature backed by the OpenAI API. I built the backend serving all three.",
    contribution: [
      "Built the Node.js / Express.js backend.",
      "Implemented form handling.",
      "Built the blog functionality.",
      "Implemented chat functionality.",
      "Integrated the OpenAI API.",
      "Used MongoDB where applicable.",
      "Handled API integration.",
    ],
    features: [
      "Express REST endpoints",
      "Form submission handling",
      "Blog content API",
      "Chat backed by the OpenAI API",
    ],
    technologies: [
      "Node.js",
      "Express.js",
      "OpenAI API",
      "MongoDB",
      "REST APIs",
    ],
    role: "Backend",
    liveUrl: "https://midis.in",
    featured: true,
  },
  {
    id: "mining-discovery",
    slug: "mining-discovery",
    title: "Mining Discovery",
    category: ["mining", "backend", "cms"],
    description:
      "A mining news and content platform, driven by a Strapi backend with an automated daily publishing pipeline.",
    overview:
      "A content platform built around a Strapi backend. The editorial team needed a daily news pipeline that did not depend on someone remembering to run it, and an API shape that frontends could consume directly.",
    contribution: [
      "Built the Strapi backend.",
      "Handled API integration.",
      "Implemented daily news posting automation.",
      "Set up and managed the content management structure.",
    ],
    features: [
      "Strapi content models and admin experience",
      "Automated daily news posting",
      "API-driven data management",
    ],
    technologies: ["Strapi CMS", "Node.js", "REST APIs"],
    role: "Backend & CMS",
    liveUrl: "https://miningdiscovery.com/",
    featured: true,
  },
  {
    id: "noble-mining-investment-conference",
    slug: "noble-mining-investment-conference",
    title: "Noble Mining Investment Conference",
    category: ["mining", "frontend", "cms"],
    description:
      "A mining investment conference site where the agenda, speakers and sponsors are all managed as editorial content.",
    overview:
      "A conference platform whose programme changes constantly in the run-up to the event. The frontend reads everything from the Strapi API, so the published site tracks the source data rather than being rebuilt by hand.",
    contribution: [
      "Integrated the Strapi API.",
      "Built dynamic filtering.",
      "Implemented the agendas.",
      "Implemented speakers.",
      "Implemented participating companies.",
      "Implemented media partners and sponsors.",
      "Implemented event-related content.",
    ],
    features: [
      "Agenda and session content",
      "Speaker profiles",
      "Participating companies",
      "Media partners and sponsors",
      "Dynamic filtering across listings",
    ],
    technologies: ["Next.js", "React.js", "Strapi CMS", "REST APIs"],
    role: "Frontend & CMS integration",
    liveUrl: "https://www.thenoblemininginvestmentconference.com/",
    featured: true,
  },
  {
    id: "high-spirits",
    slug: "high-spirits",
    title: "High Spirits",
    category: ["hospitality", "frontend"],
    description:
      "An Australian hospitality venue, rebuilt with a new visual direction and an animated, responsive interface.",
    overview:
      "A redesign focused on how the venue presents itself online — the visual language, the colour theme, the motion that carries you through it, and a responsive interface rebuilt from the ground up.",
    contribution: [
      "Redesigned the website.",
      "Built the animations.",
      "Produced the colour theme and visual design.",
      "Implemented the responsive interface.",
    ],
    features: [
      "New visual design and colour theme",
      "Animated interface transitions",
      "Responsive layouts across breakpoints",
    ],
    technologies: ["React.js", "Next.js", "Tailwind CSS", "GSAP"],
    role: "Frontend & design",
    liveUrl: "https://www.highspirits.au/",
    featured: true,
  },
  {
    id: "mining-investment-event",
    slug: "mining-investment-event",
    title: "Mining Investment Event",
    category: ["mining", "frontend", "cms"],
    description:
      "A mining investment event site with Strapi-managed event content and filtering across listings.",
    overview:
      "An event website where nearly everything on screen is editorial content managed in Strapi. I built the frontend and the integration layer that turns that content into the pages visitors browse.",
    contribution: [
      "Built the frontend.",
      "Integrated the Strapi API.",
      "Implemented event content.",
      "Implemented filtering and dynamic data.",
    ],
    features: [
      "Event content served from Strapi",
      "Filtering across event listings",
      "Dynamic data throughout the frontend",
    ],
    technologies: ["Next.js", "React.js", "Strapi CMS", "REST APIs"],
    role: "Frontend & CMS integration",
    liveUrl: "https://mining-investment-six.vercel.app/",
    // Production deployment of the same project.
    productionUrl: "https://www.themininginvestmentevent.com/",
    featured: true,
  },

  /* --- Briefs still to be confirmed ------------------------------------- */
  /* Descriptions below were written from the live sites. Contributions and
     technologies are placeholders until Swayam confirms them.               */
  {
    id: "digipowerx",
    slug: "digipowerx",
    title: "DigiPowerX",
    category: ["corporate"],
    description:
      "An energy-infrastructure company operating power generation, Tier III data centres and bare-metal GPU compute.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://digipowerx.com/",
    featured: false,
  },
  {
    id: "neocloudz",
    slug: "neocloudz",
    title: "NeoCloudz",
    category: ["corporate"],
    description:
      "A GPU cloud platform offering on-demand high-performance clusters for AI training, inference and research.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.neocloudz.com/",
    featured: false,
  },
  {
    id: "us-data-centers",
    slug: "us-data-centers",
    title: "US Data Centers",
    category: ["corporate"],
    description:
      "An AI-infrastructure company building modular, GPU-optimised data centres for enterprise deployment.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.usdatacenters.ai/",
    featured: false,
  },
  {
    id: "laura-stein",
    slug: "laura-stein",
    title: "Laura Stein",
    category: ["corporate", "mining"],
    description: placeholder(
      "The live site publishes global mining news under the name \"Laura's Liaisons\" — confirm how you'd like this project framed."
    ),
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://laurastein.net/",
    featured: false,
  },
  {
    id: "aureus-hospitality",
    slug: "aureus-hospitality",
    title: "Aureus Hospitality",
    category: ["hospitality", "corporate"],
    description:
      "A hospitality consultancy presenting its advisory services to hotel and venue operators.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.aureus-hospitality.com/",
    featured: false,
  },
  {
    id: "hqb-pro-solutions",
    slug: "hqb-pro-solutions",
    title: "HQB Pro Solutions",
    category: ["corporate"],
    description:
      "An Edmonton business-services firm offering accounting, billing and IT support.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://hqbprosolutions.com/",
    featured: false,
  },
  {
    id: "solar-spectrum",
    slug: "solar-spectrum",
    title: "Solar Spectrum",
    category: ["corporate"],
    description:
      "An Australian renewable-energy company covering solar installation, battery storage, heating and cooling, and EV chargers.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.solarspectrum.com.au/",
    featured: false,
  },
  {
    id: "gulf-connect-consultancy",
    slug: "gulf-connect-consultancy",
    title: "Gulf Connect Consultancy",
    category: ["corporate"],
    description:
      "An investor-communications consultancy connecting international small and mid-cap firms with Gulf capital markets.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.gulfconnectconsultancy.com/",
    featured: false,
  },
  {
    id: "mobile-tyre-camberley",
    slug: "mobile-tyre-camberley",
    title: "Mobile Tyre Camberley",
    category: ["landing"],
    description:
      "A location-targeted site for mobile tyre fitting around Camberley, serving the Mobile Tyre Champions business.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://www.mobiletyrecamberley.co.uk/",
    featured: false,
  },
  {
    id: "mobile-tyre-uk",
    slug: "mobile-tyre-uk",
    title: "Mobile Tyre UK",
    category: ["landing"],
    description:
      "A UK-wide site for mobile tyre fitting and roadside tyre services, serving the Mobile Tyre Champions business.",
    contribution: UNCONFIRMED_CONTRIBUTION,
    technologies: UNCONFIRMED_TECH,
    liveUrl: "https://mobiletyreuk.com/",
    featured: false,
  },
];

/* ------------------------------------------------------------------------ */
/* Derived helpers                                                          */
/* ------------------------------------------------------------------------ */

/** Featured first, then source order. The `featured` flag is the only knob. */
export const orderedProjects = [...projects].sort(
  (a, b) => Number(b.featured) - Number(a.featured)
);

/**
 * The two groups the showcase renders as separate bands.
 *
 * The split is the `featured` flag, and the flag tracks one thing: whether a
 * confirmed write-up exists. Every featured entry has an `overview`, a real
 * `contribution` list and real `technologies`; the rest carry `[edit]`
 * placeholders, are `noindex` and stay out of the sitemap. So this is not a
 * ranking of which client mattered most — it is "these have a case study
 * behind them, those are links to live sites".
 */
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);

export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);

/** Categories that actually have projects, with their counts. */
export const categoriesInUse = CATEGORIES.filter(
  (c) =>
    c.id === "all" ||
    projects.some((p) => (p.category as string[]).includes(c.id))
).map((c) => ({
  ...c,
  count:
    c.id === "all"
      ? projects.length
      : projects.filter((p) => (p.category as string[]).includes(c.id)).length,
}));

export const categoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const adjacentProjects = (slug: string) => {
  const list = orderedProjects;
  const i = list.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: list[(i - 1 + list.length) % list.length],
    next: list[(i + 1) % list.length],
  };
};
