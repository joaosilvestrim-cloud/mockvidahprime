-- Período Fixo agora reserva de fato as ocorrências semanais (a tela envia 4 semanas).
-- Total passa a sair dos slots reais (sem multiplicador artificial), evitando cobrar
-- por semanas que não estavam reservadas.
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
  return v_booking;
exception when exclusion_violation then
  raise exception 'SLOT_CONFLICT';
end $$;
grant execute on function public.create_booking(int,text,text,jsonb) to authenticated;
