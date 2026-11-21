"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

/** Dark / light switch. The saved choice is applied before first paint by the layout script. */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  return (
    <button type="button" onClick={toggle} className="icon-btn" aria-label="Toggle dark mode">
      <Icon name="moon" size={18} />
    </button>
  );
}

/** Mobile navigation drawer. Links come from the server so the list always matches the page. */
export function MobileMenu({ links, ctaHref, ctaLabel }: { links: { href: string; label: string }[]; ctaHref: string; ctaLabel: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="icon-btn menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
        <Icon name="menu" size={20} />
      </button>
      <nav id="mobile-menu" className={`mobile-menu${open ? " open" : ""}`} aria-label="Mobile">
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href={ctaHref} className="btn btn-gold" onClick={() => setOpen(false)}>
          {ctaLabel}
        </a>
      </nav>
    </>
  );
}

/** Number that counts up the first time it scrolls into view. The final value is in the server HTML. */
export function CountUp({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const fmt = (v: number) => prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    el.textContent = fmt(0);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min((t - t0) / 1800, 1);
          el.textContent = fmt(value * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, prefix, suffix, decimals]);

  const final = prefix + value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  return <span ref={ref}>{final}</span>;
}
