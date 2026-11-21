import Link from "next/link";
import type { CaseStudy, Testimonial } from "@/lib/content";
import type { Json } from "@/lib/database.types";
import { Icon } from "@/components/icons";
import { darken, initialsOf, readableOn } from "@/lib/format";
import { mediaUrl } from "@/lib/supabase";
import { ChipApproved, ChipBars, Side } from "@/components/side-decor";

/* ----------------------------------------------------------------------------
 * case_studies.visual_data shapes (all optional — sensible defaults are used):
 *   bars    { title?, values?: number[0-100] }
 *   line    { title?, points?: number[0-100]  (higher = higher on chart) }
 *   ranking { title?, rows?: [{ label, rank }], footer_label?, footer_value? }
 *   ad      { headline?, text? }
 *   image   uses the case study cover image
 * -------------------------------------------------------------------------- */
const obj = (j: Json): Record<string, Json | undefined> => (j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, Json | undefined>) : {});
const nums = (j: Json | undefined, fallback: number[]): number[] => (Array.isArray(j) && j.length >= 2 && j.every((v) => typeof v === "number") ? (j as number[]).slice(0, 24) : fallback);
const str = (j: Json | undefined, fallback: string): string => (typeof j === "string" && j.trim() ? j : fallback);

export function metricList(j: Json): { label: string; value: string }[] {
  if (!Array.isArray(j)) return [];
  return j.flatMap((m) => {
    const o = obj(m as Json);
    return typeof o.label === "string" && typeof o.value === "string" ? [{ label: o.label, value: o.value }] : [];
  });
}

export function Visual({ study }: { study: CaseStudy }) {
  const d = obj(study.visual_data);
  const metrics = metricList(study.metrics);
  const metricRow = metrics.length > 0 && (
    <div className="minirow">
      {metrics.map((m) => (
        <div key={m.label}>
          <b>{m.value}</b>
          {m.label}
        </div>
      ))}
    </div>
  );

  if (study.visual_type === "image") {
    const cover = mediaUrl(study.cover_path);
    if (!cover) return null;
    return (
      <div className="cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" loading="lazy" />
      </div>
    );
  }

  let body: React.ReactNode;
  if (study.visual_type === "bars") {
    const values = nums(d.values, [22, 28, 25, 35, 40, 38, 52, 60, 58, 74, 86, 100]);
    body = (
      <>
        <div className="mock-top">
          <span>{str(d.title, "Results over time")}</span>
          {study.kpi_value && <span style={{ color: "#16A34A" }}>▲ {study.kpi_value}</span>}
        </div>
        <div className="bars" aria-hidden>
          {values.map((v, i) => (
            <i key={i} className={i >= values.length / 2 ? "on" : undefined} style={{ height: `${Math.max(4, Math.min(100, v))}%`, ["--i" as string]: i }} />
          ))}
        </div>
      </>
    );
  } else if (study.visual_type === "line") {
    const pts = nums(d.points, [80, 74, 78, 55, 42, 30, 18, 8]);
    const step = 300 / (pts.length - 1);
    const xy = pts.map((p, i) => `${(i * step).toFixed(1)} ${(100 - Math.max(0, Math.min(100, p)) + 8).toFixed(1)}`);
    const line = "M" + xy.join(" L");
    const gid = `lg-${study.id}`;
    body = (
      <>
        <div className="mock-top">
          <span>{str(d.title, "Performance")}</span>
          {study.kpi_value && <span style={{ color: "#16A34A" }}>{study.kpi_value}</span>}
        </div>
        <svg className="line-chart" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#E0A526" stopOpacity=".35" />
              <stop offset="1" stopColor="#E0A526" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="fill-in" d={`${line} L300 120 L0 120Z`} fill={`url(#${gid})`} />
          <path className="draw" d={line} stroke="#E0A526" strokeWidth="3" fill="none" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </>
    );
  } else if (study.visual_type === "ranking") {
    const rows = Array.isArray(d.rows)
      ? (d.rows as Json[]).flatMap((r) => {
          const o = obj(r);
          return typeof o.label === "string" ? [{ label: o.label, rank: String(o.rank ?? "") }] : [];
        })
      : [];
    const list = rows.length ? rows : [{ label: study.client_name || "Your client", rank: "#1" }, { label: "Competitor One", rank: "#2" }, { label: "Competitor Two", rank: "#3" }];
    body = (
      <div className="serp">
        <div className="mock-top">
          <span>{str(d.title, "Search ranking")}</span>
          <span>Rank</span>
        </div>
        {list.slice(0, 5).map((r, i) => (
          <div key={i} className={`row${i === 0 ? " top" : ""}`}>
            <span>{i === 0 ? "★ " : ""}{r.label}</span>
            <span>{r.rank}</span>
          </div>
        ))}
        {typeof d.footer_label === "string" && (
          <div className="row" style={{ marginBottom: 0 }}>
            <span>{d.footer_label}</span>
            <b style={{ color: "#16A34A" }}>{String(d.footer_value ?? "")}</b>
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <div className="ad" style={{ marginBottom: "0.6rem" }}>
        <div className="img" />
        <p>
          <b>{str(d.headline, "Sponsored · " + (study.client_name || "Your brand"))}</b>
          {str(d.text, study.summary || "Your ad creative and copy shown here.")}
        </p>
      </div>
    );
  }

  return (
    <div className="mock">
      <div className="mock-card">
        {body}
        {metricRow}
      </div>
    </div>
  );
}

export function CaseCard({ study }: { study: CaseStudy }) {
  const color = study.card_color;
  const ink = readableOn(color);
  return (
    <article className="case reveal" style={{ background: `linear-gradient(160deg, ${color}, ${darken(color)})`, color: ink }}>
      <span className="arrow" aria-hidden>
        <Icon name="trending" size={18} />
      </span>
      <span className="client">{[study.client_name, study.channels[0]].filter(Boolean).join(" · ")}</span>
      <h3>
        <Link href={`/work/${study.slug}`} className="stretch">
          {study.title}
        </Link>
      </h3>
      {study.kpi_value && (
        <div className="kpi">
          <b>{study.kpi_value}</b> {study.kpi_label}
        </div>
      )}
      {study.channels.length > 0 && (
        <div className="tags">
          {study.channels.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}
      <Visual study={study} />
    </article>
  );
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  const avatar = mediaUrl(t.avatar_path);
  return (
    <figure className="quote reveal" style={{ margin: 0 }}>
      <div className="q" aria-hidden>
        “
      </div>
      <blockquote style={{ margin: 0 }}>
        <p>{t.quote}</p>
      </blockquote>
      <figcaption className="who">
        <i style={{ background: t.avatar_color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar ? <img src={avatar} alt="" /> : initialsOf(t.author_name)}
        </i>
        <div>
          <b>{t.author_name}</b>
          <span>{[t.author_role, t.company].filter(Boolean).join(", ")}</span>
        </div>
      </figcaption>
    </figure>
  );
}

type Item = { kind: "case"; study: CaseStudy } | { kind: "quote"; t: Testimonial };

export function Work({ cases, testimonials }: { cases: CaseStudy[]; testimonials: Testimonial[] }) {
  if (cases.length === 0 && testimonials.length === 0) return null;

  // pattern: case, case, quote, case, case, quote … then any leftovers
  const items: Item[] = [];
  const ts = [...testimonials];
  cases.forEach((study, i) => {
    items.push({ kind: "case", study });
    if (i % 2 === 1 && ts.length) items.push({ kind: "quote", t: ts.shift()! });
  });
  ts.forEach((t) => items.push({ kind: "quote", t }));

  const cols: Item[][] = [[], []];
  items.forEach((it, i) => cols[i % 2].push(it));

  return (
    <section id="work" className="section">
      <span className="watermark" data-speed="0.08" aria-hidden>
        RESULTS
      </span>
      <Side side="l" top="30%" speed={0.22}><ChipApproved delay={-1} /></Side>
      <Side side="r" top="55%" speed={0.3}><ChipBars delay={-3} /></Side>
      <div className="wrap z">
        <div className="work-head reveal">
          <div>
            <span className="eyebrow">Case studies</span>
            <h2 className="h2">
              Results that speak
              <br />
              louder than words
            </h2>
          </div>
          <p className="lead" style={{ maxWidth: "26rem" }}>
            Real campaigns, real numbers. Open any project to see the full strategy.
          </p>
        </div>
        <div className="work-grid">
          {cols.map((col, ci) => (
            <div className="col" key={ci}>
              {col.map((it) => (it.kind === "case" ? <CaseCard key={it.study.id} study={it.study} /> : <TestimonialCard key={it.t.id} t={it.t} />))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
