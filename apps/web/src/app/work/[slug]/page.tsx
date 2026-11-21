import { ThemeStyle } from "@/components/theme-style";
import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/sections/about-contact";
import { Header, type NavLink } from "@/components/sections/header-hero";
import { TestimonialCard, Visual, metricList } from "@/components/sections/work";
import { Prose } from "@/components/prose";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { darken, readableOn } from "@/lib/format";
import { mediaUrl } from "@/lib/supabase";
import { getCaseStudies, getCaseStudy, getProfile, getSettings, getTestimonials } from "@/lib/content";

// Prerender the published case studies at build time. Ones published later are served as a
// fast shell and upgraded in the background, so new projects appear without a rebuild.
export async function generateStaticParams() {
  const cases = await getCaseStudies();
  return cases.length > 0 ? cases.map((c) => ({ slug: c.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCaseStudy(slug);
  if (!found) return { title: "Case study not found" };
  const { study } = found;
  const cover = mediaUrl(study.cover_path);
  return {
    title: study.seo_title || study.title,
    description: study.seo_description || study.summary || undefined,
    alternates: { canonical: `/work/${study.slug}` },
    twitter: { card: "summary_large_image", images: [cover ?? "/og"] },
    openGraph: {
      type: "article",
      url: `/work/${study.slug}`, title: study.seo_title || study.title, description: study.seo_description || study.summary || undefined, images: [cover ?? "/og"] },
  };
}

export default function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: "6rem 0" }} aria-busy="true" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/work/[slug]">["params"] }) {
  const { slug } = await params;
  const [found, profile, settings, all, testimonials] = await Promise.all([
    getCaseStudy(slug), getProfile(), getSettings(), getCaseStudies(), getTestimonials(),
  ]);
  if (!found) notFound();
  const { study, images } = found;

  const idx = all.findIndex((c) => c.id === study.id);
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  const quotes = testimonials.filter((t) => t.case_study_id === study.id);
  const metrics = metricList(study.metrics);
  const color = study.card_color;
  const ink = readableOn(color);
  const cover = mediaUrl(study.cover_path);

  const links: NavLink[] = [
    { href: "#work", label: "Work" },
    { href: "#services", label: "Services" },
    { href: "#about", label: "About" },
  ];

  const story = [
    { n: "01", title: "The challenge", text: study.challenge },
    { n: "02", title: "The strategy", text: study.strategy },
    { n: "03", title: "The results", text: study.results },
  ].filter((s) => s.text.trim());

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: study.title,
          description: study.seo_description || study.summary || undefined,
          image: cover || undefined,
          datePublished: study.published_at || undefined,
          dateModified: study.updated_at,
          mainEntityOfPage: absoluteUrl(`/work/${study.slug}`),
          author: { "@type": "Person", name: profile.full_name, url: absoluteUrl("/") },
          publisher: { "@type": "Person", name: profile.full_name },
        }}
      />
      <ThemeStyle settings={settings} />
      <Header profile={profile} links={links} basePath="/" />
      <main>
        <section className="section dots cs-hero">
          <div className="glow glow-accent" style={{ width: "36rem", height: "36rem", right: "-8rem", top: "-10rem" }} aria-hidden />
          <div className="wrap z">
            <Link href="/#work" className="back-link">
              ← All case studies
            </Link>
            <div className="cs-grid">
              <div>
                <span className="eyebrow">{[study.client_name, study.industry].filter(Boolean).join(" · ") || "Case study"}</span>
                <h1 className="cs-title">{study.title}</h1>
                {study.summary && <p className="lead">{study.summary}</p>}
                <div className="cs-meta">
                  {study.channels.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                  {study.duration_text && <span className="dur">⏱ {study.duration_text}</span>}
                </div>
                <div className="cta-row" style={{ marginTop: "1.75rem" }}>
                  <Link href="/#contact" className="btn btn-accent">
                    Get results like this
                  </Link>
                </div>
              </div>

              <div className="cs-panel" style={{ background: `linear-gradient(160deg, ${color}, ${darken(color)})`, color: ink }}>
                {study.kpi_value && (
                  <div className="cs-kpi">
                    <b>{study.kpi_value}</b>
                    <span>{study.kpi_label}</span>
                  </div>
                )}
                <Visual study={study} />
              </div>
            </div>
          </div>
        </section>

        {metrics.length > 0 && (
          <section className="wrap cs-metrics" aria-label="Key metrics">
            {metrics.map((m) => (
              <div className="card reveal" key={m.label}>
                <b>{m.value}</b>
                <span>{m.label}</span>
              </div>
            ))}
          </section>
        )}

        {cover && study.visual_type !== "image" && (
          <div className="wrap" style={{ marginTop: "clamp(2rem,4vw,3rem)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="cs-cover reveal" />
          </div>
        )}

        {story.length > 0 && (
          <section className="section">
            <div className="wrap cs-story">
              {story.map((s) => (
                <div className="cs-row reveal" key={s.n}>
                  <div>
                    <span className="cs-n">{s.n}</span>
                    <h2 className="h2" style={{ marginTop: "0.25rem" }}>
                      {s.title}
                    </h2>
                  </div>
                  <Prose text={s.text} />
                </div>
              ))}
            </div>
          </section>
        )}

        {images.length > 0 && (
          <section className="section section-alt">
            <div className="wrap">
              <h2 className="h2 reveal">Screenshots</h2>
              <div className="cs-gallery">
                {images.map((img) => {
                  const url = mediaUrl(img.image_path);
                  if (!url) return null;
                  return (
                    <figure className="reveal" key={img.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={img.alt} loading="lazy" />
                      {img.caption && <figcaption>{img.caption}</figcaption>}
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {quotes.length > 0 && (
          <section className="section">
            <div className="wrap" style={{ maxWidth: "46rem" }}>
              {quotes.map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap cs-end">
            <div className="cs-cta reveal">
              <h2 className="h2" style={{ color: "#fff" }}>
                Want results like this?
              </h2>
              <p className="lead" style={{ color: "#c9d1e3" }}>
                Book a free consultation and let&apos;s look at your numbers together.
              </p>
              <Link href="/#contact" className="btn btn-accent" style={{ marginTop: "1.25rem" }}>
                Book Free Consultation
              </Link>
            </div>
            {next && (
              <Link href={`/work/${next.slug}`} className="cs-next reveal" style={{ background: `linear-gradient(160deg, ${next.card_color}, ${darken(next.card_color)})`, color: readableOn(next.card_color) }}>
                <span className="client">Next project</span>
                <h3>{next.title}</h3>
                {next.kpi_value && (
                  <p>
                    <b>{next.kpi_value}</b> {next.kpi_label}
                  </p>
                )}
                <span className="more">View case study →</span>
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer profile={profile} settings={settings} />
    </>
  );
}
