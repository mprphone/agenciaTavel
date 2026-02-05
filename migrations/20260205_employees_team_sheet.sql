-- Incremental migration for employee team sheet, goals and time-clock fields
alter table if exists employees
  add column if not exists primary_tasks text[] default '{}',
  add column if not exists secondary_tasks text[] default '{}',
  add column if not exists work_schedule text,
  add column if not exists work_location text,
  add column if not exists access_password text,
  add column if not exists time_clock_pin text,
  add column if not exists time_clock_entries jsonb default '[]'::jsonb,
  add column if not exists mission text,
  add column if not exists measurable_objectives jsonb default '[]'::jsonb;
