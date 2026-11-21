'use client';

import type { ReactNode } from 'react';

/** A submit button that asks "are you sure?" first. Used for deleting. */
export function ConfirmButton({ message, className, children, label }: { message: string; className?: string; children: ReactNode; label: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
