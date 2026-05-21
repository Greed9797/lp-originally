# Originally Store - contexto para continuar

## Projeto

- App: `originally-store`
- Stack: Next.js App Router, Supabase Auth/Postgres/Storage e Vercel
- Venda: somente WhatsApp por enquanto, sem carrinho e sem checkout
- Porta local usada: `http://localhost:3137`

## Rodar localmente

```bash
cd "/Users/vitormiguelgoedertdaluz/Documents/Landing pages /originally-store"
npm install
cp .env.example .env.local
npm run dev -- --port 3137
```

Preencha `.env.local` com as credenciais reais do Supabase e WhatsApp. Nunca commitar `.env.local`.

## Variaveis esperadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3137
ADMIN_EMAIL=
ADMIN_PASSWORD=
WHATSAPP_NUMBER=
WHATSAPP_DEFAULT_MESSAGE=
```

## Rotas publicas

- `/` landing principal
- `/produto/[slug]` pagina publica de produto
- `/categoria/[slug]` pagina publica de categoria

## Rotas admin

- `/admin/login`
- `/admin`
- `/admin/produtos`
- `/admin/produtos/novo`
- `/admin/produtos/[id]`
- `/admin/categorias`
- `/admin/vitrines`
- `/admin/configuracoes`

## Supabase

Migration principal:

```txt
supabase/migrations/001_initial_schema.sql
```

Tabelas esperadas:

- `admin_profiles`
- `categories`
- `products`
- `product_images`
- `product_variants`
- `home_slots`
- `site_settings`

Bucket esperado:

- `product-images`

Se a API retornar `PGRST205`, rode no SQL Editor do Supabase:

```sql
NOTIFY pgrst, 'reload schema';
```

Se continuar, confirme se a migration foi aplicada no projeto correto, se as tabelas estao no schema `public` e se o schema `public` esta exposto na Data API.

## Verificacao tecnica

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e -- --project=chromium
```

Observacao: o Playwright sobe o servidor na porta `3137`; se ja houver um `next dev` rodando nessa porta, pare o servidor antes do E2E.

## Estado conhecido

- Landing publica, categoria e pagina de produto possuem fallback visual quando o Supabase falha.
- Fluxo admin depende do Supabase real estar com tabelas visiveis via PostgREST.
- Upload de imagem exige admin autenticado e limita produto a 12 imagens.
- Antes de producao, rotacione credenciais que tenham sido compartilhadas fora do ambiente seguro.
