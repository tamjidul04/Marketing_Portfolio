import { ThemeStyle } from "@/components/theme-style";
import type { Metadata } from "next";
import { Footer } from "@/components/sections/about-contact";
import { Header, type NavLink } from "@/components/sections/header-hero";
import { getProfile, getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How this website handles your information.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const links: NavLink[] = [{ href: "#work", label: "Work" }, { href: "#services", label: "Services" }, { href: "#about", label: "About" }];
  const trackers = [settings.meta_pixel_id && "Meta Pixel (Facebook / Instagram)", settings.ga4_id && "Google Analytics"].filter(Boolean) as string[];
  const contact = settings.contact_email;

  return (
    <>
      <ThemeStyle settings={settings} />
      <Header profile={profile} links={links} basePath="/" />
      <main className="section">
        <div className="wrap" style={{ maxWidth: "46rem" }}>
          <span className="eyebrow">Legal</span>
          <h1 className="h2">Privacy policy</h1>
          <div className="prose">
            <p>
              This page explains what information <strong>{profile.full_name}</strong> collects through this website and what is done with it.
              It is a plain-language template: if you run a business, have it reviewed against the laws that apply to you.
            </p>

            <h3>Information you send me</h3>
            <p>
              If you fill in the consultation form, I receive the details you enter (name, business, phone, email, service, budget and message).
              I use them only to reply to you and to understand what you need. I do not sell or share them, and I keep them only as long as needed to
              work with you or answer your request.
            </p>

            <h3>Visitor information</h3>
            <p>
              To protect the form from spam, a scrambled (hashed) version of your network address is stored with your message. The original address is
              never stored.
            </p>

            <h3>Analytics and advertising cookies</h3>
            {trackers.length > 0 ? (
              <>
                <p>This website uses the following services to understand visits and to measure advertising:</p>
                <ul>
                  {trackers.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p>
                  These services may set cookies and receive information such as the pages you view and your approximate location. If your browser sends a
                  &ldquo;Do Not Track&rdquo; signal, they are not loaded. You can also block or delete cookies in your browser settings.
                </p>
              </>
            ) : (
              <p>This website currently does not use analytics or advertising cookies.</p>
            )}

            <h3>Your choices</h3>
            <p>You can ask me to see, correct or delete the information you sent me at any time.</p>

            <h3>Contact</h3>
            <p>{contact ? <>Questions about privacy? Email <a href={`mailto:${contact}`}>{contact}</a>.</> : "Questions about privacy? Use the contact form on the home page."}</p>
          </div>
        </div>
      </main>
      <Footer profile={profile} settings={settings} />
    </>
  );
}
