-- Assinatura eletrônica: guarda o PDF do contrato assinado + trilha de auditoria.

-- coluna para o caminho do PDF assinado
alter table public.contracts add column if not exists document_path text;
alter table public.contracts add column if not exists user_agent text;

-- bucket privado dos contratos assinados (leitura: dono ou admin; escrita: dono)
insert into storage.buckets (id, name, public) values ('contracts','contracts', false)
  on conflict (id) do nothing;
drop policy if exists contracts_owner_rw on storage.objects;
create policy contracts_owner_rw on storage.objects for all
  to authenticated
  using (bucket_id='contracts' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id='contracts' and owner = auth.uid());

-- submit_registration passa a receber user-agent e o caminho do PDF assinado
create or replace function public.submit_registration(p_hash text, p_ip text, p_ua text default null, p_doc text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.profiles
     set status = 'pending', contract_signed_at = now(), contract_hash = p_hash
   where id = v_uid and status in ('incomplete','rejected');
  insert into public.contracts(profile_id, ip, hash, user_agent, document_path)
    values (v_uid, p_ip, p_hash, p_ua, p_doc);
end $$;
grant execute on function public.submit_registration(text,text,text,text) to authenticated;
