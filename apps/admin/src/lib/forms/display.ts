// Pure helpers for turning database rows into form values and list captions (unit-tested).
import type { Field, SectionSlug } from './types.ts';

type Row = Record<string, unknown>;

/** Database row -> the raw strings the form shows. New items use each field's default. */
export function toInitial(fields: Field[], row: Row | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = row ? row[f.name] : undefined;
    if (f.type === 'checkbox') {
      out[f.name] = (row ? Boolean(v) : f.defaultValue === true) ? 'on' : '';
    } else if (f.type === 'lines') {
      out[f.name] = Array.isArray(v) ? v.join('\n') : '';
    } else if (f.type === 'socials') {
      out[f.name] = JSON.stringify(Array.isArray(v) ? v : []);
    } else if (f.type === 'numbers') {
      out[f.name] = Array.isArray(v) ? v.join(', ') : '';
    } else if (f.type === 'pairs') {
      const k = f.pair!.keys;
      out[f.name] = JSON.stringify((Array.isArray(v) ? v : []).map((r) => ({ a: String((r as Row)[k[0]] ?? ''), b: String((r as Row)[k[1]] ?? '') })));
    } else if (v === null || v === undefined) {
      out[f.name] = row ? '' : f.defaultValue !== undefined ? String(f.defaultValue) : '';
    } else {
      out[f.name] = String(v);
    }
  }
  return out;
}

const clip = (s: unknown, n = 90) => {
  const t = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

/** One-line caption under each item's title in the list. */
export function captionFor(slug: SectionSlug, row: Row): string {
  switch (slug) {
    case 'stats': {
      const d = Number(row.decimals ?? 0);
      const num = Number(row.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
      return `${row.prefix ?? ''}${num}${row.suffix ?? ''}${row.show_in_hero ? '  ·  also in hero' : ''}`;
    }
    case 'services': {
      const n = Array.isArray(row.features) ? row.features.length : 0;
      return [clip(row.description), n ? `${n} bullet point${n === 1 ? '' : 's'}` : ''].filter(Boolean).join('  ·  ');
    }
    case 'process':
      return clip(row.description);
    case 'tools':
      return String(row.color ?? '');
    case 'about':
      return clip(row.value);
    case 'faq':
      return clip(row.answer);
    case 'case-studies':
      return [row.status === 'published' ? 'Published' : 'Draft', row.client_name, row.kpi_value && row.kpi_label ? `${row.kpi_value} ${row.kpi_label}` : '']
        .filter((x) => typeof x === 'string' && x.trim() !== '').join('  ·  ');
    case 'brands':
      return [row.logo_path ? 'Logo uploaded' : 'No logo (name shown as text)', typeof row.website_url === 'string' ? row.website_url : ''].filter(Boolean).join('  ·  ');
    case 'badges':
      return [row.issuer, row.issued_on].filter((x) => typeof x === 'string' && x).join('  ·  ');
    case 'testimonials':
      return [[row.author_role, row.company].filter((x) => typeof x === 'string' && x).join(', '), clip(row.quote, 60)].filter(Boolean).join('  ·  ');
  }
}
