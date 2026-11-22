-- Sign-in throttle tests (step 4.2).

-- TEST: first attempts from a device are allowed
set local role anon;
do $$ begin
  if not public.login_attempt_allowed(repeat('a', 64)) then raise exception 'first attempt blocked'; end if;
end $$;

-- TEST: 10 attempts in 15 minutes allowed, the 11th is blocked
set local role anon;
do $$ declare i int; begin
  for i in 1..10 loop
    if not public.login_attempt_allowed(repeat('b', 64)) then raise exception 'attempt % blocked too early', i; end if;
  end loop;
  if public.login_attempt_allowed(repeat('b', 64)) then raise exception '11th attempt was allowed'; end if;
end $$;

-- TEST: one device being blocked does not block another
set local role anon;
do $$ declare i int; begin
  for i in 1..11 loop perform public.login_attempt_allowed(repeat('c', 64)); end loop;
  if not public.login_attempt_allowed(repeat('d', 64)) then raise exception 'other device blocked'; end if;
end $$;

-- TEST: attempts older than 15 minutes do not count
insert into public.login_attempts (ip_hash, created_at) select repeat('e', 64), now() - interval '20 minutes' from generate_series(1, 20);
set local role anon;
do $$ begin
  if not public.login_attempt_allowed(repeat('e', 64)) then raise exception 'old attempts still counted'; end if;
end $$;

-- TEST: rows older than a day are cleaned up
insert into public.login_attempts (ip_hash, created_at) values (repeat('f', 64), now() - interval '2 days');
set local role anon;
select public.login_attempt_allowed(repeat('g', 64));
reset role;
do $$ begin
  if exists (select 1 from public.login_attempts where ip_hash = repeat('f', 64)) then raise exception 'old rows not cleaned'; end if;
end $$;

-- TEST: missing / silly hashes are refused
set local role anon;
do $$ begin
  if public.login_attempt_allowed(null) then raise exception 'null allowed'; end if;
  if public.login_attempt_allowed('short') then raise exception 'short allowed'; end if;
  if public.login_attempt_allowed(repeat('x', 200)) then raise exception 'huge allowed'; end if;
end $$;

-- TEST: visitors cannot read the attempts table  EXPECT FAIL
set local role anon;
select * from public.login_attempts;

-- TEST: visitors cannot clear their own attempts  EXPECT FAIL
set local role anon;
delete from public.login_attempts;

-- TEST: signed-in users cannot read the attempts table either  EXPECT FAIL
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select * from public.login_attempts;
