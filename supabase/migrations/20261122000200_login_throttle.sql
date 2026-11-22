-- =====================================================================
--  Sign-in throttle (step 4.2)
--  Supabase limits sign-in attempts per IP address, but the admin calls Supabase from its
--  own server, so every visitor shares one IP there: one attacker could lock everyone out
--  while guessing passwords. This limits attempts per VISITOR instead:
--    max 10 sign-in / password-reset attempts per 15 minutes per device (hashed IP).
--  Only a salted hash of the IP is stored (never the IP), and rows are deleted after a day.
-- =====================================================================

create table public.login_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null check (length(ip_hash) between 16 and 128),
  created_at timestamptz not null default now()
);
create index login_attempts_ip_idx on public.login_attempts (ip_hash, created_at desc);

alter table public.login_attempts enable row level security;   -- no policies: nobody reads it via the API
revoke all on public.login_attempts from anon, authenticated;

-- Records one attempt and says whether it may go ahead.
create or replace function public.login_attempt_allowed(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ip_hash is null or length(p_ip_hash) not between 16 and 128 then
    return false;
  end if;

  delete from public.login_attempts where created_at < now() - interval '1 day';   -- stays tiny

  if (select count(*) from public.login_attempts
       where ip_hash = p_ip_hash and created_at > now() - interval '15 minutes') >= 10 then
    return false;
  end if;

  insert into public.login_attempts (ip_hash) values (p_ip_hash);
  return true;
end $$;

revoke all on function public.login_attempt_allowed(text) from public;
grant execute on function public.login_attempt_allowed(text) to anon, authenticated;
