import manifest from "./screenshots.generated.json";

/**
 * Project media: real screenshots of the live sites, optional walkthrough
 * videos, and whether each site permits iframe embedding.
 *
 * ── Screenshots are generated, not hand-maintained ──────────────────────────
 * `screenshots.generated.json` is written by `npm run capture`, which drives a
 * headless Chrome over each project's `liveUrl` and saves a WebP to
 * `public/projects/<slug>/`. Every entry carries the timestamp of the capture
 * that produced it, so the UI can say when a screenshot is from rather than
 * implying it is live.
 *
 * Do not edit the manifest by hand — re-run the capture. It is the record of
 * what actually happened, and an entry that doesn't match a file on disk would
 * render as a broken image.
 *
 * See MEDIA.md for the capture workflow and video specs.
 */

export type Device = "desktop" | "mobile" | "tablet";

export type Screenshot = {
  src: string;
  device: Device;
  page: string;
  alt: string;
  caption?: string;
  /** ISO timestamp of the capture that produced this file. */
  capturedAt?: string;
  status: "ready" | "failed";
  /** Present when status is "failed". */
  error?: string;
};

export type ProjectVideo = {
  src: string;
  poster?: string;
  title: string;
};

export type ProjectMedia = {
  screenshots: Screenshot[];
  /** Omit entirely when there is no video — the button hides itself. */
  video?: ProjectVideo;
  /**
   * Whether the live site sends framing restrictions, read from its
   * `X-Frame-Options` and CSP `frame-ancestors` headers on the date below.
   * A snapshot, not a guarantee — the preview also fails over at runtime.
   */
  embed: "allowed" | "blocked";
};

export const EMBED_CHECKED_AT = "2026-09-22";

/** Sites that refuse to be framed. Everything else is embeddable. */
const EMBED_BLOCKED = new Set(["digipowerx"]);

/** Optional walkthrough videos, keyed by slug. None recorded yet. */
const VIDEOS: Record<string, ProjectVideo> = {};

/* ------------------------------------------------------------------------ */

type ManifestEntry = {
  src: string;
  device: Device;
  page: string;
  status: "ready" | "failed";
  capturedAt?: string;
  attemptedAt?: string;
  error?: string;
};

const ENTRIES = manifest as Record<string, ManifestEntry>;

const PAGE_LABEL: Record<string, string> = {
  home: "Homepage",
};

const DEVICE_LABEL: Record<Device, string> = {
  desktop: "desktop",
  mobile: "mobile",
  tablet: "tablet",
};

function toScreenshot(
  key: string,
  entry: ManifestEntry,
  title: string
): Screenshot {
  const page = PAGE_LABEL[entry.page] ?? entry.page;
  const caption =
    entry.device === "desktop" ? page : `${page}, ${DEVICE_LABEL[entry.device]}`;

  return {
    src: entry.src,
    device: entry.device,
    page: entry.page,
    alt: `Screenshot of the ${title} website — ${caption.toLowerCase()}`,
    caption,
    capturedAt: entry.capturedAt,
    status: entry.status,
    error: entry.error,
  };
}

/** Screenshots for one project, desktop first, failures excluded. */
function screenshotsFor(slug: string, title: string): Screenshot[] {
  return Object.entries(ENTRIES)
    .filter(([key, entry]) => key.startsWith(`${slug}/`) && entry.status === "ready")
    .map(([key, entry]) => toScreenshot(key, entry, title))
    .sort((a, b) => (a.device === "desktop" ? -1 : b.device === "desktop" ? 1 : 0));
}

const cache = new Map<string, ProjectMedia>();

export function getMedia(slug: string, title = slug): ProjectMedia {
  const cached = cache.get(slug);
  if (cached) return cached;

  const media: ProjectMedia = {
    screenshots: screenshotsFor(slug, title),
    video: VIDEOS[slug],
    embed: EMBED_BLOCKED.has(slug) ? "blocked" : "allowed",
  };
  cache.set(slug, media);
  return media;
}

/** The image used as a project's cover on cards and in metadata. */
export const coverFor = (slug: string, title = slug): string | null =>
  screenshotsFor(slug, title).find((s) => s.device === "desktop")?.src ?? null;

export const hasScreenshots = (media?: ProjectMedia) =>
  Boolean(media?.screenshots.length);

/** Most recent capture across a project's screenshots. */
export function lastCapturedAt(media?: ProjectMedia): string | null {
  const stamps = (media?.screenshots ?? [])
    .map((s) => s.capturedAt)
    .filter((s): s is string => Boolean(s))
    .sort();
  return stamps.at(-1) ?? null;
}

/** Captures that were attempted and failed — surfaced in MEDIA.md, not the UI. */
export const failedCaptures = () =>
  Object.entries(ENTRIES)
    .filter(([, entry]) => entry.status === "failed")
    .map(([key, entry]) => ({ key, error: entry.error }));

export function formatCaptured(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
