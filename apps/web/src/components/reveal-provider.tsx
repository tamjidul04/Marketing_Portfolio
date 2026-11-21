"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page: adds `.in` to every `.reveal` element as it scrolls into view,
 * runs count-up numbers, and drives the top progress bar. Mount once in the layout.
 */
export function RevealProvider() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bar = document.getElementById("scroll-progress");

    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("in");
            io.unobserve(e.target);
          }),
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
      );
      els.forEach((el) => io.observe(el));
      var cleanup = () => io.disconnect(); // eslint-disable-line no-var
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking || !bar) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cleanup?.();
      removeEventListener("scroll", onScroll);
    };
  }, []);

  return <div id="scroll-progress" className="scroll-progress" aria-hidden="true" />;
}
