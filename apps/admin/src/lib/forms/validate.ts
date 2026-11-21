// Pure validation engine (no framework imports, so it can be unit-tested).
// It mirrors the database constraints. The database enforces them again — this just gives friendly errors first.
import type { CleanData, Field, Social } from './types.ts';

export type Source = { get(name: string): string | null; getAll(name: string): string[] };

/** Adapts a browser/server FormData (which can also hold files) to the plain-text Source the engine reads. */
export function formSource(fd: { get(name: string): unknown; getAll(name: string): unknown[] }): Source {
  return {
    get: (n) => {
      const v = fd.get(n);
      return typeof v === 'string' ? v : null;
    },
    getAll: (n) => fd.getAll(n).filter((v): v is string => typeof v === 'string'),
  };
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;
const URL_RE = /^https?:\/\/\S+$/i;
const PLATFORM_RE = /^[a-z0-9][a-z0-9 ._-]{0,29}$/i;

const clean = (s: string | null | undefined) => (s ?? '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();

/** Raw (unparsed) text for every field. Used to put back exactly what the user typed after an error. */
export function readValues(fields: Field[], src: Source): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === 'socials') {
      const platforms = src.getAll('socials_platform');
      const urls = src.getAll('socials_url');
      out[f.name] = JSON.stringify(platforms.map((p, i) => ({ platform: p, url: urls[i] ?? '' })));
    } else if (f.type === 'checkbox') {
      out[f.name] = src.get(f.name) === 'on' ? 'on' : '';
    } else {
      out[f.name] = (src.get(f.name) ?? '').replace(/\u0000/g, '');
    }
  }
  return out;
}

export function validateFields(fields: Field[], src: Source): { ok: true; data: CleanData } | { ok: false; errors: Record<string, string> } {
  const data: CleanData = {};
  const errors: Record<string, string> = {};
  const fail = (f: Field, msg: string) => {
    errors[f.name] = msg;
  };

  for (const f of fields) {
    switch (f.type) {
      case 'checkbox': {
        data[f.name] = src.get(f.name) === 'on';
        break;
      }

      case 'socials': {
        const platforms = src.getAll('socials_platform');
        const urls = src.getAll('socials_url');
        const rows: Social[] = [];
        let bad = '';
        platforms.forEach((p, i) => {
          const platform = clean(p).toLowerCase();
          const url = clean(urls[i]);
          if (!platform && !url) return; // an empty row is simply ignored
          if (!platform || !url) bad = 'Each social link needs both a name and a web address.';
          else if (!PLATFORM_RE.test(platform)) bad = 'Social names can use letters, numbers, spaces, dots, dashes and underscores (30 max).';
          else if (!URL_RE.test(url) || url.length > 2048) bad = 'Web addresses must start with http:// or https://';
          else rows.push({ platform, url });
        });
        if (bad) fail(f, bad);
        else if (rows.length > (f.maxItems ?? 12)) fail(f, `At most ${f.maxItems ?? 12} links.`);
        else data[f.name] = rows;
        break;
      }

      case 'lines': {
        const lines = clean(src.get(f.name))
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const itemMax = f.itemMax ?? 80;
        if (f.required && lines.length === 0) fail(f, 'This is required.');
        else if (f.maxItems !== undefined && lines.length > f.maxItems) fail(f, `At most ${f.maxItems} lines.`);
        else if (lines.some((l) => l.length > itemMax)) fail(f, `Each line can be at most ${itemMax} characters.`);
        else data[f.name] = lines;
        break;
      }

      case 'number': {
        const raw = clean(src.get(f.name)).replace(/,/g, '');
        if (raw === '') {
          if (f.required) fail(f, 'This is required.');
          else data[f.name] = f.nullable ? null : 0;
          break;
        }
        const num = Number(raw);
        if (!Number.isFinite(num)) fail(f, 'Enter a number.');
        else if (f.integer && !Number.isInteger(num)) fail(f, 'Enter a whole number.');
        else if (f.min !== undefined && num < f.min) fail(f, `Must be at least ${f.min}.`);
        else if (f.max !== undefined && num > f.max) fail(f, `Must be at most ${f.max}.`);
        else data[f.name] = num;
        break;
      }

      case 'select': {
        const v = clean(src.get(f.name));
        if (!v) {
          if (f.required) fail(f, 'Choose one.');
          else data[f.name] = f.nullable ? null : '';
        } else if (!(f.options ?? []).some((o) => o.value === v)) fail(f, 'Choose one of the options.');
        else data[f.name] = v;
        break;
      }

      default: {
        // text, textarea, email, phone, color
        const v = clean(src.get(f.name));
        if (!v) {
          if (f.required) fail(f, 'This is required.');
          else data[f.name] = f.nullable ? null : '';
          break;
        }
        if (f.max !== undefined && v.length > f.max) fail(f, `Please keep this under ${f.max} characters (it is ${v.length}).`);
        else if (f.min !== undefined && v.length < f.min) fail(f, `Please enter at least ${f.min} characters.`);
        else if (f.type === 'email' && (!EMAIL_RE.test(v) || v.length > 254)) fail(f, 'Enter a valid email address.');
        else if (f.type === 'phone' && !PHONE_RE.test(v)) fail(f, 'Use 6–20 digits; spaces, brackets, dashes and a leading + are fine.');
        else if (f.type === 'color' && !HEX_RE.test(v)) fail(f, 'Choose a colour.');
        else if (f.pattern && !new RegExp(f.pattern).test(v)) fail(f, f.patternMessage ?? 'That format is not valid.');
        else data[f.name] = f.type === 'color' ? v.toUpperCase() : v;
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Move one item up or down in a list; returns the new order of ids (unchanged at the ends). */
export function reorder(ids: string[], id: string, dir: 'up' | 'down'): string[] {
  const i = ids.indexOf(id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return ids.slice();
  const out = ids.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
