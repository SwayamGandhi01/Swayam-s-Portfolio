import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { isPlaceholder, siteUrl } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    // Entries without a confirmed description stay out of the sitemap until
    // they have real content — matching the `noindex` on those pages.
    ...projects
      .filter((project) => !isPlaceholder(project.description))
      .map((project) => ({
        url: `${siteUrl}/work/${project.slug}`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.8,
      })),
  ];
}
