-- Inbox tests (step 3.6). Admin = …a1, other user = …b2.

-- TEST: admin can change status and private note
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set status = 'archived', admin_note = 'Sent proposal';
reset role;
do $$ begin
  if (select status from public.contact_messages) <> 'archived' then raise exception 'status not saved'; end if;
  if (select admin_note from public.contact_messages) <> 'Sent proposal' then raise exception 'note not saved'; end if;
end $$;

-- TEST: changing status bumps updated_at
insert into public.contact_messages (name, email, updated_at) values ('Lead', 'l@x.co', now() - interval '1 day');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set status = 'read';
reset role;
do $$ begin
  if (select updated_at from public.contact_messages) < now() - interval '1 hour' then raise exception 'updated_at not bumped'; end if;
end $$;

-- TEST: admin cannot rewrite what the visitor sent (message)  EXPECT FAIL
insert into public.contact_messages (name, email, message) values ('Lead', 'l@x.co', 'Original');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set message = 'Forged';

-- TEST: admin cannot change the sender's email  EXPECT FAIL
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set email = 'other@x.co';

-- TEST: admin cannot backdate a message  EXPECT FAIL
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set created_at = now() - interval '1 year';

-- TEST: admin cannot add messages directly (only the contact form can)  EXPECT FAIL
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into public.contact_messages (name, email) values ('Fake', 'f@x.co');

-- TEST: unknown status is rejected  EXPECT FAIL
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set status = 'deleted';

-- TEST: private note is limited to 2000 characters  EXPECT FAIL
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.contact_messages set admin_note = repeat('x', 2001);

-- TEST: non-admin cannot change a message's status (update matches nothing)
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
update public.contact_messages set status = 'spam';
reset role;
do $$ begin
  if (select status from public.contact_messages) <> 'new' then raise exception 'non-admin changed status'; end if;
end $$;

-- TEST: visitor cannot change a message's status  EXPECT FAIL
insert into public.contact_messages (name, email) values ('Lead', 'l@x.co');
set local role anon;
update public.contact_messages set status = 'spam';

-- TEST: the contact form function still works after the privilege change
set local role anon;
select public.submit_contact_message(p_name => 'Ann', p_email => 'ann@x.co', p_message => 'Hi');
reset role;
do $$ begin
  if (select count(*) from public.contact_messages where name = 'Ann' and status = 'new') <> 1 then raise exception 'form broken'; end if;
end $$;
