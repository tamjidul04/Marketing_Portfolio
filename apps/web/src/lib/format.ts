/** "#RRGGBB" → [r, g, b] */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const INK = "#1B2A4A";
const INK_L = luminance(INK);

/** Dark navy or white text: whichever has the higher WCAG contrast on this background. */
export function readableOn(hex: string): "#1B2A4A" | "#FFFFFF" {
  const L = luminance(hex);
  const withWhite = 1.05 / (L + 0.05);
  const withInk = (L + 0.05) / (INK_L + 0.05);
  return withInk >= withWhite ? INK : "#FFFFFF";
}

/** Slightly darker shade, for card gradients. */
export function darken(hex: string, amount = 0.14): string {
  const [r, g, b] = rgb(hex).map((v) => Math.round(v * (1 - amount)));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Split text into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/** wa.me link from a digits-only number; undefined if none. */
export function whatsappUrl(number: string | null | undefined, text?: string): string | undefined {
  if (!number) return undefined;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
