import type { CaseStudy, Profile, SiteSettings, Stat } from "@/lib/content";
import { Icon, WhatsAppIcon } from "@/components/icons";
import { MobileMenu, ThemeToggle } from "@/components/interactive";
import { mediaUrl } from "@/lib/supabase";
import { whatsappUrl } from "@/lib/format";

export type NavLink = { href: string; label: string };

export function formatStat(s: Pick<Stat, "value" | "prefix" | "suffix" | "decimals">): string {
  return s.prefix + Number(s.value).toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals }) + s.suffix;
}

/** basePath: "" on the home page (in-page anchors); "/" on other pages so anchors point back to the home page. */
export function Header({ profile, links, basePath = "" }: { profile: Profile; links: NavLink[]; basePath?: string }) {
  const withBase = links.map((l) => ({ ...l, href: basePath + l.href }));
  return (
    <header className="site-header" id="top">
      <div className="wrap nav">
        <a href={basePath || "#top"} className="logo">
          <span className="logo-mark">{profile.initials}</span>
          <span className="name">{profile.full_name}</span>
        </a>
        <nav className="nav-links" aria-label="Main">
          {withBase.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <ThemeToggle />
          <a href={`${basePath}#contact`} className="btn btn-navy" style={{ minHeight: "2.75rem", padding: "0.6rem 1.1rem" }}>
            Book a Call
          </a>
          <MobileMenu links={withBase} ctaHref={`${basePath}#contact`} ctaLabel="Book Free Consultation" />
        </div>
      </div>
    </header>
  );
}

export function Hero({ profile, settings, heroStats }: { profile: Profile; settings: SiteSettings; heroStats: Stat[] }) {
  const photo = mediaUrl(profile.photo_path);
  const accent = new Set((profile.headline_accent ?? "").toLowerCase().split(/\s+/).filter(Boolean));
  const words = profile.headline.split(/\s+/).filter(Boolean);
  const lastAccentIdx = words.reduce((acc, w, i) => (accent.has(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")) ? i : acc), -1);
  const wa = whatsappUrl(settings.whatsapp, `Hi ${profile.short_name}, I'd like to book a free consultation.`);
  const [s1, s2] = heroStats;

  return (
    <section className="hero dots" id="hero">
      <div className="glow glow-gold" aria-hidden />
      <div className="glow glow-navy" aria-hidden />
      <svg className="hero-line" viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden>
        <path d="M0 185 C 180 180, 260 150, 380 155 S 600 120, 720 128 S 930 70, 1060 82 S 1300 30, 1420 36 S 1560 8, 1600 4" fill="none" stroke="#E0A526" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <div className="wrap hero-grid z">
        <div>
          {profile.is_available && (
            <span className="avail reveal">
              <span className="dot" />
              {profile.availability_text}
            </span>
          )}
          <p className="hi reveal" style={{ ["--d" as string]: "80ms" }}>
            Hi, I&apos;m {profile.short_name} 👋
          </p>
          <h1 aria-label={profile.headline}>
            {words.map((w, i) => {
              const isAccent = accent.has(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""));
              return (
                <span key={i}>
                  <span className={`w${i === lastAccentIdx ? " has-accent" : ""}`} style={{ ["--i" as string]: i }} aria-hidden>
                    <span className={isAccent ? "accent" : undefined}>
                      {w}
                      {i === lastAccentIdx && (
                        <svg className="underline" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                          <path d="M2 9 Q 100 -2 198 7" stroke="#E0A526" strokeWidth="4" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                  </span>{" "}
                </span>
              );
            })}
          </h1>
          {profile.hero_tags.length > 0 && (
            <div className="tagline reveal" style={{ ["--d" as string]: "500ms" }}>
              {profile.hero_tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          {profile.hero_intro && (
            <p className="lead reveal" style={{ ["--d" as string]: "600ms" }}>
              {profile.hero_intro}
            </p>
          )}
          <div className="cta-row reveal" style={{ ["--d" as string]: "700ms" }}>
            <a href="#contact" className="btn btn-gold">
              <Icon name="calendarPlus" size={18} />
              Book Free Consultation
            </a>
            {wa ? (
              <a href={wa} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} />
                WhatsApp
              </a>
            ) : (
              <a href="#work" className="btn btn-ghost">
                See My Results →
              </a>
            )}
          </div>
          {profile.trust_text && (
            <div className="trust reveal" style={{ ["--d" as string]: "800ms" }}>
              <span className="stars" aria-hidden>
                ★★★★★
              </span>
              <span>{profile.trust_text}</span>
            </div>
          )}
        </div>

        <div className="photo-wrap reveal" style={{ ["--d" as string]: "300ms" }}>
          <div className="ring" aria-hidden />
          <div className="photo">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={profile.photo_alt || profile.full_name} width={900} height={1125} fetchPriority="high" />
            ) : (
              <div className="photo-placeholder" aria-hidden>
                {profile.initials}
              </div>
            )}
          </div>
          {s1 && (
            <div className="float f1">
              <span className="ic" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                <Icon name="trending" size={20} />
              </span>
              <div>
                <b>{formatStat(s1)}</b>
                {s1.label}
              </div>
            </div>
          )}
          {s2 && (
            <div className="float f2">
              <span className="ic" style={{ background: "#E8F7EE", color: "#16A34A" }}>
                <Icon name="users" size={20} />
              </span>
              <div>
                <b>{formatStat(s2)}</b>
                {s2.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export type { CaseStudy };
