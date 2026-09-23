import { isPlaceholder, site, siteUrl } from "@/data/site";
import { roles } from "@/data/journey";
import type { Project } from "@/data/projects";
import { strip } from "@/components/ui/Editable";

/**
 * schema.org payloads, emitted as JSON-LD.
 *
 * Every value here is read from `src/data` — nothing is written for the
 * crawler that isn't already on the page for a human. That is the whole
 * discipline of structured data: it is a machine-readable restatement of the
 * visible page, and a claim that appears only in the markup is the kind of
 * thing search engines penalise.
 *
 * Placeholders are filtered out rather than serialised. An unverified
 * LinkedIn URL is already rendered as inert text; putting it in `sameAs`
 * would assert to Google exactly what the UI refuses to assert to a visitor.
 */

/** Strips placeholder entries and returns undefined rather than an empty key. */
const clean = (values: (string | undefined)[]) => {
  const out = values.filter(
    (v): v is string => typeof v === "string" && v.length > 0 && !isPlaceholder(v)
  );
  return out.length ? out : undefined;
};

/**
 * The person, their employer and their skills.
 *
 * `worksFor` uses only the current role — `roles` is ordered newest first and
 * an ongoing role is the one with no end date, so this can't silently start
 * naming a past employer as current when a new job is added.
 */
export function personSchema() {
  const current = roles.find((r) => r.end === null);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: site.name,
    url: siteUrl,
    jobTitle: site.role,
    description: site.tagline,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Khanna",
      addressRegion: "Punjab",
      addressCountry: "IN",
    },
    email: `mailto:${site.email}`,
    telephone: site.phone,
    sameAs: clean(site.socials.map((s) => s.href)),
    worksFor: current
      ? { "@type": "Organization", name: current.company }
      : undefined,
    knowsAbout: [
      "React.js",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Express.js",
      "Strapi CMS",
      "MongoDB",
      "REST APIs",
      "Web performance",
    ],
  };
}

/** The site itself, so the name can be used in a sitelinks search box. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: `${site.name} — ${site.role}`,
    description: site.tagline,
    inLanguage: "en",
    publisher: { "@id": `${siteUrl}/#person` },
  };
}

/**
 * A single case study.
 *
 * `CreativeWork` rather than `Article`: these pages describe a thing that was
 * built, not a piece of writing. `creator` points at the Person node by id so
 * the two graphs join up instead of duplicating the profile.
 *
 * Returns null for projects whose write-up isn't confirmed — those pages are
 * already `noindex` and absent from the sitemap, and marking them up would
 * contradict both.
 */
export function projectSchema(project: Project, cover?: string | null) {
  if (isPlaceholder(project.description)) return null;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${siteUrl}/work/${project.slug}#project`,
    name: strip(project.title),
    description: strip(project.description),
    url: `${siteUrl}/work/${project.slug}`,
    image: cover ? `${siteUrl}${cover}` : undefined,
    creator: { "@id": `${siteUrl}/#person` },
    // The live site the case study is about, not this page.
    ...(project.liveUrl ? { sameAs: [project.liveUrl] } : {}),
    keywords: clean(project.technologies)?.join(", "),
  };
}

/**
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` is safe here because every value originates in this repo's
 * own data files, never from user input — but `<` is still escaped, since a
 * literal `</script` anywhere in a string would close the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
