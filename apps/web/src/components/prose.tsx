import type { ReactNode } from "react";

/**
 * Tiny, safe text renderer for admin-written content. Supports:
 *   blank line      → new paragraph
 *   "## Heading"    → sub-heading
 *   "- item" lines  → bullet list
 *   **bold**        → bold
 * Everything is rendered as React text (escaped) — never as raw HTML.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 1 && lines[0].startsWith("## ")) return <h3 key={i}>{lines[0].slice(3)}</h3>;
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
