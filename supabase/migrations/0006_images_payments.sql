-- ============================================================
-- Fotos das salas + estrutura de pagamentos (integração Inter)
-- ============================================================

-- 1) Foto da sala
alter table public.rooms add column if not exists image_url text;

-- bucket público de fotos das salas (leitura pública p/ o site; escrita só admin)
insert into storage.buckets (id, name, public) values ('rooms','rooms', true)
  on conflict (id) do nothing;
drop policy if exists rooms_img_admin on storage.objects;
create policy rooms_img_admin on storage.objects for all to authenticated
  using (bucket_id='rooms' and public.is_admin())
  with check (bucket_id='rooms' and public.is_admin());

-- 2) Pagamentos
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  provider text not null default 'inter',
  method text check (method in ('pix','card')),
  amount numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  external_id text,          -- id da cobrança no provedor (Inter)
  pix_copia_cola text,       -- código Pix copia-e-cola
  checkout_url text,         -- link de pagamento (cartão)
  raw jsonb,                 -- resposta bruta do provedor
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_booking_idx on public.payments(booking_id);
create index if not exists payments_status_idx on public.payments(status);

alter table public.payments enable row level security;
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (profile_id = auth.uid() or public.is_admin());
drop policy if exists payments_update_admin on public.payments;
create policy payments_update_admin on public.payments for update
  using (public.is_admin()) with check (public.is_admin());
-- inserção acontece dentro de create_booking (SECURITY DEFINER) e via webhook (service role)

-- 3) Configurações de pagamento
insert into public.settings(key,value) values ('payments_enabled','false') on conflict (key) do nothing;
insert into public.settings(key,value) values ('payment_provider','inter') on conflict (key) do nothing;

-- 4) create_booking passa a registrar um pagamento (pendente) por reserva
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
    if exists(select 1 from public.slot_blocks sb where sb.room_id=p_room and sb.start_at < v_end and sb.end_at > v_start) then
      raise exception 'SLOT_BLOCKED';
    end if;
    insert into public.booking_slots(booking_id, room_id, start_at, end_at, cleaning_until)
      values (v_booking, p_room, v_start, v_end, v_end + make_interval(mins => v_buffer));
    v_hours := v_hours + extract(epoch from (v_end - v_start))/3600.0;
  end loop;

  if v_hours = 0 then raise exception 'NO_SLOTS'; end if;
  v_total := round(v_price * v_hours, 2);
  update public.bookings set total = v_total where id = v_booking;

  insert into public.payments(booking_id, profile_id, method, amount, status)
    values (v_booking, v_uid, p_payment, v_total, 'pending');

  return v_booking;
exception when exclusion_violation then
  raise exception 'SLOT_CONFLICT';
end $$;
grant execute on function public.create_booking(int,text,text,jsonb) to authenticated;
