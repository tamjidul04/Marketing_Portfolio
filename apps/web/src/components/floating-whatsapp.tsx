"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";

/** Floating chat button. Slides away while someone is typing in a form (so it never covers the keyboard area). */
export function FloatingWhatsApp({ href }: { href: string }) {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const on = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const off = () => setTyping(false);
    addEventListener("focusin", on);
    addEventListener("focusout", off);
    return () => {
      removeEventListener("focusin", on);
      removeEventListener("focusout", off);
    };
  }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`wa${typing ? " hide" : ""}`} aria-label="Chat on WhatsApp">
      <span className="tip">Chat on WhatsApp</span>
      <WhatsAppIcon size={30} />
    </a>
  );
}
