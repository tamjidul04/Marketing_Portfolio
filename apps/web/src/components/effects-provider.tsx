"use client";

import { useEffect, useRef } from "react";

/**
 * Desktop-only polish. Does NOTHING when the visitor prefers reduced motion, and the pointer
 * effects (tilt, magnetic buttons, cursor glow, hero depth) also do nothing on touch devices.
 *   [data-speed]   parallax on scroll (≥ 992px)
 *   .case          3D tilt toward the pointer
 *   .magnetic      button leans toward the pointer
 *   #hero          photo + floating cards shift with the pointer
 *   .cursor-glow   soft accent light that follows the pointer (≥ 992px)
 */
export function EffectsProvider() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const wide = () => innerWidth >= 992;
    const cleanups: (() => void)[] = [];

    /* ---------- parallax ---------- */
    const layers = [...document.querySelectorAll<HTMLElement>("[data-speed]")];
    let ticking = false;
    const parallax = () => {
      ticking = false;
      if (!wide()) {
        layers.forEach((el) => (el.style.translate = ""));
        return;
      }
      const vh = innerHeight;
      for (const el of layers) {
        const parent = el.offsetParent as HTMLElement | null;
        if (!parent) continue;
        const centre = parent.getBoundingClientRect().top + el.offsetTop + el.offsetHeight / 2; // untransformed centre
        if (centre < -vh || centre > vh * 2) continue;
        el.style.translate = `0 ${((centre - vh / 2) * -parseFloat(el.dataset.speed ?? "0")).toFixed(1)}px`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    parallax();
    cleanups.push(() => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    });

    if (fine) {
      /* ---------- tilt + magnetic (event delegation: one listener each) ---------- */
      let tilted: HTMLElement | null = null;
      let magnet: HTMLElement | null = null;
      const reset = (el: HTMLElement | null, prop: "transform" | "translate") => el && (el.style[prop] = "");

      const onMove = (e: PointerEvent) => {
        const t = e.target as Element | null;
        const card = t?.closest<HTMLElement>(".case") ?? null;
        if (card !== tilted) reset(tilted, "transform");
        tilted = card;
        if (card && wide()) {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(1000px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-6px)`;
        }

        const btn = t?.closest<HTMLElement>(".magnetic") ?? null;
        if (btn !== magnet) reset(magnet, "translate");
        magnet = btn;
        if (btn) {
          const r = btn.getBoundingClientRect();
          btn.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`;
        }
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => document.removeEventListener("pointermove", onMove));

      /* ---------- hero depth ---------- */
      const hero = document.getElementById("hero");
      const photo = hero?.querySelector<HTMLElement>(".photo-wrap");
      if (hero && photo) {
        const move = (e: PointerEvent) => {
          const r = hero.getBoundingClientRect();
          photo.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          photo.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        };
        const leave = () => {
          photo.style.setProperty("--mx", "0");
          photo.style.setProperty("--my", "0");
        };
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
        });
      }

      /* ---------- cursor glow (smoothed) ---------- */
      const glow = glowRef.current;
      if (glow) {
        let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, running = false;
        const loop = () => {
          gx += (tx - gx) * 0.12;
          gy += (ty - gy) * 0.12;
          glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
          if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) requestAnimationFrame(loop);
          else running = false;
        };
        const move = (e: PointerEvent) => {
          tx = e.clientX;
          ty = e.clientY;
          if (wide()) glow.classList.add("on");
          if (!running) {
            running = true;
            requestAnimationFrame(loop);
          }
        };
        const out = () => glow.classList.remove("on");
        addEventListener("pointermove", move, { passive: true });
        document.documentElement.addEventListener("pointerleave", out);
        cleanups.push(() => {
          removeEventListener("pointermove", move);
          document.documentElement.removeEventListener("pointerleave", out);
        });
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
