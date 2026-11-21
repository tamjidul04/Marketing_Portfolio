// What each edit screen contains. Limits mirror the database constraints (supabase/migrations).
import type { Field, Section, SectionSlug } from './types.ts';

/** Icon keys the website understands (apps/web/src/components/icons.tsx). */
export const ICON_OPTIONS = [
  ['target', 'Target'], ['chart', 'Chart'], ['search', 'Search'], ['calendar', 'Calendar'], ['rocket', 'Rocket'],
  ['trending', 'Trending up'], ['megaphone', 'Megaphone'], ['mail', 'Email'], ['phone', 'Phone'], ['pin', 'Location pin'],
  ['graduation', 'Graduation cap'], ['clock', 'Clock'], ['users', 'People'], ['star', 'Star'], ['globe', 'Globe'],
  ['bolt', 'Lightning'], ['pen', 'Pen'], ['video', 'Video'], ['heart', 'Heart'], ['info', 'Info'],
].map(([value, label]) => ({ value, label }));

const iconField = (def: string): Field => ({ name: 'icon', label: 'Icon', type: 'select', required: true, options: ICON_OPTIONS, defaultValue: def, half: true });
const visibleField: Field = { name: 'is_visible', label: 'Show on the website', type: 'checkbox', defaultValue: true, help: 'Untick to hide it without deleting.' };

export const SECTIONS: Record<SectionSlug, Section> = {
  stats: {
    slug: 'stats', table: 'stats', title: 'Results', singular: 'result', titleField: 'label',
    blurb: 'The big numbers on your home page (for example "500+ leads generated").',
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true, max: 60, placeholder: 'Leads generated' },
      { name: 'value', label: 'Number', type: 'number', required: true, min: 0, max: 999999999999, step: 'any', half: true, placeholder: '12000' },
      { name: 'decimals', label: 'Decimal places', type: 'select', required: true, half: true, defaultValue: '0', options: [{ value: '0', label: '0  (12,000)' }, { value: '1', label: '1  (3.2)' }, { value: '2', label: '2  (3.25)' }] },
      { name: 'prefix', label: 'Before the number', type: 'text', max: 4, half: true, placeholder: '$', help: 'Optional, e.g. $ or ৳' },
      { name: 'suffix', label: 'After the number', type: 'text', max: 6, half: true, placeholder: '+', help: 'Optional, e.g. +, x or %' },
      { name: 'show_in_hero', label: 'Also show as a floating card next to your photo', type: 'checkbox', help: 'Only the first two ticked results appear there.' },
      visibleField,
    ],
  },
  services: {
    slug: 'services', table: 'services', title: 'Services', singular: 'service', titleField: 'title',
    blurb: 'The cards in the "How I can help" section.',
    fields: [
      { name: 'title', label: 'Service name', type: 'text', required: true, max: 80, placeholder: 'Paid Advertising' },
      { name: 'description', label: 'Short description', type: 'textarea', max: 400, rows: 3 },
      iconField('target'),
      { name: 'features', label: 'Bullet points', type: 'lines', maxItems: 8, itemMax: 80, rows: 5, help: 'One per line, up to 8.', placeholder: 'Campaign strategy\nAudience targeting' },
      visibleField,
    ],
  },
  process: {
    slug: 'process', table: 'process_steps', title: 'Process', singular: 'step', titleField: 'title',
    blurb: 'The "How I work" steps, shown in order.',
    fields: [
      { name: 'title', label: 'Step name', type: 'text', required: true, max: 60, placeholder: 'Audit' },
      { name: 'description', label: 'Description', type: 'textarea', max: 240, rows: 3 },
      visibleField,
    ],
  },
  tools: {
    slug: 'tools', table: 'tools', title: 'Tools', singular: 'tool', titleField: 'name',
    blurb: 'The platforms and tools you work with.',
    fields: [
      { name: 'name', label: 'Tool name', type: 'text', required: true, max: 60, placeholder: 'Google Analytics 4' },
      { name: 'color', label: 'Dot colour', type: 'color', required: true, defaultValue: '#1B2A4A', help: 'A small coloured dot shown next to the name.' },
      visibleField,
    ],
  },
  about: {
    slug: 'about', table: 'about_facts', title: 'About facts', singular: 'fact', titleField: 'label',
    blurb: 'The short facts in the navy card of the About section (education, location, specialty…).',
    fields: [
      { name: 'label', label: 'Heading', type: 'text', required: true, max: 40, placeholder: 'Education', half: true },
      iconField('info'),
      { name: 'value', label: 'Text', type: 'text', required: true, max: 160, placeholder: 'BSc, Dhaka College' },
      visibleField,
    ],
  },
  faq: {
    slug: 'faq', table: 'faqs', title: 'FAQ', singular: 'question', titleField: 'question',
    blurb: 'Questions clients often ask.',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 200 },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, max: 2000, rows: 5, help: 'Leave a blank line between paragraphs.' },
      visibleField,
    ],
  },

  'case-studies': {
    slug: 'case-studies', table: 'case_studies', title: 'Case studies', singular: 'case study', titleField: 'title',
    blurb: 'Your projects: a card on the home page and a full page of its own.',
    groups: [
      { title: 'Basics', blurb: 'Draft = only you can see it. Published = live on your website.', fields: ['title', 'slug', 'status', 'is_featured', 'client_name', 'industry', 'channels', 'duration_text'] },
      { title: 'Home page card', blurb: 'The coloured card visitors click. The small picture inside it is drawn from the numbers you enter.', fields: ['card_color', 'kpi_value', 'kpi_label', 'summary', 'visual_type', 'visual_title', 'visual_numbers', 'visual_rows', 'visual_footer_label', 'visual_footer_value', 'visual_headline', 'visual_text', 'metrics'] },
      { title: 'The full story', blurb: 'Shown on the case study page. Leave a blank line between paragraphs. Start a line with "- " for a bullet, "## " for a sub-heading, and wrap **words** in stars for bold.', fields: ['challenge', 'strategy', 'results'] },
      { title: 'Search & sharing', blurb: 'Optional. Leave empty to use the title and summary.', fields: ['seo_title', 'seo_description'] },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 120, placeholder: 'Scaling online sales for a clothing brand' },
      { name: 'slug', label: 'Web address', type: 'text', max: 120, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', patternMessage: 'Lower-case letters, numbers and single dashes only (for example my-project).', placeholder: 'created from the title if left empty', help: 'Changing this later breaks old links to the page.' },
      { name: 'status', label: 'Status', type: 'select', required: true, half: true, defaultValue: 'draft', options: [{ value: 'draft', label: 'Draft (hidden)' }, { value: 'published', label: 'Published (live)' }] },
      { name: 'is_featured', label: 'Show the card on the home page', type: 'checkbox', defaultValue: true, help: 'Untick to keep the page live but only reachable by its link.' },
      { name: 'client_name', label: 'Client', type: 'text', nullable: true, max: 80, half: true, placeholder: 'Fashion brand', help: 'Can be generic if the client wants privacy.' },
      { name: 'industry', label: 'Industry', type: 'text', nullable: true, max: 60, half: true, placeholder: 'E-commerce' },
      { name: 'channels', label: 'Channels / tags', type: 'lines', maxItems: 6, itemMax: 30, rows: 3, help: 'One per line, up to 6 (for example Meta Ads).' },
      { name: 'duration_text', label: 'Duration', type: 'text', nullable: true, max: 40, placeholder: '90 days' },

      { name: 'card_color', label: 'Card colour', type: 'color', required: true, defaultValue: '#1B2A4A', help: 'Text on the card adjusts itself to stay readable.' },
      { name: 'kpi_value', label: 'Headline result', type: 'text', nullable: true, max: 16, half: true, placeholder: '+240%' },
      { name: 'kpi_label', label: 'What it measures', type: 'text', nullable: true, max: 60, half: true, placeholder: 'revenue in 90 days' },
      { name: 'summary', label: 'Short summary', type: 'textarea', max: 300, rows: 3 },
      { name: 'visual_type', label: 'Picture inside the card', type: 'select', required: true, defaultValue: 'bars', options: [
        { value: 'bars', label: 'Bar chart (growth over time)' }, { value: 'line', label: 'Line chart (trend)' },
        { value: 'ranking', label: 'Search ranking list' }, { value: 'ad', label: 'Ad preview' }, { value: 'image', label: 'Cover image (upload arrives in step 3.4)' } ] },
      { name: 'visual_title', label: 'Chart title', type: 'text', nullable: true, max: 40, placeholder: 'Revenue · last 12 weeks', showIf: { field: 'visual_type', in: ['bars', 'line', 'ranking'] } },
      { name: 'visual_numbers', label: 'Chart numbers', type: 'numbers', min: 0, max: 100, minItems: 2, maxItems: 24, placeholder: '22, 28, 35, 52, 74, 100', help: 'Between 2 and 24 numbers from 0 to 100, separated by commas. Higher = taller / higher on the chart. Leave empty to show an example chart.', showIf: { field: 'visual_type', in: ['bars', 'line'] } },
      { name: 'visual_rows', label: 'Ranking rows', type: 'pairs', maxItems: 5, help: 'The first row is highlighted (your client). Up to 5 rows.', pair: { keys: ['label', 'rank'], labels: ['Business', 'Rank'], placeholders: ['Your client', '#1'], maxLen: [40, 10] }, showIf: { field: 'visual_type', in: ['ranking'] } },
      { name: 'visual_footer_label', label: 'Bottom line (label)', type: 'text', nullable: true, max: 40, half: true, placeholder: 'Monthly calls', showIf: { field: 'visual_type', in: ['ranking'] } },
      { name: 'visual_footer_value', label: 'Bottom line (value)', type: 'text', nullable: true, max: 20, half: true, placeholder: '+180%', showIf: { field: 'visual_type', in: ['ranking'] } },
      { name: 'visual_headline', label: 'Ad headline', type: 'text', nullable: true, max: 80, placeholder: 'Sponsored · Your brand', showIf: { field: 'visual_type', in: ['ad'] } },
      { name: 'visual_text', label: 'Ad text', type: 'text', nullable: true, max: 160, placeholder: 'Glow naturally this winter. Shop the new collection.', showIf: { field: 'visual_type', in: ['ad'] } },
      { name: 'metrics', label: 'Key numbers', type: 'pairs', maxItems: 4, help: 'Up to 4 small boxes under the picture (for example ROAS 4.1x). Also shown on the full page.', pair: { keys: ['label', 'value'], labels: ['Metric', 'Value'], placeholders: ['ROAS', '4.1x'], maxLen: [30, 20] } },

      { name: 'challenge', label: 'The challenge', type: 'textarea', max: 6000, rows: 8 },
      { name: 'strategy', label: 'The strategy', type: 'textarea', max: 8000, rows: 10 },
      { name: 'results', label: 'The results', type: 'textarea', max: 6000, rows: 8 },

      { name: 'seo_title', label: 'Search result title', type: 'text', nullable: true, max: 70 },
      { name: 'seo_description', label: 'Search result description', type: 'textarea', nullable: true, max: 170, rows: 3 },
    ],
  },
  testimonials: {
    slug: 'testimonials', table: 'testimonials', title: 'Testimonials', singular: 'testimonial', titleField: 'author_name',
    blurb: 'What clients say. They appear between your case studies on the home page.',
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, max: 800, rows: 4 },
      { name: 'author_name', label: 'Name', type: 'text', required: true, max: 80, half: true },
      { name: 'author_role', label: 'Role', type: 'text', nullable: true, max: 80, half: true, placeholder: 'Founder' },
      { name: 'company', label: 'Company', type: 'text', nullable: true, max: 80, half: true },
      { name: 'avatar_color', label: 'Initials circle colour', type: 'color', required: true, defaultValue: '#2F6F62', half: true, help: 'Used until photo uploads arrive (step 3.4).' },
      { name: 'rating', label: 'Star rating', type: 'select', nullable: true, asNumber: true, half: true, options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: '★'.repeat(n) + '  ' + n })), help: 'Optional.' },
      { name: 'case_study_id', label: 'Linked case study', type: 'select', nullable: true, half: true, options: [], help: 'Optional. The quote is also shown on that case study page.' },
      visibleField,
    ],
  },
};

export const isSection = (s: string): s is SectionSlug => Object.prototype.hasOwnProperty.call(SECTIONS, s);

export const PROFILE_FIELDS: Field[] = [
  { name: 'full_name', label: 'Full name', type: 'text', required: true, max: 80, half: true },
  { name: 'short_name', label: 'First name', type: 'text', required: true, max: 40, half: true, help: 'Used in "Hi, I\'m …".' },
  { name: 'initials', label: 'Initials', type: 'text', required: true, max: 3, half: true, help: 'Shown in the round logo mark.' },
  { name: 'role_title', label: 'Job title', type: 'text', max: 80, half: true, placeholder: 'Digital Marketing Specialist' },
  { name: 'headline', label: 'Headline', type: 'text', required: true, max: 80, placeholder: 'Turning Data Into Growth' },
  { name: 'headline_accent', label: 'Highlighted word(s)', type: 'text', nullable: true, max: 40, placeholder: 'Growth', help: 'These words from the headline are shown in colour.' },
  { name: 'hero_tags', label: 'Tags under the headline', type: 'lines', maxItems: 6, itemMax: 30, rows: 4, help: 'One per line, up to 6 (for example Ads, Analytics, Strategy).' },
  { name: 'hero_intro', label: 'Intro paragraph', type: 'textarea', max: 400, rows: 4 },
  { name: 'photo_alt', label: 'Photo description', type: 'text', nullable: true, max: 160, help: 'For screen readers and search engines. The photo upload arrives in step 3.4.' },
  { name: 'is_available', label: 'Show the "Available for new clients" badge', type: 'checkbox', defaultValue: true },
  { name: 'availability_text', label: 'Badge text', type: 'text', required: true, max: 60, placeholder: 'Available for new clients' },
  { name: 'trust_text', label: 'Line under the buttons', type: 'text', nullable: true, max: 80, placeholder: 'Trusted by growing brands' },
  { name: 'about_title', label: 'About section heading', type: 'text', required: true, max: 120 },
  { name: 'about_body', label: 'About text', type: 'textarea', max: 4000, rows: 8, help: 'Leave a blank line between paragraphs.' },
  { name: 'about_quote', label: 'Highlighted quote', type: 'textarea', nullable: true, max: 300, rows: 2 },
  { name: 'location', label: 'Location', type: 'text', nullable: true, max: 120, placeholder: 'Dhaka, Bangladesh' },
];

export const SETTINGS_FIELDS: Field[] = [
  { name: 'contact_email', label: 'Contact email', type: 'email', nullable: true, half: true },
  { name: 'phone', label: 'Phone', type: 'phone', nullable: true, half: true, placeholder: '+880 1700 000000' },
  { name: 'whatsapp', label: 'WhatsApp number', type: 'text', nullable: true, half: true, pattern: '^[0-9]{6,15}$', patternMessage: 'Digits only, with the country code and no + or spaces (for example 8801700000000).', help: 'Digits only, including country code.' },
  { name: 'response_time_text', label: 'Reply promise', type: 'text', required: true, max: 80, half: true, placeholder: 'I reply within 24 hours' },
  { name: 'socials', label: 'Social links', type: 'socials', maxItems: 12, help: 'Shown as icons in the footer. Known names: facebook, instagram, linkedin, x, youtube, tiktok, github.' },
  { name: 'budget_options', label: 'Budget choices in the contact form', type: 'lines', required: true, maxItems: 10, itemMax: 60, rows: 5, help: 'One per line.' },
  { name: 'seo_title', label: 'Search result title', type: 'text', nullable: true, max: 70, help: 'About 60 characters works best.' },
  { name: 'seo_description', label: 'Search result description', type: 'textarea', nullable: true, max: 170, rows: 3, help: 'About 150 characters works best.' },
  { name: 'meta_pixel_id', label: 'Meta Pixel ID', type: 'text', nullable: true, half: true, pattern: '^[0-9]{8,20}$', patternMessage: 'The Pixel ID is 8–20 digits.', help: 'Leave empty to switch Meta tracking off.' },
  { name: 'ga4_id', label: 'Google Analytics 4 ID', type: 'text', nullable: true, half: true, pattern: '^G-[A-Z0-9]{4,15}$', patternMessage: 'It looks like G-XXXXXXXXXX (capital letters and digits).', placeholder: 'G-XXXXXXXXXX', help: 'Leave empty to switch Google tracking off.' },
  { name: 'color_primary', label: 'Dark colour', type: 'color', required: true, half: true, help: 'Dark sections and headings.' },
  { name: 'color_accent', label: 'Main accent colour', type: 'color', required: true, half: true, help: 'Buttons, labels, charts.' },
  { name: 'color_highlight', label: 'Highlight colour', type: 'color', required: true, half: true, help: 'Big numbers, stars, underline.' },
  { name: 'show_results', label: 'Show the Results numbers', type: 'checkbox', defaultValue: true },
  { name: 'show_brands', label: 'Show brand logos and badges', type: 'checkbox', defaultValue: true },
  { name: 'show_process', label: 'Show the Process steps', type: 'checkbox', defaultValue: true },
  { name: 'show_tools', label: 'Show Tools', type: 'checkbox', defaultValue: true },
  { name: 'show_faq', label: 'Show the FAQ', type: 'checkbox', defaultValue: true },
  { name: 'footer_text', label: 'Extra footer text', type: 'text', nullable: true, max: 200 },
];

/** Groups of settings fields, in display order. */
export const SETTINGS_GROUPS: { title: string; blurb: string; fields: string[] }[] = [
  { title: 'Contact', blurb: 'How visitors reach you. The WhatsApp number powers the floating chat button.', fields: ['contact_email', 'phone', 'whatsapp', 'response_time_text', 'socials', 'budget_options'] },
  { title: 'Search & sharing', blurb: 'How your site appears on Google and when shared.', fields: ['seo_title', 'seo_description'] },
  { title: 'Tracking', blurb: 'Optional. Nothing is loaded until you add an ID.', fields: ['meta_pixel_id', 'ga4_id'] },
  { title: 'Colours', blurb: 'The whole website and this admin follow these colours.', fields: ['color_primary', 'color_accent', 'color_highlight'] },
  { title: 'Sections', blurb: 'Switch whole sections of the home page on or off.', fields: ['show_results', 'show_brands', 'show_process', 'show_tools', 'show_faq'] },
  { title: 'Footer', blurb: '', fields: ['footer_text'] },
];

export const PROFILE_GROUPS: { title: string; blurb: string; fields: string[] }[] = [
  { title: 'Hero', blurb: 'The first thing visitors see.', fields: ['full_name', 'short_name', 'initials', 'role_title', 'headline', 'headline_accent', 'hero_tags', 'hero_intro', 'photo_alt', 'is_available', 'availability_text', 'trust_text'] },
  { title: 'About', blurb: 'The About section lower on the page.', fields: ['about_title', 'about_body', 'about_quote', 'location'] },
];
