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

-- ─────────────────────────────────────────────────────────────────────────────
-- Week 14 · Pricing. Run once in the Supabase SQL editor (after the sections above).

-- 1) New anonymous events (pricing page, plan buttons, the free/paid gate, codes, simulator).
alter table public.byp_events drop constraint if exists byp_events_event_check;
alter table public.byp_events add constraint byp_events_event_check check (event in (
  'page_view', 'upload_started', 'read_ok', 'read_failed', 'sample_used',
  'field_edited', 'details_opened', 'policy_pasted', 'policy_link_opened',
  'decision_wait', 'decision_change_size', 'decision_buy_anyway', 'saved', 'lang_switched',
  'pricing_view', 'plan_pack_clicked', 'plan_pass_clicked', 'plan_issuer_clicked',
  'gate_shown', 'code_ok', 'code_bad', 'paid_check', 'pack_requested',
  'simulator_view', 'scenario_saved'
));

-- 2) Saved simulator scenarios (stack floor). Own rows only; a scenario holds numbers, never personal data.
create table if not exists public.byp_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  inputs jsonb not null check (jsonb_typeof(inputs) = 'object' and pg_column_size(inputs) < 4000)
);
alter table public.byp_scenarios enable row level security;
drop policy if exists "byp scen own select" on public.byp_scenarios;
drop policy if exists "byp scen own insert" on public.byp_scenarios;
drop policy if exists "byp scen own delete" on public.byp_scenarios;
create policy "byp scen own select" on public.byp_scenarios for select to authenticated using (auth.uid() = user_id);
create policy "byp scen own insert" on public.byp_scenarios for insert to authenticated with check (auth.uid() = user_id);
create policy "byp scen own delete" on public.byp_scenarios for delete to authenticated using (auth.uid() = user_id);
create index if not exists byp_scenarios_user on public.byp_scenarios (user_id, created_at desc);

-- 3) Pack requests: how a buyer asks for a pack without the founder's contact on the page.
-- Personal data (the buyer's Google email, an optional WhatsApp) → behind Google sign-in + RLS (security floor #2, #3).
-- The buyer sees and can delete only their own requests; the founder reads them in the dashboard. No update through the API.
create table if not exists public.byp_pack_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  plan text not null check (plan in ('pack', 'pass')),
  contact_email text not null default (auth.jwt() ->> 'email') check (char_length(contact_email) <= 254),
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+?[0-9]{10,13}$'),
  consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new', 'contacted', 'paid', 'declined'))
);
alter table public.byp_pack_requests enable row level security;
drop policy if exists "byp req own select" on public.byp_pack_requests;
drop policy if exists "byp req own insert" on public.byp_pack_requests;
drop policy if exists "byp req own delete" on public.byp_pack_requests;
create policy "byp req own select" on public.byp_pack_requests for select to authenticated using (auth.uid() = user_id);
create policy "byp req own insert" on public.byp_pack_requests for insert to authenticated
  with check (auth.uid() = user_id and status = 'new' and contact_email = (auth.jwt() ->> 'email'));
create policy "byp req own delete" on public.byp_pack_requests for delete to authenticated using (auth.uid() = user_id);
create unique index if not exists byp_pack_requests_one_open on public.byp_pack_requests (user_id, plan) where status = 'new';

-- 4) Pack and pass codes. Stored ONLY as SHA-256 hashes; no table access through the public key (RLS on, no policies).
-- Codes are inserted by the founder in the SQL editor; their hashes are never committed to this public repo.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.byp_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('pack', 'pass')),
  checks_left int check (checks_left is null or checks_left between 0 and 100),
  pass_days int check (pass_days is null or pass_days between 1 and 366),
  created_at timestamptz not null default now(),
  first_used_at timestamptz,
  last_used_at timestamptz,
  expires_at timestamptz,
  check ((kind = 'pack' and checks_left is not null) or (kind = 'pass' and pass_days is not null))
);
alter table public.byp_codes enable row level security;

-- One function checks (p_consume = false) or uses (p_consume = true) a code. It returns only what the buyer needs.
create or replace function public.byp_use_check(p_code text, p_consume boolean default false)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  h text;
  r public.byp_codes%rowtype;
begin
  if p_code is null or p_code !~ '^BYP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' then
    return json_build_object('ok', false, 'reason', 'format');
  end if;
  h := encode(extensions.digest(p_code, 'sha256'), 'hex');
  select * into r from public.byp_codes where code_hash = h for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'unknown');
  end if;
  if r.kind = 'pack' then
    if r.checks_left <= 0 then
      return json_build_object('ok', false, 'reason', 'used_up', 'kind', 'pack', 'checks_left', 0);
    end if;
    if p_consume then
      update public.byp_codes
        set checks_left = checks_left - 1, first_used_at = coalesce(first_used_at, now()), last_used_at = now()
        where code_hash = h returning * into r;
    end if;
    return json_build_object('ok', true, 'kind', 'pack', 'checks_left', r.checks_left);
  end if;
  -- pass
  if r.expires_at is not null and r.expires_at < now() then
    return json_build_object('ok', false, 'reason', 'expired', 'kind', 'pass', 'expires_at', r.expires_at);
  end if;
  if p_consume then
    update public.byp_codes
      set first_used_at = coalesce(first_used_at, now()),
          expires_at = coalesce(expires_at, now() + make_interval(days => r.pass_days)),
          last_used_at = now()
      where code_hash = h returning * into r;
  end if;
  return json_build_object('ok', true, 'kind', 'pass', 'expires_at', r.expires_at, 'pass_days', r.pass_days);
end;
$$;
revoke all on function public.byp_use_check(text, boolean) from public;
grant execute on function public.byp_use_check(text, boolean) to anon, authenticated;
