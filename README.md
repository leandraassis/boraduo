# BoraDuo

App web de descoberta de teammates para Valorant: swipe, lista "Disponíveis agora" para contato
imediato, chat e notificações. Mobile-first, sem integrações externas.

**Stack:** React + Vite (CSR) + TypeScript + Tailwind + Supabase (Postgres, RLS, Auth, Realtime).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

- Só a **anon key** entra no `.env`. A service role key nunca vai para o frontend nem para o repositório.
- O schema, as policies (RLS) e as funções RPC estão versionados em [`supabase/migrations`](supabase/migrations).
- `npm run build` gera o bundle de produção e `npm run lint` roda o ESLint.

## Deploy (Vercel + Supabase)

O app é uma SPA estática (Vite). O [`vercel.json`](vercel.json) já traz o que a Vercel precisa:

- **Rewrite para `index.html`:** sem ele, atualizar a página em `/app/matches` ou abrir um link direto
  devolve 404.
- **Cabeçalhos de segurança:** CSP estrita (`script-src 'self'`; conexões só com o próprio domínio e
  `*.supabase.co`, incluindo o WebSocket do Realtime), `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy` e `Permissions-Policy`. Testado com o build de produção, sem violações. Se um dia o app
  passar a carregar algo de outro domínio (analytics, fontes externas), a CSP precisa ser ajustada.

Passo a passo:

1. Importe o repositório na Vercel (framework **Vite**; build `npm run build`, saída `dist`).
2. Em *Settings → Environment Variables*, cadastre **`VITE_SUPABASE_URL`** e **`VITE_SUPABASE_ANON_KEY`** para
   *Production* e *Preview*. Só a anon key entra aqui; **nunca** a service role key. As variáveis são embutidas no
   build, então mudar o valor exige um novo deploy.
3. No Supabase, em *Authentication → URL Configuration*, defina o **Site URL** com o domínio de produção e
   liste em **Redirect URLs** apenas os domínios reais (produção e, se usar, o de preview da Vercel).
4. Aplique as migrations de [`supabase/migrations`](supabase/migrations) em ordem, se o projeto for novo.
5. Confira a checklist de [`docs/checklist-seguranca.md`](docs/checklist-seguranca.md), principalmente a seção
   **Configuração manual**: a **confirmação de e-mail precisa estar ligada** antes de abrir para o público.

> **Sobre CORS:** a API do Supabase responde a qualquer origem e não permite restringir por domínio; a proteção
> vem da RLS, do Site/Redirect URL do Auth e da CSP acima (detalhes em `docs/checklist-seguranca.md`).

## Moderação (admin)

O MVP **não tem painel de administração**. Toda ação de moderação é feita direto no banco, pelo
**SQL Editor do Supabase** (Dashboard → SQL Editor), que executa com a service role. Isso é intencional:

- Nenhuma dessas ações passa pelo client. Um trigger (`fn_protect_profile_privileged_columns`) rejeita
  qualquer mudança de `permission_level`, `status`, `banned_by` e `banned_at` feita por quem não é admin,
  então um usuário comum não consegue se promover nem se desbanir por chamada REST.
- Não rode esses comandos com a anon key nem a partir do app.

Para achar os ids usados abaixo:

```sql
-- id de um usuário pelo username
select id, username, status, permission_level from profiles where username = '<username>';

-- admins atuais (o id de um deles vai em banned_by)
select id, username from profiles where permission_level = 'admin';
```

### Promover um usuário a admin

```sql
update profiles set permission_level = 'admin' where id = '<uuid>';
```

### Banir

```sql
update profiles
set status = 'banned', banned_by = '<admin_uuid>', banned_at = now()
where id = '<uuid>';
```

Efeito imediato para a conta banida (aplicado pela RLS, não pela interface):

- perde acesso à descoberta (swipe e "Disponíveis agora"), às conversas (inclusive o histórico), às
  notificações e à presença Realtime, e não consegue denunciar, bloquear nem criar matches;
- só consegue ler o próprio perfil, e é isso que faz o app trocar toda a navegação pela tela de
  bloqueio total (o app percebe o banimento a cada navegação e quando a aba volta ao foco);
- para quem **não** está banido, a conversa continua visível como histórico somente leitura.

### Reverter um banimento

```sql
update profiles
set status = 'active', banned_by = null, banned_at = null
where id = '<uuid>';
```

A tela de bloqueio libera o acesso sozinha quando a aba volta ao foco, ou no próximo login.

### Revisar a fila de denúncias

```sql
select * from reports where status = 'pending' order by created_at;
```

Com os usernames de quem denunciou e de quem foi denunciado:

```sql
select r.id, r.created_at, r.category, r.details,
       rep.username as denunciante,
       tgt.username as denunciado, tgt.status as status_do_denunciado
from reports r
join profiles rep on rep.id = r.reporter_id
join profiles tgt on tgt.id = r.reported_id
where r.status = 'pending'
order by r.created_at;
```

Depois de decidir (banir o denunciado, ignorar, etc.), marque a denúncia como revisada:

```sql
update reports set status = 'reviewed' where id = '<report_uuid>';
```

### Desfazer o bloqueio criado por uma denúncia

Toda denúncia bloqueia o denunciado para o denunciante. Esse bloqueio **não** pode ser removido pelo
usuário, só pela moderação:

```sql
delete from blocks where report_id = '<report_uuid>';
```

Bloqueios voluntários (sem denúncia) são do próprio usuário: ele desfaz em Perfil → Usuários bloqueados.
