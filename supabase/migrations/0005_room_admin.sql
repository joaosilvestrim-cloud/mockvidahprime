-- Permite ao admin criar salas novas (id automático) e ajustar configurações.

-- id automático para novas salas (mantém os ids atuais 1..6)
create sequence if not exists public.rooms_id_seq;
select setval('public.rooms_id_seq', coalesce((select max(id) from public.rooms), 0) + 1, false);
alter table public.rooms alter column id set default nextval('public.rooms_id_seq');
alter sequence public.rooms_id_seq owned by public.rooms.id;

-- protege a tabela settings (estava sem RLS): leitura autenticada, escrita só admin
alter table public.settings enable row level security;
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select using (auth.uid() is not null);
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all
  using (public.is_admin()) with check (public.is_admin());
