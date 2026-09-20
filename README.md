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
5. Antes de abrir para o público, ligue a **confirmação de e-mail** em *Authentication → Sign In / Providers →
   Email → Confirm email* (durante o desenvolvimento ela fica desligada, só para testes).

> **Sobre CORS:** a API do Supabase responde a qualquer origem e não permite restringir por domínio; a proteção
> vem da RLS, do Site/Redirect URL do Auth e da CSP acima.

## Moderação (admin)

Banir e desbanir têm uma tela interna; o resto da moderação é feito direto no banco.

### Banir e desbanir pela interface

Quem tem `permission_level = 'admin'` vê, em **Perfil → Administração → Gerenciar usuários**
(`/app/admin/users`), o botão **Banir** (com confirmação) ou **Desbanir** em cada linha. Admins não podem ser
banidos. Quem não é admin não vê o link e, se abrir a URL direto, é redirecionado.

Como achar quem banir:

- **Fila de denúncias (tela inicial):** só usuários ativos com denúncia pendente, do mais recentemente
  denunciado para o mais antigo. "N denúncias pendentes" abre categoria, texto, data e quem denunciou.
- **Busca:** por **trecho do username** (Riot ID completo, único no banco; mínimo 3 caracteres) ou por
  **e-mail exato**. A busca substitui a fila e procura em todos, banidos inclusive. Abas `Ativos | Banidos | Todos`
  e o chip "Só com denúncias pendentes" refinam a lista.
- Cada linha e a confirmação de banimento também mostram o **id curto** (`#8d4f3adb`), função, rank, agente e
  data de cadastro — referência estável, independente do username, útil em suporte/auditoria.

Detalhes técnicos:

- A tela só chama as RPCs `fn_admin_list_users`, `fn_admin_get_user_reports`, `fn_admin_ban_user` e
  `fn_admin_unban_user` (SECURITY DEFINER, exigem admin ativo, `EXECUTE` só para `authenticated`). O client nunca
  faz update em `profiles`.
- A listagem é uma RPC porque a RLS de `profiles` esconde os banidos até do admin. O e-mail só é devolvido na
  busca por e-mail exata.
- **Banir marca como revisadas** as denúncias pendentes contra o banido (o modal avisa quantas), então ele sai da
  fila e, se for desbanido, as denúncias antigas não voltam; uma denúncia nova contra ele entra na fila normalmente.
  Desbanir não mexe em denúncias. Ignorar uma denúncia sem banir, e o banimento feito à mão pelo SQL, continuam
  manuais: use o `update reports set status = 'reviewed'` abaixo.
- A promoção a admin, a revisão de denúncias e a reversão de bloqueio por denúncia continuam manuais
  (abaixo). Não há chat de admin: quem quiser contestar um banimento procura o suporte fora do app.

## Moderação manual (SQL Editor)

O restante é feito pelo **SQL Editor do Supabase** (Dashboard → SQL Editor), que executa com a service role:

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

### Banir (alternativa manual)

O caminho normal é a tela acima; o SQL abaixo continua valendo, mas **não** marca as denúncias do banido como
revisadas (só a tela faz isso).

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

### Reverter um banimento (alternativa manual)

```sql
update profiles
set status = 'active', banned_by = null, banned_at = null
where id = '<uuid>';
```

A tela de bloqueio libera o acesso sozinha quando a aba volta ao foco, ou no próximo login (vale para o
desbanimento feito pela tela e pelo SQL).

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
