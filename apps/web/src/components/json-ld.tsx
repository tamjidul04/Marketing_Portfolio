import { jsonLdString } from "@/lib/seo";

/** Structured data for search engines. Output is escaped so admin-written text can't break out of the tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
