-- ============================================================
-- Chat conversations — run ONCE in the Supabase dashboard (SQL editor).
-- ============================================================
-- Enables the "new clean chat each open + saved-conversations sidebar"
-- feature. The app degrades gracefully WITHOUT this: chat keeps working as
-- a single flat thread and the sidebar stays empty. Running this turns on
-- multi-conversation history.

-- 1) Conversations table (one row per saved chat)
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null default 'שיחה חדשה',
  topic       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);

alter table public.conversations enable row level security;

create policy "users read own conversations"   on public.conversations
  for select using (auth.uid() = user_id);
create policy "users insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "users update own conversations" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- 2) Link chat_messages to a conversation
alter table public.chat_messages
  add column if not exists conversation_id uuid
  references public.conversations(id) on delete cascade;

create index if not exists chat_messages_conversation_idx
  on public.chat_messages (conversation_id, created_at);
