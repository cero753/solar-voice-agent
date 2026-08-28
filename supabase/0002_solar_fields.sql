-- Adds the two fields introduced by the updated consultation script:
--   already_has_solar — a hard disqualification gate (question 7)
--   roof_condition    — free-text color for the engineer before the site visit
alter table public.leads add column if not exists already_has_solar boolean;
alter table public.leads add column if not exists roof_condition text default '';
