/**
 * Professional experience.
 *
 * Roles are stored as dates, never as pre-written duration strings, so
 * "1 yr 3 mos" can't quietly go stale while nobody is looking. Everything the
 * timeline displays — the period label, each role's duration, the total — is
 * derived from the two `start`/`end` pairs below.
 *
 * Listed newest first; the timeline renders them in that order.
 */

export type Role = {
  id: string;
  company: string;
  role: string;
  /** "YYYY-MM" — the month the role started. */
  start: string;
  /** "YYYY-MM" — the final month worked, or null while ongoing. */
  end: string | null;
  body: string;
  /** Technologies actually used in that role. Empty renders nothing. */
  tags: string[];
};

export const roles: Role[] = [
  {
    id: "midis-resources",
    company: "Midis Resources PVT LTD",
    role: "Full Stack Developer",
    start: "2025-06",
    end: null,
    body: "Building and shipping production websites across the whole stack — React and Next.js frontends, Node and Express services, Strapi content backends and MongoDB behind them — along with the third-party integrations and performance work that hold the two halves together.",
    tags: [
      "React.js",
      "Next.js",
      "Node.js",
      "Express.js",
      "Strapi CMS",
      "MongoDB",
      "API integration",
      "Performance",
    ],
  },
  {
    id: "agenttuit",
    company: "Agenttuit",
    role: "Full Stack Intern",
    start: "2024-10",
    end: "2025-05",
    // Deliberately brief: this describes the role as stated and nothing more.
    // Add the specifics — what was built, in what — when they're confirmed.
    body: "First professional role, working across both the front and the back end as a full stack intern.",
    tags: [],
  },
];

/* ------------------------------------------------------------------------ */
/* Derived values                                                            */
/* ------------------------------------------------------------------------ */

const parseMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
};

/** Whole months between two dates. */
const monthsBetween = (from: Date, to: Date) =>
  (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
  (to.getUTCMonth() - from.getUTCMonth());

/**
 * How long a role lasted, in months.
 *
 * A finished role counts its last month, because it was worked. An ongoing
 * one doesn't count the current month, because it isn't over yet. That is the
 * literal reading of both, and it keeps the ongoing figure from rounding up.
 */
export function roleMonths(role: Role, now: Date = new Date()): number {
  const start = parseMonth(role.start);
  if (!role.end) return Math.max(0, monthsBetween(start, now));
  return Math.max(1, monthsBetween(start, parseMonth(role.end)) + 1);
}

/** Total professional experience, measured from the earliest role. */
export function totalMonths(now: Date = new Date()): number {
  const earliest = roles.reduce(
    (min, role) => (role.start < min ? role.start : min),
    roles[0].start
  );
  return Math.max(0, monthsBetween(parseMonth(earliest), now));
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest || !years) parts.push(`${rest} mo${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthLabel = (value: string) => MONTH_LABEL.format(parseMonth(value));

/** e.g. "Jun 2025 — Present" */
export const rolePeriod = (role: Role) =>
  `${monthLabel(role.start)} — ${role.end ? monthLabel(role.end) : "Present"}`;

/** The two ends separately, for timelines that stack them. */
export const roleDates = (role: Role) => ({
  from: monthLabel(role.start),
  to: role.end ? monthLabel(role.end) : "Present",
});

/**
 * Initials for a company, used as a neutral stand-in for a logo we don't have
 * the rights to. Legal suffixes are dropped so "Midis Resources PVT LTD"
 * reads as MR rather than MR PL.
 */
const LEGAL_SUFFIXES = new Set([
  "pvt",
  "ltd",
  "limited",
  "llc",
  "inc",
  "co",
  "plc",
  "gmbh",
]);

export function monogram(company: string): string {
  const words = company
    .split(/\s+/)
    .filter((word) => !LEGAL_SUFFIXES.has(word.toLowerCase().replace(/\./g, "")));
  return (words.length ? words : [company])
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** The month professional work began, e.g. "October 2024". */
export const careerStartLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(
  parseMonth(
    roles.reduce((min, role) => (role.start < min ? role.start : min), roles[0].start)
  )
);
