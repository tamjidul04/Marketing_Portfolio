-- Security tests. Each block: set up data as superuser, then act as a role.
--   visitor  : set local role anon
--   user     : set local role authenticated + jwt sub = non-admin id
--   admin    : set local role authenticated + jwt sub = admin id
-- Fixed ids: admin = …a1, other user = …b2

-- =============================== VISITOR ===============================

-- TEST: visitor can read profile and settings
set local role anon;
do $$ begin
  if (select count(*) from public.profile) <> 1 then raise exception 'cannot read profile'; end if;
  if (select count(*) from public.site_settings) <> 1 then raise exception 'cannot read settings'; end if;
end $$;

-- TEST: visitor sees only visible services
insert into public.services (title, is_visible) values ('Shown', true), ('Hidden', false);
set local role anon;
do $$ begin
  if (select count(*) from public.services) <> 1 then raise exception 'hidden service leaked'; end if;
end $$;

-- TEST: visitor sees only published case studies and their images
insert into public.case_studies (id, slug, title, status) values
  ('00000000-0000-0000-0000-0000000000c1', 'pub', 'Published', 'published'),
  ('00000000-0000-0000-0000-0000000000c2', 'draft', 'Draft', 'draft');
insert into public.case_study_images (case_study_id, image_path) values
  ('00000000-0000-0000-0000-0000000000c1', 'a.webp'),
  ('00000000-0000-0000-0000-0000000000c2', 'b.webp');
set local role anon;
do $$ begin
  if (select count(*) from public.case_studies) <> 1 then raise exception 'draft case study leaked'; end if;
  if (select count(*) from public.case_study_images) <> 1 then raise exception 'draft image leaked'; end if;
end $$;

-- TEST: visitor cannot edit profile  EXPECT FAIL
set local role anon;
update public.profile set full_name = 'Hacked';

-- TEST: visitor cannot add a service  EXPECT FAIL
set local role anon;
insert into public.services (title) values ('spam');

-- TEST: visitor cannot delete content  EXPECT FAIL
set local role anon;
delete from public.faqs;

-- TEST: visitor cannot truncate a table  EXPECT FAIL
set local role anon;
truncate public.faqs;

-- TEST: visitor cannot read the inbox  EXPECT FAIL
set local role anon;
select * from public.contact_messages;

-- TEST: visitor cannot insert into inbox directly  EXPECT FAIL
set local role anon;
insert into public.contact_messages (name, email) values ('x', 'x@y.co');

-- TEST: visitor can send the contact form via the function
set local role anon;
do $$ declare v uuid; begin
  v := public.submit_contact_message(p_name => '  Jane  ', p_email => 'jane@example.com', p_message => 'Hi', p_ip_hash => 'ip1');
  if v is null then raise exception 'no id returned'; end if;
end $$;
reset role;
do $$ begin
  if (select name from public.contact_messages) <> 'Jane' then raise exception 'name not trimmed'; end if;
  if (select status from public.contact_messages) <> 'new' then raise exception 'status not new'; end if;
end $$;

-- TEST: contact form still validates (needs phone or email)  EXPECT FAIL
set local role anon;
select public.submit_contact_message(p_name => 'No contact', p_message => 'hi');

-- TEST: 6th message in an hour from same device is blocked  EXPECT FAIL
set local role anon;
do $$ begin
  for i in 1..6 loop
    perform public.submit_contact_message(p_name => 'Spam', p_email => 's@x.co', p_ip_hash => 'same-ip');
  end loop;
end $$;

-- TEST: 5 messages in an hour from same device are allowed
set local role anon;
do $$ begin
  for i in 1..5 loop
    perform public.submit_contact_message(p_name => 'Ok', p_email => 'o@x.co', p_ip_hash => 'ip-five');
  end loop;
end $$;

-- TEST: site-wide flood (31 in 10 min, different devices) is blocked  EXPECT FAIL
set local role anon;
do $$ begin
  for i in 1..31 loop
    perform public.submit_contact_message(p_name => 'Flood', p_email => 'f@x.co', p_ip_hash => 'ip-' || i);
  end loop;
end $$;

-- TEST: visitor cannot make themselves admin  EXPECT FAIL
set local role anon;
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000b2');

-- TEST: visitor cannot call internal trigger helpers  EXPECT FAIL
set local role anon;
select public.set_updated_at();

-- ======================= SIGNED IN, NOT ADMIN ==========================

-- TEST: non-admin user cannot edit profile (update matches nothing)
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
update public.profile set full_name = 'Hacked';
reset role;
do $$ begin
  if (select full_name from public.profile) = 'Hacked' then raise exception 'non-admin edited profile'; end if;
end $$;

-- TEST: non-admin user cannot add content  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
insert into public.faqs (question, answer) values ('q', 'a');

-- TEST: non-admin user sees no inbox messages
insert into public.contact_messages (name, email) values ('Secret', 's@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
do $$ begin
  if (select count(*) from public.contact_messages) <> 0 then raise exception 'inbox leaked to non-admin'; end if;
end $$;

-- TEST: non-admin user cannot make themselves admin  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000b2');

-- TEST: non-admin user does not see draft case studies
insert into public.case_studies (slug, title, status) values ('secret-draft', 'Draft', 'draft');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
do $$ begin
  if exists (select 1 from public.case_studies where slug = 'secret-draft') then raise exception 'draft leaked'; end if;
end $$;

-- ================================ ADMIN ================================

-- TEST: admin can edit profile and settings
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.profile set full_name = 'New Name';
update public.site_settings set color_accent = '#10B981';
do $$ begin
  if (select full_name from public.profile) <> 'New Name' then raise exception 'admin could not edit profile'; end if;
  if (select color_accent from public.site_settings) <> '#10B981' then raise exception 'admin could not edit settings'; end if;
end $$;

-- TEST: admin can create, see hidden, and delete list items
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into public.services (title, is_visible) values ('Draft service', false);
do $$ begin
  if (select count(*) from public.services where title = 'Draft service') <> 1 then raise exception 'admin cannot see hidden'; end if;
end $$;
delete from public.services where title = 'Draft service';
do $$ begin
  if exists (select 1 from public.services where title = 'Draft service') then raise exception 'admin could not delete'; end if;
end $$;

-- TEST: admin can manage case studies including drafts
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into public.case_studies (slug, title) values ('wip', 'Work in progress');
update public.case_studies set status = 'published' where slug = 'wip';
do $$ begin
  if (select published_at from public.case_studies where slug = 'wip') is null then raise exception 'publish failed'; end if;
end $$;

-- TEST: admin can read, update and delete inbox messages
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set status = 'replied', admin_note = 'Called back';
do $$ begin
  if (select status from public.contact_messages) <> 'replied' then raise exception 'admin cannot update inbox'; end if;
end $$;
delete from public.contact_messages;
do $$ begin
  if exists (select 1 from public.contact_messages) then raise exception 'admin cannot delete inbox'; end if;
end $$;

-- TEST: admin cannot delete the singleton profile row
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
delete from public.profile;
reset role;
do $$ begin
  if (select count(*) from public.profile) <> 1 then raise exception 'profile row deleted'; end if;
end $$;

-- TEST: even an admin cannot add admins through the API  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000b2');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000b2');

-- TEST: admin cannot truncate tables  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
truncate public.contact_messages;

-- ================================ STORAGE ==============================

-- TEST: media bucket exists, public, images only, 5 MB
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'media' and public and file_size_limit = 5242880
                 and not ('image/svg+xml' = any(allowed_mime_types))) then
    raise exception 'media bucket misconfigured'; end if;
end $$;

-- TEST: visitor cannot upload  EXPECT FAIL
set local role anon;
insert into storage.objects (bucket_id, name) values ('media', 'evil.png');

-- TEST: non-admin user cannot upload  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
insert into storage.objects (bucket_id, name) values ('media', 'evil.png');

-- TEST: admin can upload to media
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into storage.objects (bucket_id, name) values ('media', 'case-studies/cover.webp');

-- TEST: admin cannot upload to another bucket  EXPECT FAIL
insert into storage.buckets (id, name) values ('other', 'other');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into storage.objects (bucket_id, name) values ('other', 'x.png');

-- TEST: visitor cannot list uploaded files
insert into storage.objects (bucket_id, name) values ('media', 'private-listing.png');
set local role anon;
do $$ begin
  if exists (select 1 from storage.objects) then raise exception 'visitor can list files'; end if;
end $$;
