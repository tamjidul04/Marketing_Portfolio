"use client";

import { useEffect } from "react";

/**
 * Shown instead of a raw error page if the content database can't be reached (for example
 * while a paused Supabase project is waking up). The site fixes itself once the database is back.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="section" style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="wrap" style={{ maxWidth: "34rem" }}>
        <span className="eyebrow">One moment</span>
        <h1 className="h2">This page is taking a short break</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          It couldn&apos;t load just now. This usually fixes itself within a minute. Please try again.
        </p>
        <button type="button" className="btn btn-navy" onClick={() => retry()}>
          Try again
        </button>
      </div>
    </main>
  );
}
