import type { MetadataRoute } from "next";
import { getCaseStudies } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cases = await getCaseStudies();
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...cases.map((c) => ({
      url: absoluteUrl(`/work/${c.slug}`),
      lastModified: new Date(c.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
