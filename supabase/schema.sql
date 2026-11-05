-- Before You Pay · saved checks. Run once in the Supabase SQL editor.
-- Charter principle 4: the screenshot image is never stored. Only names, sizes, prices, result and decision.
create table if not exists public.byp_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  store text check (char_length(store) <= 80),
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 20 and pg_column_size(items) < 20000),
  amount_paid numeric(12,2) check (amount_paid is null or (amount_paid >= 0 and amount_paid < 10000000)),
  money_at_risk numeric(12,2) not null check (money_at_risk >= 0 and money_at_risk < 10000000),
  final_sale numeric(12,2) not null default 0 check (final_sale >= 0 and final_sale < 10000000),
  not_confirmed numeric(12,2) not null default 0 check (not_confirmed >= 0 and not_confirmed < 10000000),
  rule_status text not null check (rule_status in ('advertised', 'unverified')),
  flags jsonb not null default '[]'::jsonb
    check (jsonb_typeof(flags) = 'array' and jsonb_array_length(flags) <= 20 and pg_column_size(flags) < 8000),
  decision text not null check (decision in ('wait', 'change_size', 'buy_anyway')),
  source text not null check (source in ('screenshot', 'simulated'))
);

alter table public.byp_checks enable row level security;

drop policy if exists "byp own select" on public.byp_checks;
drop policy if exists "byp own insert" on public.byp_checks;
drop policy if exists "byp own delete" on public.byp_checks;
create policy "byp own select" on public.byp_checks for select to authenticated using (auth.uid() = user_id);
create policy "byp own insert" on public.byp_checks for insert to authenticated with check (auth.uid() = user_id);
create policy "byp own delete" on public.byp_checks for delete to authenticated using (auth.uid() = user_id);
-- No update policy: a saved check is a record; the buyer can delete it, not rewrite it.

create index if not exists byp_checks_user_created on public.byp_checks (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Week 13 · anonymous event log (stack floor: analytics / feedback mechanism).
-- Charter principle 4 + Week 13 shadow: events only. No image, no item names, no prices, no store name,
-- no user id, no IP. A random id per browser tab groups one visit; it is never linked to an account.
create table if not exists public.byp_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit text not null check (visit ~ '^[a-z0-9]{8,16}$'),
  event text not null check (event in (
    'page_view', 'upload_started', 'read_ok', 'read_failed', 'sample_used',
    'field_edited', 'details_opened', 'policy_pasted', 'policy_link_opened',
    'decision_wait', 'decision_change_size', 'decision_buy_anyway', 'saved', 'lang_switched'
  )),
  rule_known boolean,
  lang text check (lang is null or lang in ('en', 'es')),
  device text check (device is null or device in ('phone', 'desktop'))
);

alter table public.byp_events enable row level security;
drop policy if exists "byp events anon insert" on public.byp_events;
-- Anyone may append an event; nobody can read, change or delete through the public key. The founder reads them in the dashboard.
create policy "byp events anon insert" on public.byp_events for insert to anon, authenticated with check (true);
create index if not exists byp_events_created on public.byp_events (created_at desc);
