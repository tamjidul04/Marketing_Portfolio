import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

/**
 * Decorative cards that live in the empty page margins on very wide screens (≥ 140em ≈ 2240px).
 * Hidden below that width. Purely decorative: no numbers or claims, hidden from screen readers.
 */
export function Side({ side, top, speed = 0.2, children }: { side: "l" | "r"; top: string; speed?: number; children: ReactNode }) {
  return (
    <div className={`side side-${side}`} style={{ top }} data-speed={speed} aria-hidden="true">
      {children}
    </div>
  );
}

export function ChipNotify({ delay = 0 }: { delay?: number }) {
  return (
    <div className="chip" style={{ animationDelay: `${delay}s` }}>
      <span className="ic" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
        <Icon name="bell" size={18} />
      </span>
      <div>
        <b>New lead received</b>
        <small>just now</small>
      </div>
    </div>
  );
}

export function ChipApproved({ delay = 0 }: { delay?: number }) {
  return (
    <div className="chip" style={{ animationDelay: `${delay}s` }}>
      <span className="ic" style={{ background: "#E8F7EE", color: "#16A34A" }}>
        <Icon name="trending" size={18} />
      </span>
      <div>
        <b>Campaign approved ✓</b>
        <small>ready to launch</small>
      </div>
    </div>
  );
}

export function ChipBars({ delay = 0 }: { delay?: number }) {
  return (
    <div className="chip" style={{ animationDelay: `${delay}s`, flexDirection: "column", alignItems: "flex-start", gap: "0.4rem" }}>
      <small>Weekly growth</small>
      <div className="minibars">
        {[30, 45, 40, 65, 80, 100].map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function Orb({ icon, delay = 0 }: { icon: string; delay?: number }) {
  return (
    <div className="orb" style={{ animationDelay: `${delay}s` }}>
      <Icon name={icon} size={26} />
    </div>
  );
}
