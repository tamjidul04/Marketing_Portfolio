import type { SiteSettings } from "@/lib/content";
import { readableOn } from "@/lib/format";

/**
 * Applies the brand colours from site_settings (validated as #RRGGBB by the database).
 * Text on accent buttons is chosen by real contrast, so any accent colour stays readable.
 */
export function ThemeStyle({ settings }: { settings: Pick<SiteSettings, "color_primary" | "color_accent"> }) {
  const css = `:root{--navy:${settings.color_primary};--gold:${settings.color_accent};--on-gold:${readableOn(settings.color_accent)}}`;
  return <style>{css}</style>;
}
