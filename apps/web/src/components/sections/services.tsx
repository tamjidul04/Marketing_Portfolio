import type { ProcessStep, Service, Tool } from "@/lib/content";
import { Icon } from "@/components/icons";

export function Services({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <section id="services" className="section section-alt">
      <span className="watermark" aria-hidden>
        SERVICES
      </span>
      <div className="wrap z">
        <div className="center reveal">
          <span className="eyebrow">Services</span>
          <h2 className="h2">How I can help your business grow</h2>
          <p className="lead">Digital marketing solutions tailored to your goals — from first click to final sale.</p>
        </div>
        <div className="svc-grid">
          {services.map((s) => (
            <div className="svc reveal" key={s.id}>
              <div className="ic">
                <Icon name={s.icon} size={26} />
              </div>
              <h3>{s.title}</h3>
              {s.description && <p>{s.description}</p>}
              {s.features.length > 0 && (
                <ul>
                  {s.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="svc cta reveal">
            <div>
              <h3 style={{ fontSize: "1.5rem" }}>Not sure what you need?</h3>
              <p style={{ marginTop: "0.6rem" }}>Get a free consultation. I&apos;ll review your current marketing and show you the quickest wins.</p>
            </div>
            <a href="#contact" className="btn btn-gold" style={{ marginTop: "1.25rem" }}>
              Book Free Consultation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Process({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section id="process" className="section dots">
      <span className="watermark" aria-hidden>
        PROCESS
      </span>
      <div className="wrap z">
        <div className="center reveal">
          <span className="eyebrow">How I work</span>
          <h2 className="h2">A simple, proven process</h2>
          <p className="lead">No guesswork. Every step is measured, so you always know what&apos;s happening and why.</p>
        </div>
        <ol className="steps reveal" style={{ listStyle: "none", padding: 0 }}>
          {steps.map((s, i) => (
            <li className="step" key={s.id} style={{ ["--i" as string]: i }}>
              <div className="n" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3>{s.title}</h3>
                {s.description && <p>{s.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Tools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap center reveal">
        <span className="eyebrow">Platforms &amp; tools</span>
        <h2 className="h2">What I work with</h2>
        <ul className="tools" style={{ listStyle: "none", padding: 0 }}>
          {tools.map((t) => (
            <li className="tool" key={t.id}>
              <i style={{ background: t.color }} aria-hidden />
              {t.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
