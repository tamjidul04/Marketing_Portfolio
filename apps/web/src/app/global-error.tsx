"use client";

import { useEffect } from "react";

/**
 * Last-resort page if even the site frame can't load (it needs the database for the name and
 * colours). Has its own <html>/<body> and plain styling because the normal layout is unavailable.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f7f5", color: "#1B2A4A", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "1.5rem" }}>
        <main style={{ maxWidth: "30rem" }}>
          <title>Back in a moment</title>
          <h1 style={{ fontSize: "1.8rem", margin: "0 0 0.75rem" }}>We&apos;ll be right back</h1>
          <p style={{ color: "#5b6478", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            The website couldn&apos;t load just now. This usually fixes itself within a minute. Please try again.
          </p>
          <button type="button" onClick={() => retry()} style={{ minHeight: "3rem", padding: "0 1.5rem", borderRadius: "0.75rem", border: 0, background: "#1B2A4A", color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
