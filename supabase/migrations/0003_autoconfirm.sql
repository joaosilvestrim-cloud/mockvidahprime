-- Auto-confirma o e-mail no signup.
-- Justificativa: o gate real de acesso é a APROVAÇÃO do admin (status pending→approved,
-- após conferência de documentos). A verificação de e-mail não agrega segurança aqui e
-- só atrapalha o cadastro em sessão única. Isso também remove a necessidade da service_role
-- no app (cadastro passa a usar apenas a chave pública + RLS).
create or replace function public.auto_confirm_user() returns trigger
language plpgsql security definer set search_path = auth, public as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_auto_confirm on auth.users;
create trigger trg_auto_confirm before insert on auth.users
  for each row execute function public.auto_confirm_user();
