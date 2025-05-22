-- Match queue table for TuriCheck matchmaking
create table if not exists public.match_queue (
  id              bigserial primary key,
  session_id      uuid      not null,
  user_address    text      not null,
  matched         boolean   not null default false,
  opponent_address text,
  joined_at       timestamptz not null default now()
);

-- Enable RLS (Row Level Security)
alter table public.match_queue enable row level security;

-- Create policies for the match_queue table
create policy "Allow public read access to match_queue" 
  on public.match_queue for select 
  using (true);

create policy "Allow public insert access to match_queue"
  on public.match_queue for insert
  with check (true);

create policy "Allow update access to match_queue for users with matching address"
  on public.match_queue for update
  using (auth.uid()::text = user_address);

-- Create indexes for better performance
create index if not exists idx_match_queue_session_id on public.match_queue(session_id);
create index if not exists idx_match_queue_user_address on public.match_queue(user_address);
create index if not exists idx_match_queue_matched on public.match_queue(matched);

-- Enable realtime subscriptions for matchmaking
alter publication supabase_realtime add table public.match_queue;