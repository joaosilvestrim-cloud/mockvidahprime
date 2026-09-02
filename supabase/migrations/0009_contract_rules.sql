-- 0009: alinha as regras de cancelamento ao contrato oficial.
-- Por hora/período: menos de 24h não cancela; 24h+ vira crédito válido por 6 meses.
-- Período fixo (mensal): menos de 7 dias não cancela; 7 dias+ vira crédito por 6 meses.

update public.settings set value = '24'  where key = 'cancel_window_hours';
update public.settings set value = '180' where key = 'credit_validity_days';
insert into public.settings(key, value) values ('cancel_window_hours_monthly', '168')
  on conflict (key) do nothing;

create or replace function public.cancel_booking(p_booking uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_total numeric;
  v_first timestamptz;
  v_mode text;
  v_window int;
  v_valid int;
  v_credit boolean := false;
begin
  select profile_id, total, use_mode into v_owner, v_total, v_mode
    from public.bookings where id = p_booking and status = 'confirmed';
  if v_owner is null then raise exception 'NOT_FOUND'; end if;
  if v_owner <> v_uid and not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select min(start_at) into v_first from public.booking_slots
    where booking_id = p_booking and status = 'reserved';

  if v_mode = 'fixo' then
    select coalesce(value, '168')::int into v_window from public.settings where key = 'cancel_window_hours_monthly';
  else
    select coalesce(value, '24')::int into v_window from public.settings where key = 'cancel_window_hours';
  end if;
  select coalesce(value, '180')::int into v_valid from public.settings where key = 'credit_validity_days';

  update public.booking_slots set status = 'cancelled' where booking_id = p_booking;
  update public.bookings set status = 'cancelled' where id = p_booking;

  if v_first is not null and v_first - now() > make_interval(hours => v_window) then
    insert into public.credits(profile_id, amount, source_booking_id, expires_at)
      values (v_owner, v_total, p_booking, now() + make_interval(days => v_valid));
    v_credit := true;
  end if;
  return jsonb_build_object('credited', v_credit, 'amount', case when v_credit then v_total else 0 end);
end $$;
grant execute on function public.cancel_booking(uuid) to authenticated;
