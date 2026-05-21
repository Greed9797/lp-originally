# Supabase setup

1. Crie um projeto Supabase.
2. Rode, em ordem, estes arquivos no SQL Editor:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/20260521184603_add_originally_import_metadata.sql
```
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

6. Depois de aplicar migrations ou criar tabelas pelo SQL Editor, rode:

```sql
NOTIFY pgrst, 'reload schema';
```

7. Para capturar o catalogo da Originally e gerar artefatos locais:

```bash
npm run import:originally
```

8. Para importar o catalogo normalizado para Supabase e subir imagens para Storage:

```bash
npm run import:originally:supabase
```

Produtos importados sem preco ficam como `draft` para revisao no admin antes de aparecerem no publico.
