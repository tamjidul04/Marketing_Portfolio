-- =====================================================================
--  Inbox hardening (step 3.6)
--  What a visitor sent is a record: even an admin can only change the
--  message's status and private note, never the name, contact details
--  or text. (Admins can still delete a message entirely.)
--  RLS already limits who can update; these column privileges limit WHAT.
-- =====================================================================

revoke update on public.contact_messages from authenticated;
grant update (status, admin_note) on public.contact_messages to authenticated;

comment on column public.contact_messages.admin_note is 'Private note for the admin (never shown on the website).';
