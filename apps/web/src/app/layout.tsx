import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "./sections.css";
import { RevealProvider } from "@/components/reveal-provider";
import { EffectsProvider } from "@/components/effects-provider";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Analytics } from "@/components/analytics";
import { getProfile, getSettings } from "@/lib/content";
import { whatsappUrl } from "@/lib/format";
import { siteUrl } from "@/lib/seo";
import { mediaUrl } from "@/lib/supabase";

const font = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Search + share metadata. Titles, descriptions and the share image come from the database (admin-editable). */
export async function generateMetadata(): Promise<Metadata> {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const title = settings.seo_title || `${profile.full_name} — ${profile.role_title}`;
  const description = settings.seo_description || profile.hero_intro || undefined;
  // the uploaded share image, or the automatic branded one at /og
  const shareImage = mediaUrl(settings.og_image_path) ?? "/og";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${profile.full_name}` },
    description,
    applicationName: profile.full_name,
    authors: [{ name: profile.full_name }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: profile.full_name,
      title,
      description,
      url: "/",
      locale: "en_US",
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1626" },
  ],
};

// Runs before first paint: applies the saved theme and turns on scroll-reveal
// styles (only when JS runs, so content is never hidden without it).
const earlyScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${font.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip">Skip to content</a>
        <RevealProvider />
        <EffectsProvider />
        {children}
        <Suspense>
          <WhatsAppFloat />
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}

async function WhatsAppFloat() {
  const settings = await getSettings();
  const href = whatsappUrl(settings.whatsapp, "Hi, I found your website and would like to talk.");
  // in its own labelled landmark so screen-reader users can find it (it floats outside <main>)
  return href ? (
    <aside aria-label="Chat on WhatsApp">
      <FloatingWhatsApp href={href} />
    </aside>
  ) : null;
}
