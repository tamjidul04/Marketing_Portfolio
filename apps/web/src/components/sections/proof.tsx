import type { Brand, Certification, Stat } from "@/lib/content";
import { CountUp } from "@/components/interactive";
import { mediaUrl } from "@/lib/supabase";

export function Results({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="results">
      <div className="glow" data-speed="-0.1" aria-hidden />
      <div className="glow l" aria-hidden />
      <div className="wrap">
        <div className="res-grid reveal">
          {stats.map((s) => (
            <div className="res" key={s.id}>
              <b>
                <CountUp value={Number(s.value)} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
              </b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Logos({ brands, certs }: { brands: Brand[]; certs: Certification[] }) {
  if (brands.length === 0 && certs.length === 0) return null;
  const tiles = brands.map((b) => {
    const logo = mediaUrl(b.logo_path);
    return (
      <div className="logo-tile" key={b.id}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={b.name} loading="lazy" />
        ) : (
          b.name
        )}
      </div>
    );
  });
  return (
    <div className="logos">
      {brands.length > 0 && (
        <>
          <div className="wrap">
            <h2 className="small">Brands I&apos;ve worked with</h2>
          </div>
          <div className="marquee reveal" role="group" aria-label="Client brands">
            <div className="track">
              <div className="set">{tiles}</div>
              <div className="set" aria-hidden>
                {tiles}
              </div>
            </div>
          </div>
        </>
      )}
      {certs.length > 0 && (
        <div className="wrap">
          <div className="badges reveal">
            {certs.map((c) => {
              const img = mediaUrl(c.image_path);
              const inner = (
                <>
                  <span className="ic" style={{ background: c.badge_color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img ? <img src={img} alt="" width={28} height={28} /> : c.badge_text}
                  </span>
                  {c.name}
                </>
              );
              return c.verify_url ? (
                <a key={c.id} className="badge" href={c.verify_url} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={c.id} className="badge">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
