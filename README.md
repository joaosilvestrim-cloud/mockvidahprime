# Vidah Prime

Sistema de reservas do coworking **Vidah Prime** (saúde, bem-estar e estética · Sorocaba/SP).

Stack: **Next.js 14** (App Router, SSR/SEO) + **Supabase** (Postgres, Auth, RLS, Storage).

## Rodar localmente

```bash
npm install
npm run dev          # http://localhost:3000
```

Precisa de um `.env.local` (não versionado) com:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...        # só servidor
PGHOST=... PGPORT=5432 PGDATABASE=postgres PGUSER=postgres PGPASSWORD=...
```

As variáveis públicas (`NEXT_PUBLIC_*`) também ficam em `.env.production` (versionado, seguras por RLS).

## Banco de dados

```bash
npm run db:apply supabase/migrations/0001_init.sql
npm run db:apply supabase/migrations/0002_seed_rooms.sql
npm run db:admin        # cria o usuário admin
```

Testes de integração contra o banco real: `node scripts/e2e.js`.

## Deploy (Vercel)

O projeto builda sozinho no Vercel a partir da `main`. As variáveis públicas vêm do `.env.production`.
**Adicione no Vercel** apenas a variável de servidor `SUPABASE_SERVICE_ROLE_KEY` (necessária para o cadastro de novos profissionais).

## Estrutura

- `app/` — páginas (landing, /entrar, /cadastro, /conta, /reservar, /admin) e rotas de API
- `components/` — UI (marca, Landing, Onboarding, Booking, Conta, Admin, Chat)
- `lib/` — clientes Supabase e conteúdo
- `supabase/migrations/` — schema e seed
- `_prototype/` — protótipo estático original (referência)
