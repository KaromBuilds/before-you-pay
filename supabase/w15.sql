-- Week 15 · The rule desk (distribution). Run once in the Supabase SQL editor. Additive only: nothing is dropped.
-- Both tables are ANONYMOUS: no account, no email, no phone, no name, no cart. Insert-only for the public key;
-- there is no select policy, so nobody can read them through the API (the founder reads them in the dashboard).

-- 1) Which piece and which channel led to which action. `visit` is the same random per-tab id as byp_events_v2,
--    so a /rules visit and a check started afterwards can be joined without knowing who anyone is.
create table if not exists public.byp_content_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit text not null check (visit ~ '^[a-z0-9]{8,16}$'),
  event text not null check (event in (
    'rules_view', 'piece_view', 'share', 'message_copied', 'card_opened', 'video_played', 'check_clicked', 'store_requested'
  )),
  piece text check (piece is null or piece ~ '^[a-z0-9-]{1,24}$'),
  src text not null default 'direct' check (src in ('wa', 'share', 'direct')),
  device text check (device is null or device in ('phone', 'desktop'))
);
alter table public.byp_content_events enable row level security;
create policy "byp content anon insert" on public.byp_content_events for insert to anon, authenticated with check (true);
create index if not exists byp_content_events_created on public.byp_content_events (created_at desc);

-- 2) "Ask for your store's rule": the store's name and nothing else. Same limits as cleanStoreName() in lib/content.ts.
create table if not exists public.byp_store_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  store text not null check (
    char_length(store) between 2 and 60
    and store !~ '[<>{}/\\@?=#%;:"|`$^*+!()\[\]~_]'
    and store !~* '(https?|www\.)'
  ),
  src text not null default 'direct' check (src in ('wa', 'share', 'direct'))
);
alter table public.byp_store_requests enable row level security;
create policy "byp store req anon insert" on public.byp_store_requests for insert to anon, authenticated with check (true);
create index if not exists byp_store_requests_created on public.byp_store_requests (created_at desc);
