import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./sections.css";
import { Suspense } from "react";
import { RevealProvider } from "@/components/reveal-provider";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { getSettings } from "@/lib/content";
import { whatsappUrl } from "@/lib/format";

const font = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Your Name — Digital Marketing Specialist",
  description: "Paid ads, analytics and growth strategy for brands that want measurable results.",
};

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
        {children}
        <Suspense>
          <WhatsAppFloat />
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
