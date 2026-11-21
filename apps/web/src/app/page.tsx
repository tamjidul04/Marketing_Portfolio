import { Suspense } from "react";
import { getCaseStudies, getProfile, getServices, getStats } from "@/lib/content";

// TEMPORARY design-system + data check — replaced by the real home page in step 2.2.
export default function Home() {
  return (
    <main className="section dots flex-1">
      <div className="glow glow-gold" style={{ width: "40rem", height: "40rem", right: "-8rem", top: "-8rem" }} />
      <div className="wrap z">
        <span className="eyebrow reveal">Design system check</span>
        <h1 className="h2 reveal">Turning Data Into <span className="text-gold">Growth</span></h1>
        <p className="lead reveal">Styles come from the approved mockup. The cards below are read live from the database.</p>
        <div className="mt-6 flex flex-wrap gap-3 reveal">
          <a className="btn btn-gold" href="#">Book Free Consultation</a>
          <a className="btn btn-navy" href="#">Book a Call</a>
          <a className="btn btn-ghost" href="#">See My Results →</a>
        </div>
        <Suspense fallback={<p className="mt-10 text-muted">Loading content…</p>}>
          <LiveContent />
        </Suspense>
      </div>
    </main>
  );
}

async function LiveContent() {
  const [profile, stats, services, cases] = await Promise.all([getProfile(), getStats(), getServices(), getCaseStudies()]);
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <div className="card p-6 reveal"><p className="text-muted text-sm">Profile</p><p className="text-xl font-extrabold">{profile.full_name}</p><p className="text-sm text-muted">{profile.headline}</p></div>
      <div className="card p-6 reveal"><p className="text-muted text-sm">Stats</p><p className="text-3xl font-extrabold text-gold">{stats.length}</p><p className="text-sm text-muted">{stats.map((s) => s.label).join(" · ")}</p></div>
      <div className="card p-6 reveal"><p className="text-muted text-sm">Services / case studies</p><p className="text-3xl font-extrabold text-gold">{services.length} / {cases.length}</p><p className="text-sm text-muted">{cases.map((c) => c.title).join(" · ")}</p></div>
    </div>
  );
}
