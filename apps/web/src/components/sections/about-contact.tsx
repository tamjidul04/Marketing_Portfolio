import type { AboutFact, Faq, Profile, SiteSettings } from "@/lib/content";
import { Icon, SocialIcon, WhatsAppIcon } from "@/components/icons";
import { paragraphs, whatsappUrl } from "@/lib/format";
import { getYear } from "@/lib/content";
import { ConsultationForm } from "@/components/consultation-form";

export function About({ profile, facts }: { profile: Profile; facts: AboutFact[] }) {
  const paras = paragraphs(profile.about_body);
  if (paras.length === 0 && facts.length === 0) return null;
  return (
    <section id="about" className="section section-alt">
      <div className="glow glow-gold" style={{ width: "30rem", height: "30rem", right: "-10rem", top: "10%" }} aria-hidden />
      <div className="wrap about-grid z" style={facts.length === 0 ? { gridTemplateColumns: "1fr", maxWidth: "50rem" } : undefined}>
        {facts.length > 0 && (
          <div className="about-card reveal">
            {facts.map((f) => (
              <div className="row" key={f.id}>
                <span className="ic">
                  <Icon name={f.icon} size={20} />
                </span>
                <div>
                  <b>{f.label}</b>
                  <span>{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="about-text reveal" style={{ ["--d" as string]: "150ms" }}>
          <span className="eyebrow">About me</span>
          <h2 className="h2">{profile.about_title}</h2>
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {profile.about_quote && <p className="quote-line">“{profile.about_quote}”</p>}
          <a href="#contact" className="btn btn-navy" style={{ marginTop: "0.5rem" }}>
            Let&apos;s Work Together →
          </a>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section id="faq" className="section">
      <span className="watermark" aria-hidden>
        FAQ
      </span>
      <div className="wrap z">
        <div className="center reveal">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2">Questions clients ask</h2>
        </div>
        <div className="faq reveal">
          {faqs.map((f, i) => (
            <details key={f.id} open={i === 0}>
              <summary>{f.question}</summary>
              <div className="ans">
                {paragraphs(f.answer).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact({ profile, settings, services }: { profile: Profile; settings: SiteSettings; services: string[] }) {
  const wa = whatsappUrl(settings.whatsapp, `Hi ${profile.short_name}, I'd like to book a free consultation.`);
  return (
    <section id="contact" className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="contact-box reveal">
          <div style={{ position: "relative" }}>
            <span className="eyebrow">Let&apos;s talk</span>
            <h2 className="h2">Ready to grow your business?</h2>
            <p className="lead">Book a free consultation and tell me about your business. {settings.response_time_text}.</p>
            <div className="cm">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <span className="ic" style={{ background: "#25D366", color: "#fff" }}>
                    <WhatsAppIcon size={20} />
                  </span>
                  <div>
                    <span>WhatsApp (fastest)</span>
                    <b>+{settings.whatsapp}</b>
                  </div>
                </a>
              )}
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`}>
                  <span className="ic" style={{ background: "var(--gold)", color: "#1B2A4A" }}>
                    <Icon name="mail" size={20} />
                  </span>
                  <div>
                    <span>Email</span>
                    <b>{settings.contact_email}</b>
                  </div>
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
                  <span className="ic" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>
                    <Icon name="phone" size={20} />
                  </span>
                  <div>
                    <span>Phone</span>
                    <b>{settings.phone}</b>
                  </div>
                </a>
              )}
            </div>
          </div>
          <div className="contact-form-slot" id="consultation">
            <ConsultationForm services={services} budgets={settings.budget_options} responseText={settings.response_time_text} />
          </div>
        </div>
      </div>
    </section>
  );
}

type Social = { platform: string; url: string };
export function parseSocials(j: SiteSettings["socials"]): Social[] {
  if (!Array.isArray(j)) return [];
  return j.flatMap((s) => {
    const o = s as { platform?: unknown; url?: unknown };
    return typeof o?.platform === "string" && typeof o?.url === "string" && /^https?:\/\//i.test(o.url) ? [{ platform: o.platform, url: o.url }] : [];
  });
}

export async function Footer({ profile, settings }: { profile: Profile; settings: SiteSettings }) {
  const year = await getYear();
  const socials = parseSocials(settings.socials);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot">
          <div>
            <a href="#top" className="logo">
              <span className="logo-mark">{profile.initials}</span>
              {profile.full_name}
            </a>
            <p style={{ color: "var(--muted)", margin: "0.6rem 0 0" }}>
              {profile.role_title} · {profile.headline}
            </p>
          </div>
          {socials.length > 0 && (
            <div className="socials">
              {socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}>
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="copy">
          <span>
            © {year} {profile.full_name}. All rights reserved.
            {settings.footer_text ? ` ${settings.footer_text}` : ""}
          </span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
