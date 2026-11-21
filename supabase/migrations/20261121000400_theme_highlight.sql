-- Second accent ("highlight", gold by default) alongside the main accent (emerald).
--   color_accent    : actions and structure (buttons, links, labels, charts)
--   color_highlight : value and emphasis (big numbers, stars, underline, ring dot)
alter table public.site_settings
  add column if not exists color_highlight public.hex_color not null default '#E0A526';
