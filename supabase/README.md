# Supabase setup

1. Crie um projeto Supabase.
2. Rode `supabase/migrations/001_initial_schema.sql` no SQL Editor.
3. Crie seu usuario em Authentication.
4. Insira o usuario em `admin_profiles`:

```sql
insert into public.admin_profiles (id, email, role, active)
select id, email, 'admin', true
from auth.users
where email = 'seu-email@dominio.com';
```

5. Configure no Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```
