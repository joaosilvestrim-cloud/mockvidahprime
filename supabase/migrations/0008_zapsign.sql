-- 0008: assinatura na plataforma ZapSign.
-- Estende a trilha de contrato com o documento e o status da ZapSign,
-- e cria RPCs para iniciar e confirmar a assinatura.

alter table public.contracts add column if not exists provider    text not null default 'local';   -- local | zapsign
alter table public.contracts add column if not exists external_id text;                             -- token do documento ZapSign
alter table public.contracts add column if not exists sign_url    text;                             -- link de assinatura
alter table public.contracts add column if not exists signed_url  text;                             -- PDF assinado (ZapSign)
alter table public.contracts add column if not exists status      text not null default 'signed';   -- sent | signed
alter table public.contracts add column if not exists created_at  timestamptz not null default now();

create index if not exists contracts_external_idx on public.contracts(external_id);

-- inicia a assinatura: registra o contrato ainda não assinado (status 'sent')
create or replace function public.sig_start(p_external text, p_sign_url text, p_ua text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  -- descarta tentativa anterior não assinada do mesmo usuário
  delete from public.contracts where profile_id = v_uid and provider = 'zapsign' and status = 'sent';
  insert into public.contracts(profile_id, provider, external_id, sign_url, status, user_agent)
    values (v_uid, 'zapsign', p_external, p_sign_url, 'sent', p_ua);
end $$;
grant execute on function public.sig_start(text,text,text) to authenticated;

-- confirma a assinatura (chamado após a ZapSign sinalizar assinado) — via sessão do usuário
create or replace function public.sig_confirm(p_external text, p_signed_url text default null, p_hash text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.contracts
     set status = 'signed',
         signed_url = coalesce(p_signed_url, signed_url),
         hash = coalesce(p_hash, hash)
   where profile_id = v_uid and provider = 'zapsign'
     and (external_id = p_external or p_external is null);
  update public.profiles
     set status = 'pending', contract_signed_at = now(), contract_hash = coalesce(p_hash, contract_hash)
   where id = v_uid and status in ('incomplete','rejected');
end $$;
grant execute on function public.sig_confirm(text,text,text) to authenticated;
