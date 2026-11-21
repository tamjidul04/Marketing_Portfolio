import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="section" style={{ flex: 1, display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="wrap">
        <span className="eyebrow">404</span>
        <h1 className="h2">This page doesn&apos;t exist</h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          The link may be old, or the project may have been unpublished.
        </p>
        <Link href="/" className="btn btn-accent" style={{ marginTop: "1.5rem" }}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
