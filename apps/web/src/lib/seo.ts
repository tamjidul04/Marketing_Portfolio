// Pure helpers (no framework imports) so they can be unit-tested.

/** Public site URL, from NEXT_PUBLIC_SITE_URL (set it to your domain when you get one). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return siteUrl() + (path.startsWith("/") ? path : "/" + path);
}

/**
 * JSON for a <script type="application/ld+json"> tag. "<" is escaped so admin-written text such as
 * "</script><script>…" can never break out of the tag (XSS). U+2028/2029 are escaped for old parsers.
 */
export function jsonLdString(data: unknown): string {
  const BS = String.fromCharCode(92); // a single backslash character
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .split("<").join(BS + "u003c")
    .split(LS).join(BS + "u2028")
    .split(PS).join(BS + "u2029");
}

// Same formats the database enforces (site_settings checks). Checked again before an ID is placed
// inside a script, so a bad value can never become code.
const PIXEL_RE = /^[0-9]{8,20}$/;
const GA4_RE = /^G-[A-Z0-9]{4,15}$/;
export const isPixelId = (v: string | null | undefined): v is string => typeof v === "string" && PIXEL_RE.test(v);
export const isGa4Id = (v: string | null | undefined): v is string => typeof v === "string" && GA4_RE.test(v);

/**
 * Loader for Meta Pixel and/or Google Analytics 4. Respects the browser's "Do Not Track" setting.
 * Returns null when no valid ID is configured (so nothing is loaded at all).
 */
export function analyticsSnippet(pixelId: string | null | undefined, ga4Id: string | null | undefined): string | null {
  const pixel = isPixelId(pixelId) ? pixelId : null;
  const ga = isGa4Id(ga4Id) ? ga4Id : null;
  if (!pixel && !ga) return null;

  const parts: string[] = ["(function(){if(navigator.doNotTrack==='1'||window.doNotTrack==='1')return;"];
  if (pixel) {
    parts.push(
      "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
      `fbq('init','${pixel}');fbq('track','PageView');`,
    );
  }
  if (ga) {
    parts.push(
      `var g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id=${ga}';document.head.appendChild(g);`,
      "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());",
      `gtag('config','${ga}',{anonymize_ip:true});`,
    );
  }
  parts.push("})();");
  return parts.join("");
}
