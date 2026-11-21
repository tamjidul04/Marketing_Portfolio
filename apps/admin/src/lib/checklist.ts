// Pure logic (no framework imports) so it can be unit-tested.
// Decides which "getting started" items are still open, by spotting leftover template sample content.

export type ChecklistInput = {
  fullName: string;
  photoPath: string | null;
  contactEmail: string | null;
  whatsapp: string | null;
  seoDescription: string | null;
  publishedSlugs: string[];
  pixelId: string | null;
  ga4Id: string | null;
};
export type ChecklistItem = { id: string; label: string; hint: string; done: boolean; optional?: boolean };

const SAMPLE_NAME = 'Your Name';
const SAMPLE_EMAIL = 'you@example.com';
const SAMPLE_WHATSAPP = '15550000000';

export function buildChecklist(i: ChecklistInput): ChecklistItem[] {
  const has = (v: string | null) => typeof v === 'string' && v.trim() !== '';
  return [
    { id: 'name', label: 'Add your name and headline', hint: 'Profile & hero', done: has(i.fullName) && i.fullName.trim() !== SAMPLE_NAME },
    { id: 'photo', label: 'Upload your photo', hint: 'Profile & hero', done: has(i.photoPath) },
    {
      id: 'contact',
      label: 'Set your real contact details',
      hint: 'Site settings: email and WhatsApp',
      done: has(i.contactEmail) && i.contactEmail !== SAMPLE_EMAIL && has(i.whatsapp) && i.whatsapp !== SAMPLE_WHATSAPP,
    },
    {
      id: 'seo',
      label: 'Write your search description',
      hint: 'Site settings: SEO',
      done: has(i.seoDescription) && !/^sample/i.test(i.seoDescription!.trim()),
    },
    {
      id: 'case',
      label: 'Publish a real case study',
      hint: 'Case studies',
      done: i.publishedSlugs.some((s) => !s.startsWith('demo-')),
    },
    { id: 'analytics', label: 'Connect Meta Pixel or Google Analytics', hint: 'Site settings: tracking', done: has(i.pixelId) || has(i.ga4Id), optional: true },
  ];
}

export function progress(items: ChecklistItem[]): { done: number; total: number } {
  const required = items.filter((i) => !i.optional);
  return { done: required.filter((i) => i.done).length, total: required.length };
}
