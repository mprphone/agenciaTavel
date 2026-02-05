-- Incremental migration for team chat messages
create table if not exists team_chat_messages (
  id text primary key default gen_random_uuid()::text,
  sender_id text references employees(id) on delete set null,
  sender_name text not null,
  text text not null,
  channel text default 'geral',
  created_at timestamptz default now()
);

create index if not exists idx_team_chat_messages_created_at on team_chat_messages (created_at);
create index if not exists idx_team_chat_messages_channel on team_chat_messages (channel);
