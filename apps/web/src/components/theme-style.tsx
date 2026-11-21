import type { SiteSettings } from "@/lib/content";
import { readableOn } from "@/lib/format";

/**
 * Applies the brand colours from site_settings (validated as #RRGGBB by the database):
 *   primary   -> --navy       dark sections, headings
 *   accent    -> --accent     actions + structure (buttons, labels, charts)
 *   highlight -> --highlight  value + emphasis (big numbers, stars, underline)
 * Text on accent / highlight fills is chosen by real contrast, so any colours stay readable.
 */
export function ThemeStyle({ settings }: { settings: Pick<SiteSettings, "color_primary" | "color_accent" | "color_highlight"> }) {
  const highlight = settings.color_highlight || "#E0A526"; // fallback if the column isn't there yet (older database / stale cache)
  const css =
    `:root{--navy:${settings.color_primary};--accent:${settings.color_accent};--highlight:${highlight};` +
    `--on-accent:${readableOn(settings.color_accent)};--on-highlight:${readableOn(highlight)}}`;
  return <style>{css}</style>;
}
