import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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

const font = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Search + share metadata. Titles, descriptions and the share image come from the database (admin-editable). */
export async function generateMetadata(): Promise<Metadata> {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const title = settings.seo_title || `${profile.full_name} — ${profile.role_title}`;
  const description = settings.seo_description || profile.hero_intro || undefined;
  const ogImage = mediaUrl(settings.og_image_path); // when empty, the generated opengraph-image is used

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
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(ogImage ? { images: [ogImage] } : {}) },
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
  return href ? <FloatingWhatsApp href={href} /> : null;
}
