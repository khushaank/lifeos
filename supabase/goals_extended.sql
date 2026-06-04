-- Run in Supabase SQL editor (extends goals table)
alter table goals add column if not exists deadline date;
alter table goals add column if not exists description text default '';
alter table goals add column if not exists metric text default 'custom';
alter table goals add column if not exists target_value numeric;
alter table goals add column if not exists current_value numeric;
alter table goals add column if not exists unit text default '';
