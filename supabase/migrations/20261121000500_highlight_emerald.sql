-- Highlight colour becomes emerald (the design is now all-emerald on navy).
-- Only a row still on the old gold default is changed, so a custom colour is never overwritten.
alter table public.site_settings alter column color_highlight set default '#10B981';
update public.site_settings set color_highlight = '#10B981' where color_highlight = '#E0A526';
