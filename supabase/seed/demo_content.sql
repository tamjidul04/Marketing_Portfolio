-- =====================================================================
--  DEMO CONTENT — generic placeholders only (no real person's data).
--  Lets the website show something while it's built. Safe to re-run:
--  fixed ids + on conflict do nothing. Replace via the admin panel later.
-- =====================================================================

update public.profile set
  full_name = 'Your Name',
  short_name = 'You',
  initials = 'YN',
  headline = 'Turning Data Into Growth',
  headline_accent = 'Growth',
  hero_intro = 'Sample introduction. Replace this with your own story in the admin panel.',
  about_body = 'Sample about text. Describe your experience, approach and what clients can expect.',
  about_quote = 'Sample quote: marketing is about data, not guesswork.'
where id = 1;

update public.site_settings set
  contact_email = 'you@example.com',
  phone = '+1 555 000 0000',
  whatsapp = '15550000000',
  seo_title = 'Your Name — Digital Marketing Specialist',
  seo_description = 'Sample description for search engines.'
where id = 1;

insert into public.stats (id, label, value, prefix, suffix, decimals, show_in_hero, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Ad spend managed', 500, '$', 'K+', 0, false, 1),
  ('10000000-0000-0000-0000-000000000002', 'Average ROAS', 3.2, '', 'x', 1, true, 2),
  ('10000000-0000-0000-0000-000000000003', 'Leads generated', 12000, '', '+', 0, false, 3),
  ('10000000-0000-0000-0000-000000000004', 'Clients served', 25, '', '+', 0, true, 4)
on conflict (id) do nothing;

insert into public.brands (id, name, sort_order) values
  ('20000000-0000-0000-0000-000000000001', 'Sample Brand A', 1),
  ('20000000-0000-0000-0000-000000000002', 'Sample Brand B', 2),
  ('20000000-0000-0000-0000-000000000003', 'Sample Brand C', 3),
  ('20000000-0000-0000-0000-000000000004', 'Sample Brand D', 4)
on conflict (id) do nothing;

insert into public.services (id, title, description, icon, features, sort_order) values
  ('30000000-0000-0000-0000-000000000001', 'Paid Advertising', 'Sample: campaign strategy and management across major ad platforms.', 'target', array['Campaign strategy','Ad creative','Audience targeting','Optimization'], 1),
  ('30000000-0000-0000-0000-000000000002', 'Analytics & Reporting', 'Sample: custom dashboards and clear reports.', 'chart', array['Dashboards','Tracking','Conversion analysis'], 2),
  ('30000000-0000-0000-0000-000000000003', 'SEO', 'Sample: search visibility and organic growth.', 'search', array['Keyword research','On-page SEO','Technical SEO'], 3),
  ('30000000-0000-0000-0000-000000000004', 'Content Strategy', 'Sample: content planning aligned with goals.', 'calendar', array['Content calendar','Messaging','Engagement'], 4),
  ('30000000-0000-0000-0000-000000000005', 'Campaign Building', 'Sample: end-to-end campaign from strategy to launch.', 'rocket', array['Strategy','Creative','Launch','Optimization'], 5)
on conflict (id) do nothing;

insert into public.process_steps (id, title, description, sort_order) values
  ('40000000-0000-0000-0000-000000000001', 'Audit', 'Sample: review what is working and what is not.', 1),
  ('40000000-0000-0000-0000-000000000002', 'Strategy', 'Sample: a clear plan with targets and budget.', 2),
  ('40000000-0000-0000-0000-000000000003', 'Launch', 'Sample: campaigns and tracking go live.', 3),
  ('40000000-0000-0000-0000-000000000004', 'Optimize', 'Sample: test and shift budget to what converts.', 4),
  ('40000000-0000-0000-0000-000000000005', 'Report', 'Sample: plain-language results every week.', 5)
on conflict (id) do nothing;

insert into public.tools (id, name, color, sort_order) values
  ('50000000-0000-0000-0000-000000000001', 'Meta Ads', '#1877F2', 1),
  ('50000000-0000-0000-0000-000000000002', 'Google Ads', '#34A853', 2),
  ('50000000-0000-0000-0000-000000000003', 'Google Analytics 4', '#E37400', 3),
  ('50000000-0000-0000-0000-000000000004', 'Looker Studio', '#669DF6', 4)
on conflict (id) do nothing;

insert into public.faqs (id, question, answer, sort_order) values
  ('60000000-0000-0000-0000-000000000001', 'Sample: what budget do I need to start?', 'Sample answer. Budgets depend on goals and industry.', 1),
  ('60000000-0000-0000-0000-000000000002', 'Sample: how soon will I see results?', 'Sample answer. Early data usually appears within a couple of weeks.', 2),
  ('60000000-0000-0000-0000-000000000003', 'Sample: do you work remotely?', 'Sample answer. Yes, with clients anywhere.', 3)
on conflict (id) do nothing;

insert into public.case_studies (id, slug, status, title, client_name, industry, channels, card_color, kpi_value, kpi_label, summary, visual_type, metrics, challenge, strategy, results, sort_order) values
  ('70000000-0000-0000-0000-000000000001', 'demo-ecommerce', 'published', 'Sample: scaling online sales', 'Sample e-commerce brand', 'E-commerce', array['Meta Ads','Retargeting'], '#E0A526', '+150%', 'revenue in 90 days', 'Sample summary of the project and the approach.', 'bars', '[{"label":"ROAS","value":"4.1x"},{"label":"CPC","value":"$0.38"}]', 'Sample challenge.', 'Sample strategy.', 'Sample results.', 1),
  ('70000000-0000-0000-0000-000000000002', 'demo-leads', 'published', 'Sample: lowering cost per lead', 'Sample education brand', 'Education', array['Lead Ads','CRM'], '#1B2A4A', '-40%', 'cost per lead', 'Sample summary of a lead generation project.', 'line', '[{"label":"Leads","value":"3,200"},{"label":"CPL","value":"$6"}]', 'Sample challenge.', 'Sample strategy.', 'Sample results.', 2),
  ('70000000-0000-0000-0000-000000000003', 'demo-local-seo', 'published', 'Sample: local search growth', 'Sample local business', 'Local services', array['Local SEO','Google Ads'], '#2F6F62', '#1', 'on Google for key searches', 'Sample summary of a local search project.', 'ranking', '[{"label":"Calls","value":"+180%"}]', 'Sample challenge.', 'Sample strategy.', 'Sample results.', 3)
on conflict (id) do nothing;

insert into public.testimonials (id, quote, author_name, author_role, company, avatar_color, sort_order) values
  ('80000000-0000-0000-0000-000000000001', 'Sample testimonial: clear reports and real results.', 'Sample Client A', 'Founder', 'Sample Company', '#2F6F62', 1),
  ('80000000-0000-0000-0000-000000000002', 'Sample testimonial: quick replies and a clear plan.', 'Sample Client B', 'Owner', 'Sample Store', '#5B5BD6', 2)
on conflict (id) do nothing;

insert into public.about_facts (id, label, value, icon, sort_order) values
  ('90000000-0000-0000-0000-000000000001', 'Specialization', 'Sample: ads strategy, analytics and growth marketing', 'trending', 1),
  ('90000000-0000-0000-0000-000000000002', 'Education', 'Sample: your degree and school', 'graduation', 2),
  ('90000000-0000-0000-0000-000000000003', 'Based in', 'Sample City · Working worldwide', 'pin', 3)
on conflict (id) do nothing;

update public.profile set hero_tags = array['Ads','Analytics','Strategy'], trust_text = 'Trusted by growing brands' where id = 1;
update public.site_settings set socials = '[{"platform":"linkedin","url":"https://www.linkedin.com/"},{"platform":"instagram","url":"https://www.instagram.com/"}]'::jsonb where id = 1;
