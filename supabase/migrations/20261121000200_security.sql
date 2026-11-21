-- =====================================================================
--  Marketing Portfolio — security (Row Level Security + storage)
--
--  Who can do what:
--    visitor (anon)          read published/visible content only;
--                            send the contact form via submit_contact_message()
--    signed-in, not admin    same as visitor (signing in grants nothing)
--    admin (in public.admins) read + edit all content, manage the inbox
--    service_role            server-only key, bypasses RLS (used by setup scripts)
--
--  Admins are added only from the Supabase SQL editor / service role —
--  there is no API path to become an admin.
-- =====================================================================

-- ---------------------------------------------------------------------
--  is_admin(): true when the current JWT user is listed in public.admins
--  SECURITY DEFINER so it can read admins without exposing that table.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
--  Defence in depth: table privileges
--  Supabase grants ALL to anon/authenticated by default. TRUNCATE is not
--  covered by RLS, so remove it everywhere; visitors never write tables directly.
-- ---------------------------------------------------------------------
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
revoke all on public.contact_messages, public.admins from anon;

alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete on tables from anon;

-- ---------------------------------------------------------------------
--  Enable RLS on every table
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profile','site_settings','stats','brands','certifications','services','process_steps',
    'tools','about_facts','faqs','case_studies','case_study_images','testimonials',
    'contact_messages','admins'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
--  Singletons: everyone reads; admin updates; nobody inserts/deletes via API
-- ---------------------------------------------------------------------
create policy "profile: public read"        on public.profile       for select to anon, authenticated using (true);
create policy "profile: admin update"       on public.profile       for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings: public read"       on public.site_settings for select to anon, authenticated using (true);
create policy "settings: admin update"      on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
--  Ordered lists: visitors see visible rows; admin sees + edits everything
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'stats','brands','certifications','services','process_steps','tools','about_facts','faqs','testimonials'
  ] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_visible or public.is_admin())',
                   t || ': read visible', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
                   t || ': admin insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
                   t || ': admin update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())',
                   t || ': admin delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
--  Case studies: visitors see published only (drafts stay private)
-- ---------------------------------------------------------------------
create policy "case_studies: read published" on public.case_studies for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy "case_studies: admin insert"   on public.case_studies for insert to authenticated with check (public.is_admin());
create policy "case_studies: admin update"   on public.case_studies for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "case_studies: admin delete"   on public.case_studies for delete to authenticated using (public.is_admin());

create policy "case_study_images: read if case published" on public.case_study_images for select to anon, authenticated
  using (public.is_admin() or exists (
    select 1 from public.case_studies c where c.id = case_study_id and c.status = 'published'));
create policy "case_study_images: admin insert" on public.case_study_images for insert to authenticated with check (public.is_admin());
create policy "case_study_images: admin update" on public.case_study_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "case_study_images: admin delete" on public.case_study_images for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
--  Inbox: admin only. Visitors submit through the function below.
-- ---------------------------------------------------------------------
create policy "messages: admin read"   on public.contact_messages for select to authenticated using (public.is_admin());
create policy "messages: admin update" on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "messages: admin delete" on public.contact_messages for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
--  Admins table: an admin may see their own row; nobody writes via API
-- ---------------------------------------------------------------------
create policy "admins: read own row" on public.admins for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.admins from authenticated;

-- ---------------------------------------------------------------------
--  submit_contact_message(): the ONLY way visitors can write.
--  Validates input (table constraints) and rate-limits:
--    • max 5 messages per hour from the same ip_hash
--    • max 30 messages per 10 minutes site-wide (stops floods even if ip_hash is spoofed)
-- ---------------------------------------------------------------------
create or replace function public.submit_contact_message(
  p_name        text,
  p_email       text default null,
  p_phone       text default null,
  p_business    text default null,
  p_service     text default null,
  p_budget      text default null,
  p_message     text default '',
  p_source_path text default null,
  p_ip_hash     text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_ip_hash is not null and (
       select count(*) from public.contact_messages
        where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0429', hint = 'Too many messages from this device. Try again later.';
  end if;

  if (select count(*) from public.contact_messages
       where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0429', hint = 'Too many messages right now. Try again in a few minutes.';
  end if;

  insert into public.contact_messages
    (name, email, phone, business, service, budget, message, source_path, ip_hash)
  values (
    btrim(p_name),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_business), ''),
    nullif(btrim(p_service), ''),
    nullif(btrim(p_budget), ''),
    coalesce(btrim(p_message), ''),
    nullif(btrim(p_source_path), ''),
    nullif(btrim(p_ip_hash), '')
  )
  returning id into v_id;   -- status/admin_note always take their defaults

  return v_id;
end $$;

revoke all on function public.submit_contact_message(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_contact_message(text,text,text,text,text,text,text,text,text) to anon, authenticated;

-- trigger helpers are not callable as API functions
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.case_studies_publish_date() from public, anon, authenticated;

-- ---------------------------------------------------------------------
--  Storage: one public "media" bucket for images
--    • anyone can VIEW files by URL (bucket is public) but cannot list them
--    • only admins can upload / replace / delete
--    • images only (no SVG — it can carry scripts), max 5 MB
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: admin read"   on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
