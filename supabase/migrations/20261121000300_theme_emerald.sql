-- Default accent colour: Navy + Emerald (was Navy + Gold).
-- Only rows still on the old default are changed, so a customised accent is never overwritten.
alter table public.site_settings alter column color_accent set default '#10B981';
update public.site_settings set color_accent = '#10B981' where color_accent = '#E0A526';
