"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-accent" disabled={pending} aria-disabled={pending} style={{ width: "100%", opacity: pending ? 0.7 : 1 }}>
      {pending ? pendingText : children}
    </button>
  );
}
