-- TEST: singletons exist
do $$ begin
  if (select count(*) from public.profile) <> 1 then raise exception 'profile missing'; end if;
  if (select count(*) from public.site_settings) <> 1 then raise exception 'settings missing'; end if;
end $$;

-- TEST: second profile row is rejected  EXPECT FAIL
insert into public.profile (id) values (2);

-- TEST: valid socials accepted
update public.site_settings set socials = '[{"platform":"facebook","url":"https://facebook.com/x"}]';

-- TEST: socials without url rejected  EXPECT FAIL
update public.site_settings set socials = '[{"platform":"facebook"}]';

-- TEST: socials not an array rejected  EXPECT FAIL
update public.site_settings set socials = '{"platform":"x","url":"y"}';

-- TEST: bad hex colour rejected  EXPECT FAIL
update public.site_settings set color_accent = 'gold';

-- TEST: bad GA4 id rejected  EXPECT FAIL
update public.site_settings set ga4_id = 'UA-12345';

-- TEST: whatsapp with + rejected (digits only)  EXPECT FAIL
update public.site_settings set whatsapp = '+8801700000000';

-- TEST: valid whatsapp accepted
update public.site_settings set whatsapp = '8801700000000';

-- TEST: publishing a case study auto-sets published_at
do $$ declare d timestamptz; begin
  insert into public.case_studies (slug, title, status) values ('demo-case', 'Demo', 'published') returning published_at into d;
  if d is null then raise exception 'published_at not set'; end if;
end $$;

-- TEST: bad slug rejected  EXPECT FAIL
insert into public.case_studies (slug, title) values ('Bad Slug!', 'x');

-- TEST: duplicate slug rejected (case-insensitive)  EXPECT FAIL
insert into public.case_studies (slug, title) values ('same', 'a');
insert into public.case_studies (slug, title) values ('SAME', 'b');

-- TEST: more than 4 metrics rejected  EXPECT FAIL
insert into public.case_studies (slug, title, metrics) values ('m', 'm', '[{},{},{},{},{}]');

-- TEST: deleting a case study removes its images, keeps testimonial
do $$ declare c uuid; t uuid; begin
  insert into public.case_studies (slug, title) values ('del-me', 'x') returning id into c;
  insert into public.case_study_images (case_study_id, image_path) values (c, 'a.webp');
  insert into public.testimonials (quote, author_name, case_study_id) values ('great', 'A', c) returning id into t;
  delete from public.case_studies where id = c;
  if exists (select 1 from public.case_study_images where case_study_id = c) then raise exception 'images not cascaded'; end if;
  if (select case_study_id from public.testimonials where id = t) is not null then raise exception 'testimonial link not cleared'; end if;
end $$;

-- TEST: message needs phone or email  EXPECT FAIL
insert into public.contact_messages (name, message) values ('Someone', 'hi');

-- TEST: message with only phone accepted
insert into public.contact_messages (name, phone) values ('Someone', '+880 1700 000000');

-- TEST: blank name rejected  EXPECT FAIL
insert into public.contact_messages (name, email) values ('   ', 'a@b.co');

-- TEST: bad email rejected  EXPECT FAIL
insert into public.contact_messages (name, email) values ('A', 'not-an-email');

-- TEST: updated_at changes on update
do $$ declare b timestamptz; begin
  insert into public.faqs (question, answer, updated_at) values ('q', 'a', '2000-01-01');
  update public.faqs set answer = 'b';
  select updated_at into b from public.faqs limit 1;
  if b < '2020-01-01' then raise exception 'updated_at not bumped'; end if;
end $$;

-- TEST: stat with 3 decimals rejected  EXPECT FAIL
insert into public.stats (label, value, decimals) values ('x', 1, 3);

-- TEST: non-http website url rejected  EXPECT FAIL
insert into public.brands (name, website_url) values ('x', 'javascript:alert(1)');

-- TEST: highlight colour defaults to emerald
do $$ begin
  if (select color_highlight from public.site_settings) <> '#10B981' then raise exception 'wrong default'; end if;
end $$;

-- TEST: bad highlight colour rejected  EXPECT FAIL
update public.site_settings set color_highlight = 'gold';

-- TEST: valid highlight colour accepted
update public.site_settings set color_highlight = '#F5B700';

-- TEST: socials with a javascript: link rejected  EXPECT FAIL
update public.site_settings set socials = '[{"platform":"facebook","url":"javascript:alert(1)"}]';

-- TEST: socials with a non-web link rejected  EXPECT FAIL
update public.site_settings set socials = '[{"platform":"facebook","url":"data:text/html,hi"}]';

-- TEST: socials with spaces in the link rejected  EXPECT FAIL
update public.site_settings set socials = '[{"platform":"facebook","url":"https://a.com/x y"}]';

-- TEST: several valid socials (http and https) accepted
update public.site_settings set socials = '[{"platform":"facebook","url":"https://facebook.com/x"},{"platform":"site","url":"HTTP://example.com/a?b=1"}]';
