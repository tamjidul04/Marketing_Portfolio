import { Contact, About, FaqSection, Footer } from "@/components/sections/about-contact";
import { Header, Hero, type NavLink } from "@/components/sections/header-hero";
import { Logos, Results } from "@/components/sections/proof";
import { Process, Services, Tools } from "@/components/sections/services";
import { Work } from "@/components/sections/work";
import {
  getAboutFacts, getBrands, getCaseStudies, getCertifications, getFaqs, getProcessSteps,
  getProfile, getServices, getSettings, getStats, getTestimonials, getTools,
} from "@/lib/content";

export default async function Home() {
  const [profile, settings, stats, brands, certs, cases, testimonials, services, steps, tools, facts, faqs] = await Promise.all([
    getProfile(), getSettings(), getStats(), getBrands(), getCertifications(), getCaseStudies(),
    getTestimonials(), getServices(), getProcessSteps(), getTools(), getAboutFacts(), getFaqs(),
  ]);

  const links: NavLink[] = [
    cases.length > 0 && { href: "#work", label: "Work" },
    services.length > 0 && { href: "#services", label: "Services" },
    settings.show_process && steps.length > 0 && { href: "#process", label: "Process" },
    { href: "#about", label: "About" },
    settings.show_faq && faqs.length > 0 && { href: "#faq", label: "FAQ" },
  ].filter(Boolean) as NavLink[];

  return (
    <>
      {/* Brand colours come from the database (validated as #RRGGBB), so the template re-themes without code. */}
      <style>{`:root{--navy:${settings.color_primary};--gold:${settings.color_accent};--on-gold:${settings.color_primary}}`}</style>
      <Header profile={profile} links={links} />
      <main>
        <Hero profile={profile} settings={settings} heroStats={stats.filter((s) => s.show_in_hero).slice(0, 2)} />
        {settings.show_results && <Results stats={stats} />}
        {settings.show_brands && <Logos brands={brands} certs={certs} />}
        <Work cases={cases} testimonials={testimonials} />
        <Services services={services} />
        {settings.show_process && <Process steps={steps} />}
        {settings.show_tools && <Tools tools={tools} />}
        <About profile={profile} facts={facts} />
        {settings.show_faq && <FaqSection faqs={faqs} />}
        <Contact profile={profile} settings={settings} />
      </main>
      <Footer profile={profile} settings={settings} />
    </>
  );
}
