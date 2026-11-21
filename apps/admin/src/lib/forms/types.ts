// Plain-data descriptions of forms. No functions and no framework imports, so the same objects can be
// used by the server (validation, saving) and the browser (drawing the form).

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'lines' | 'checkbox' | 'color' | 'email' | 'phone' | 'socials' | 'numbers' | 'pairs' | 'image' | 'date' | 'url';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Empty value is stored as NULL (for columns that allow it) instead of an empty string. */
  nullable?: boolean;
  max?: number;
  min?: number;
  integer?: boolean;
  /** lines: maximum number of lines, and maximum length of each line. */
  maxItems?: number;
  itemMax?: number;
  /** Regular expression source the value must match, with the message to show otherwise. */
  pattern?: string;
  patternMessage?: string;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
  step?: string;
  rows?: number;
  /** select: store the chosen value as a number instead of text. */
  asNumber?: boolean;
  /** Only shown (and validated and saved) when another field has one of these values. */
  showIf?: { field: string; in: string[] };
  /** numbers: how many numbers, and the allowed range (min/max above). */
  minItems?: number;
  /** pairs: the two columns. keys = property names in the saved objects; maxLen = max length of each side. */
  pair?: { keys: [string, string]; labels: [string, string]; placeholders?: [string, string]; maxLen: [number, number] };
  /** image: storage folder the file must live in, longest side after resizing, and a size hint for the user. */
  folder?: 'profile' | 'og' | 'brands' | 'badges' | 'cases' | 'gallery' | 'people';
  maxDim?: number;
  sizeHint?: string;
  /** Lay out two of these side by side on wide screens. */
  half?: boolean;
  defaultValue?: string | number | boolean;
};

export type SectionSlug = 'stats' | 'services' | 'process' | 'tools' | 'about' | 'faq' | 'case-studies' | 'testimonials' | 'brands' | 'badges';
export type SectionTable = 'stats' | 'services' | 'process_steps' | 'tools' | 'about_facts' | 'faqs' | 'case_studies' | 'testimonials' | 'brands' | 'certifications';

export type Section = {
  slug: SectionSlug;
  table: SectionTable;
  title: string;
  singular: string;
  blurb: string;
  titleField: string;
  fields: Field[];
  /** Optional grouping of the fields into cards, by field name. */
  groups?: { title: string; blurb: string; fields: string[] }[];
};

export type Social = { platform: string; url: string };
export type CleanValue = string | number | boolean | string[] | number[] | Social[] | Record<string, string>[] | null;
export type CleanData = Record<string, CleanValue>;

/** What a form action returns to the browser. `values` echoes the raw input so nothing the user typed is lost. */
export type FormState =
  | {
      ok?: boolean;
      error?: string;
      errors?: Record<string, string>;
      values?: Record<string, string>;
      savedAt?: number;
    }
  | undefined;
