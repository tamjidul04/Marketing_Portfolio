// Pure helpers for case studies (no framework imports, unit-tested).
// The form shows friendly fields (numbers box, ranking rows...). The database stores them in one JSON column
// (case_studies.visual_data) in the shape the website's card drawing code reads (apps/web .../work.tsx).
import type { CleanData } from './types.ts';

type Row = Record<string, unknown>;
type Pair = Record<string, string>;

/** Form fields that only exist to build visual_data. They are not database columns. */
export const VISUAL_FIELDS = ['visual_title', 'visual_numbers', 'visual_rows', 'visual_footer_label', 'visual_footer_value', 'visual_headline', 'visual_text'] as const;

/** "Fashion E-commerce: +240% ROAS!" -> "fashion-e-commerce-240-roas" (letters/numbers and single dashes, max 120). */
export function slugify(input: string): string {
  const ascii = [...input.normalize('NFKD')].filter((c) => c.charCodeAt(0) < 128).join('');
  const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120).replace(/-+$/g, '');
  return slug || 'case-study';
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Form fields -> the JSON stored in visual_data (only what the chosen card style uses). */
export function buildVisualData(type: string, d: CleanData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, v: unknown) => {
    if (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null) out[key] = typeof v === 'string' ? v.trim() : v;
  };
  if (type === 'bars') {
    put('title', d.visual_title);
    put('values', Array.isArray(d.visual_numbers) && d.visual_numbers.length ? d.visual_numbers : undefined);
  } else if (type === 'line') {
    put('title', d.visual_title);
    put('points', Array.isArray(d.visual_numbers) && d.visual_numbers.length ? d.visual_numbers : undefined);
  } else if (type === 'ranking') {
    put('title', d.visual_title);
    put('rows', Array.isArray(d.visual_rows) && d.visual_rows.length ? d.visual_rows : undefined);
    put('footer_label', d.visual_footer_label);
    put('footer_value', d.visual_footer_value);
  } else if (type === 'ad') {
    put('headline', d.visual_headline);
    put('text', d.visual_text);
  }
  return out;
}

/** The reverse: stored visual_data -> the form's friendly fields (used when editing). */
export function parseVisualData(type: string, vd: unknown): Row {
  const d = vd && typeof vd === 'object' && !Array.isArray(vd) ? (vd as Row) : {};
  const nums = (v: unknown) => (Array.isArray(v) ? v.filter((n) => typeof n === 'number') : []);
  if (type === 'bars') return { visual_title: str(d.title), visual_numbers: nums(d.values) };
  if (type === 'line') return { visual_title: str(d.title), visual_numbers: nums(d.points) };
  if (type === 'ranking') {
    const rows = Array.isArray(d.rows) ? d.rows.filter((r): r is Pair => !!r && typeof r === 'object' && typeof (r as Pair).label === 'string') : [];
    return {
      visual_title: str(d.title),
      visual_rows: rows.map((r) => ({ label: r.label, rank: String(r.rank ?? '') })),
      visual_footer_label: str(d.footer_label),
      visual_footer_value: str(d.footer_value),
    };
  }
  if (type === 'ad') return { visual_headline: str(d.headline), visual_text: str(d.text) };
  return {};
}

/**
 * Validated form data -> a database row. Removes the helper fields, builds visual_data,
 * and creates the web address from the title when it was left empty.
 */
export function toDbCase(data: CleanData): CleanData {
  const row: CleanData = {};
  for (const [k, v] of Object.entries(data)) if (!(VISUAL_FIELDS as readonly string[]).includes(k)) row[k] = v;
  row.visual_data = buildVisualData(String(data.visual_type ?? ''), data) as never;
  const slug = typeof data.slug === 'string' ? data.slug.trim() : '';
  row.slug = slug || slugify(String(data.title ?? ''));
  return row;
}

/** A database row -> the same row plus the helper fields, ready for the form. */
export function fromDbCase(row: Row): Row {
  return { ...row, ...parseVisualData(String(row.visual_type ?? ''), row.visual_data) };
}
