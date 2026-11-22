-- =====================================================================
--  Social links must be web addresses (step 4.2, defence in depth)
--  The admin already checks this; the database now enforces it too, so a
--  "javascript:" link can never reach the website even if that check is bypassed.
-- =====================================================================
alter table public.site_settings
  add constraint socials_urls_are_web check (
    jsonb_path_exists(socials, '$[*] ? (!(@.url like_regex "^https?://[^[:space:]]+$" flag "i"))') = false
    and jsonb_path_exists(socials, '$[*] ? (@.url.size() > 2048)') = false
  );
