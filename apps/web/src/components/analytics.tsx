import Script from "next/script";
import { getSettings } from "@/lib/content";
import { analyticsSnippet } from "@/lib/seo";

/**
 * Meta Pixel + Google Analytics 4, driven by the IDs in site_settings (admin-editable).
 * Nothing at all is loaded unless a valid ID is set, and visitors with "Do Not Track" are skipped.
 * The IDs are format-checked again here before being placed in the script.
 */
export async function Analytics() {
  const s = await getSettings();
  const code = analyticsSnippet(s.meta_pixel_id, s.ga4_id);
  if (!code) return null;
  return <Script id="analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
