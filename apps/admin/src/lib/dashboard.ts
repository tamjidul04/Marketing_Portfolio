import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { buildChecklist, progress } from '@/lib/checklist';

type CountRes = { count: number | null; error: { message: string } | null };
const n = (res: CountRes, what: string): number => {
  if (res.error) throw new Error(`Could not load ${what}: ${res.error.message}`);
  return res.count ?? 0;
};

/**
 * Everything the dashboard shows, in one parallel round trip. Runs as the signed-in admin,
 * so database security rules apply (admins can see drafts and the inbox; nobody else can).
 */
export async function loadDashboard() {
  const db = await createClient();
  const head = { count: 'exact' as const, head: true };

  const [newMsgs, allMsgs, published, drafts, testimonials, services, faqs, stats, latest, profile, settings, publishedSlugs] = await Promise.all([
    db.from('contact_messages').select('id', head).eq('status', 'new'),
    db.from('contact_messages').select('id', head),
    db.from('case_studies').select('id', head).eq('status', 'published'),
    db.from('case_studies').select('id', head).eq('status', 'draft'),
    db.from('testimonials').select('id', head),
    db.from('services').select('id', head),
    db.from('faqs').select('id', head),
    db.from('stats').select('id', head),
    db.from('contact_messages').select('id, name, email, phone, service, status, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('profile').select('full_name, photo_path').eq('id', 1).single(),
    db.from('site_settings').select('contact_email, whatsapp, seo_description, meta_pixel_id, ga4_id').eq('id', 1).single(),
    db.from('case_studies').select('slug').eq('status', 'published'),
  ]);

  for (const [res, what] of [[latest, 'messages'], [profile, 'profile'], [settings, 'settings'], [publishedSlugs, 'case studies']] as const) {
    if (res.error) throw new Error(`Could not load ${what}: ${res.error.message}`);
  }

  const items = buildChecklist({
    fullName: profile.data!.full_name,
    photoPath: profile.data!.photo_path,
    contactEmail: settings.data!.contact_email,
    whatsapp: settings.data!.whatsapp,
    seoDescription: settings.data!.seo_description,
    publishedSlugs: (publishedSlugs.data ?? []).map((r) => r.slug),
    pixelId: settings.data!.meta_pixel_id,
    ga4Id: settings.data!.ga4_id,
  });

  return {
    ownerName: profile.data!.full_name,
    counts: {
      newMessages: n(newMsgs, 'new messages'),
      messages: n(allMsgs, 'messages'),
      published: n(published, 'published case studies'),
      drafts: n(drafts, 'draft case studies'),
      testimonials: n(testimonials, 'testimonials'),
      services: n(services, 'services'),
      faqs: n(faqs, 'FAQs'),
      stats: n(stats, 'results'),
    },
    latestMessages: latest.data ?? [],
    checklist: items,
    progress: progress(items),
  };
}
