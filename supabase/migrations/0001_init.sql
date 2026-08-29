-- ============================================================
-- Vidah Prime — schema inicial (produção)
-- ============================================================
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  cpf text,
  council_type text,
  council_number text,
  area text,
  role text not null default 'professional' check (role in ('professional','admin')),
  status text not null default 'incomplete' check (status in ('incomplete','pending','approved','rejected','blocked')),
  contract_signed_at timestamptz,
  contract_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- is_admin helper (security definer evita recursão de RLS)
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_status() returns text
language sql security definer stable set search_path = public as $$
  select status from public.profiles where id = auth.uid();
$$;

-- cria profile automaticamente no signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- documents ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('professional','address','personal')),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  unique(profile_id, kind)
);

-- ---------- contracts (trilha de aceite) ----------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  version text not null default 'v1',
  accepted_at timestamptz not null default now(),
  ip text,
  hash text
);

-- ---------- rooms ----------
create table if not exists public.rooms (
  id int primary key,
  slug text unique not null,
  name text not null,
  category text not null,
  description text,
  price_hour numeric(10,2) not null,
  available boolean not null default true,
  accent text,
  icon text,
  specialties text[] default '{}',
  sort int not null default 0
);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  room_id int not null references public.rooms(id),
  use_mode text not null check (use_mode in ('avulso','flex','fixo')),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  total numeric(10,2) not null default 0,
  payment_method text check (payment_method in ('pix','card')),
  created_at timestamptz not null default now()
);

-- buffer de higienização (minutos) — ajustável pela operação
create table if not exists public.settings (
  key text primary key,
  value text
);
insert into public.settings(key,value) values ('cleaning_buffer_min','30')
  on conflict (key) do nothing;
insert into public.settings(key,value) values ('cancel_window_hours','48')
  on conflict (key) do nothing;
insert into public.settings(key,value) values ('credit_validity_days','60')
  on conflict (key) do nothing;

-- ---------- booking_slots (blocos reservados) ----------
create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  room_id int not null references public.rooms(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  cleaning_until timestamptz not null,
  status text not null default 'reserved' check (status in ('reserved','cancelled')),
  constraint slot_valid check (end_at > start_at and cleaning_until >= end_at)
);
-- impede sobreposição por sala (inclui janela de limpeza) só p/ reservados
alter table public.booking_slots drop constraint if exists no_overlap;
alter table public.booking_slots add constraint no_overlap
  exclude using gist (
    room_id with =,
    tstzrange(start_at, cleaning_until, '[)') with &&
  ) where (status = 'reserved');

-- ---------- slot_blocks (admin abre/fecha manualmente) ----------
create table if not exists public.slot_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id int not null references public.rooms(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- credits (crédito de cancelamento) ----------
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  source_booking_id uuid references public.bookings(id) on delete set null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_slots enable row level security;
alter table public.slot_blocks enable row level security;
alter table public.credits enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid());

-- documents
drop policy if exists documents_rw_own on public.documents;
create policy documents_rw_own on public.documents for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid());

-- contracts
drop policy if exists contracts_rw_own on public.contracts;
create policy contracts_rw_own on public.contracts for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid());

-- rooms (leitura pública p/ site + SEO; escrita só admin)
drop policy if exists rooms_read_all on public.rooms;
create policy rooms_read_all on public.rooms for select using (true);
drop policy if exists rooms_admin_write on public.rooms;
create policy rooms_admin_write on public.rooms for all
  using (public.is_admin()) with check (public.is_admin());

-- bookings
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings for select
  using (profile_id = auth.uid() or public.is_admin());

-- booking_slots: dono vê seus; admin vê todos (disponibilidade via RPC)
drop policy if exists slots_select_own on public.booking_slots;
create policy slots_select_own on public.booking_slots for select
  using (public.is_admin() or exists(
    select 1 from public.bookings b where b.id = booking_id and b.profile_id = auth.uid()
  ));

-- slot_blocks: leitura autenticada (p/ montar agenda), escrita admin
drop policy if exists slot_blocks_read on public.slot_blocks;
create policy slot_blocks_read on public.slot_blocks for select using (auth.uid() is not null);
drop policy if exists slot_blocks_admin on public.slot_blocks;
create policy slot_blocks_admin on public.slot_blocks for all
  using (public.is_admin()) with check (public.is_admin());

-- credits
drop policy if exists credits_own on public.credits;
create policy credits_own on public.credits for select
  using (profile_id = auth.uid() or public.is_admin());

-- ============================================================
-- RPCs (lógica de negócio server-side)
-- ============================================================

-- disponibilidade: blocos ocupados (reserva + limpeza) e bloqueios admin
create or replace function public.busy_ranges(p_room int, p_from timestamptz, p_to timestamptz)
returns table(start_at timestamptz, end_at timestamptz, kind text)
language sql security definer stable set search_path = public as $$
  select s.start_at, s.cleaning_until as end_at, 'booked'::text
    from public.booking_slots s
   where s.room_id = p_room and s.status='reserved'
     and s.start_at < p_to and s.cleaning_until > p_from
  union all
  select b.start_at, b.end_at, 'blocked'::text
    from public.slot_blocks b
   where b.room_id = p_room
     and b.start_at < p_to and b.end_at > p_from;
$$;
grant execute on function public.busy_ranges(int,timestamptz,timestamptz) to anon, authenticated;

-- criar reserva (valida aprovação, calcula total, previne conflito)
create or replace function public.create_booking(
  p_room int, p_use_mode text, p_payment text, p_slots jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_price numeric;
  v_buffer int;
  v_booking uuid;
  v_slot jsonb;
  v_start timestamptz;
  v_end timestamptz;
  v_hours numeric := 0;
  v_mult numeric := 1;
  v_total numeric;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select status into v_status from public.profiles where id = v_uid;
  if v_status is distinct from 'approved' then raise exception 'NOT_APPROVED'; end if;
  select price_hour into v_price from public.rooms where id = p_room and available;
  if v_price is null then raise exception 'ROOM_UNAVAILABLE'; end if;
  if p_use_mode not in ('avulso','flex','fixo') then raise exception 'BAD_MODE'; end if;
  select coalesce(value,'30')::int into v_buffer from public.settings where key='cleaning_buffer_min';
  if p_payment not in ('pix','card') then raise exception 'BAD_PAYMENT'; end if;

  insert into public.bookings(profile_id, room_id, use_mode, total, payment_method)
    values (v_uid, p_room, p_use_mode, 0, p_payment) returning id into v_booking;

  for v_slot in select * from jsonb_array_elements(p_slots) loop
    v_start := (v_slot->>'start')::timestamptz;
    v_end   := (v_slot->>'end')::timestamptz;
    if v_end <= v_start then raise exception 'BAD_SLOT'; end if;
    -- rejeita se cair em bloqueio admin
    if exists(select 1 from public.slot_blocks sb where sb.room_id=p_room and sb.start_at < v_end and sb.end_at > v_start) then
      raise exception 'SLOT_BLOCKED';
    end if;
    insert into public.booking_slots(booking_id, room_id, start_at, end_at, cleaning_until)
      values (v_booking, p_room, v_start, v_end, v_end + make_interval(mins => v_buffer));
    v_hours := v_hours + extract(epoch from (v_end - v_start))/3600.0;
  end loop;

  if v_hours = 0 then raise exception 'NO_SLOTS'; end if;
  if p_use_mode = 'fixo' then v_mult := 4; end if;   -- recorrente mensal (~4 semanas)
  v_total := round(v_price * v_hours * v_mult, 2);
  update public.bookings set total = v_total where id = v_booking;
  return v_booking;
exception when exclusion_violation then
  raise exception 'SLOT_CONFLICT';
end $$;
grant execute on function public.create_booking(int,text,text,jsonb) to authenticated;

-- cancelar reserva (regra de crédito 48h/60d)
create or replace function public.cancel_booking(p_booking uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_total numeric;
  v_first timestamptz;
  v_window int;
  v_valid int;
  v_credit boolean := false;
begin
  select profile_id, total into v_owner, v_total from public.bookings where id = p_booking and status='confirmed';
  if v_owner is null then raise exception 'NOT_FOUND'; end if;
  if v_owner <> v_uid and not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select min(start_at) into v_first from public.booking_slots where booking_id = p_booking and status='reserved';
  select coalesce(value,'48')::int into v_window from public.settings where key='cancel_window_hours';
  select coalesce(value,'60')::int into v_valid from public.settings where key='credit_validity_days';

  update public.booking_slots set status='cancelled' where booking_id = p_booking;
  update public.bookings set status='cancelled' where id = p_booking;

  if v_first is not null and v_first - now() > make_interval(hours => v_window) then
    insert into public.credits(profile_id, amount, source_booking_id, expires_at)
      values (v_owner, v_total, p_booking, now() + make_interval(days => v_valid));
    v_credit := true;
  end if;
  return jsonb_build_object('credited', v_credit, 'amount', case when v_credit then v_total else 0 end);
end $$;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- concluir cadastro (assinatura do contrato -> pending)
create or replace function public.submit_registration(p_hash text, p_ip text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.profiles
     set status = 'pending', contract_signed_at = now(), contract_hash = p_hash
   where id = v_uid and status in ('incomplete','rejected');
  insert into public.contracts(profile_id, ip, hash) values (v_uid, p_ip, p_hash);
end $$;
grant execute on function public.submit_registration(text,text) to authenticated;

-- admin: aprovar / recusar / bloquear
create or replace function public.admin_set_status(p_profile uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('approved','rejected','blocked','pending') then raise exception 'BAD_STATUS'; end if;
  update public.profiles set status = p_status where id = p_profile and role='professional';
end $$;
grant execute on function public.admin_set_status(uuid,text) to authenticated;

-- ============================================================
-- Storage bucket (documentos privados)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents','documents', false)
on conflict (id) do nothing;

drop policy if exists docs_owner_rw on storage.objects;
create policy docs_owner_rw on storage.objects for all
  to authenticated
  using (bucket_id='documents' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id='documents' and owner = auth.uid());
