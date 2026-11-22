import type { NextConfig } from "next";

/*
 * Security headers for every page.
 *
 * Content-Security-Policy: the browser may only load scripts, images and connections from the
 * places listed here. Inline scripts are allowed ('unsafe-inline') because the pages are static
 * and cached — per-request nonces would force every page to render on each visit. The allow-list
 * still blocks scripts from any other site, <base> hijacking, plugins, forms posting elsewhere,
 * and other sites framing this one.
 * Meta Pixel / Google Analytics domains are listed so tracking works when an ID is set in the admin;
 * nothing is loaded from them otherwise.
 */
const isDev = process.env.NODE_ENV === "development";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const httpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

const META = ["https://connect.facebook.net", "https://www.facebook.com"];
const GOOGLE = ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://connect.facebook.net https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} ${[...META, ...GOOGLE].join(" ")}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} ${[...META, ...GOOGLE].join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(httpsSite ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Browsers only honour this over HTTPS; it makes them refuse plain-HTTP visits for 2 years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
