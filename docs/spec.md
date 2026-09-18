# Spec — BoraDuo (App de Match de Teammates para Valorant)

## 1. Visão geral

App de descoberta de teammates para Valorant com mecânica de swipe (estilo Tinder).
Dois caminhos de descoberta coexistem:

1. **Swipe assíncrono**: usuário curte/rejeita perfis; curtida mútua vira match.
2. **Disponíveis agora**: lista filtrada de jogadores disponíveis agora, sem depender
   de swipe prévio. Contato aqui é via **quick match**, não exige reciprocidade.

Escopo do MVP: apenas Valorant, rank autodeclarado, sem curadoria automática de
conteúdo, sem ferramentas de moderação além de denúncia/bloqueio simples e banimento
administrativo direto no Supabase (sem painel dedicado — ver seção 8).

Web app, mobile-first. Sem integrações externas; notificações apenas in-app,
persistidas até o usuário abrir o app (sem push nativo, sem e-mail).

## 2. Stack

- **Frontend**: React + Vite, **CSR (sem SSR)** — decisão baseada no conteúdo em si
  (quase tudo privado/autenticado e dinâmico via Realtime, então SSR não traz ganho
  de SEO nem de performance percebida relevante).
- **Backend/DB/Auth/Realtime**: Supabase (Postgres + RLS + Auth + Realtime Presence)
- **Autenticação**: Supabase Auth, provider único de email/senha. Sem Discord OAuth
  no MVP (avaliar como provider adicional depois, não bloqueante).
- **Deploy**: Vercel (build estático do Vite/SPA). HTTPS e domínio com TLS
  automáticos — não precisa de configuração manual de certificado.
- **Conexão de desenvolvimento com o Supabase**: o projeto Supabase é criado
  previamente (antes da implementação), e o **Claude Code se conecta a ele via
  MCP** (Model Context Protocol) — aplica migrations, cria tabelas/RLS e consulta o
  schema diretamente durante a implementação, em vez de SQL colado manualmente no
  dashboard. Não substitui o `@supabase/supabase-js` no código da aplicação em
  runtime — o MCP é usado só durante o desenvolvimento/setup do banco.

## 3. Modelo de dados

### 3.1 `profiles`
Estende `auth.users` (relação 1:1 por `id`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK, FK → auth.users) | |
| `username` | text | |
| `avatar_url` | text, nullable | Avatar opcional, não obrigatório |
| `bio` | varchar(50), nullable | Limite de ~50 caracteres |
| `role` | enum | Função no jogo: `duelist \| sentinel \| controller \| initiator`. Não confundir com `permission_level` |
| `main_agent` | text | Personagem mais jogado |
| `rank` | enum | Tier único, sem subdivisão: `iron \| bronze \| silver \| gold \| platinum \| diamond \| ascendant \| immortal \| radiant`. Autodeclarado |
| `availability_schedule` | text, nullable | Informativo. Não filtra "Disponíveis agora". Pode opcionalmente ser usado como filtro no swipe |
| `is_available` | boolean, default false | Flag de intenção "agora", independente da conexão real |
| `permission_level` | enum, default `user` | `user \| admin`. Sem nível `moderator` no MVP |
| `status` | enum, default `active` | `active \| banned` (suspensão temporária fora do MVP) |
| `banned_by` | uuid, nullable, FK → profiles | Auditoria de quem baniu |
| `banned_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |

**Regra de desconexão**: `is_available` (intenção, persistida) e presença real
(Supabase Presence) são independentes — desconectar não zera `is_available`
automaticamente; só o usuário desliga a flag.

**Regra de banimento**: `status = banned` congela a conta por completo — descoberta,
chats (inclusive históricos), presença e novas denúncias/bloqueios.

### 3.2 `swipes`
Registra decisões de swipe (like/pass). Likes recebidos não são visíveis para quem
recebeu antes do match mútuo (padrão Tinder).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `swiper_id` | uuid, FK → profiles | |
| `swiped_id` | uuid, FK → profiles | |
| `liked` | boolean | |
| `created_at` | timestamptz | |

Constraint: `unique(swiper_id, swiped_id)`.

**Concorrência**: likes recíprocos quase simultâneos — par normalizado + constraint
única em `matches` (3.3) + `insert ... on conflict do nothing` tornam a criação do
match idempotente.

RLS: usuário só lê linhas onde ele é `swiper_id`.

### 3.3 `matches`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `user_a_id` | uuid, FK → profiles | Par normalizado: sempre `user_a_id < user_b_id` |
| `user_b_id` | uuid, FK → profiles | |
| `origin` | enum | `swipe \| quick_start` |
| `last_message_at` | timestamptz | **Desnormalizado**, atualizado via trigger a cada `insert` em `messages`. Usado para ordenar a lista de conversas por atividade recente |
| `created_at` | timestamptz | |

Constraint: `unique(user_a_id, user_b_id)`.

No MVP, toda linha em `matches` é implicitamente confirmada (sem estado "pendente").

**Importante**: o swipe deck exclui qualquer usuário que já tenha uma linha em
`matches` com o usuário atual, independente da origem.

### 3.4 `match_reads`
Indicador de mensagem não lida, por usuário, por match. **Tabela separada** em vez de
colunas duplicadas por usuário em `matches` — mantém o padrão já usado pelo resto do
schema ("linha por participante" em vez de colunas espelhadas, como em `swipes`).

| Campo | Tipo | Notas |
|---|---|---|
| `match_id` | uuid, FK → matches | |
| `user_id` | uuid, FK → profiles | |
| `last_read_at` | timestamptz | |

PK composta `(match_id, user_id)`. Mensagem não lida = existe `messages` desse match
com `created_at > match_reads.last_read_at` (ou não existe linha ainda = tudo não lido).

### 3.5 `messages`
Chat normal, vinculado a um match.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `match_id` | uuid, FK → matches | |
| `sender_id` | uuid, FK → profiles | |
| `content` | text | |
| `created_at` | timestamptz | |

Acesso: leitura permitida se existe match correspondente (histórico preservado mesmo
com bloqueio ativo ou banimento). Escrita bloqueada se há bloqueio ativo entre o par
ou se qualquer um dos dois usuários tem `status != active` — conversa vira somente
leitura para ambos.

### 3.6 `reports`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `reporter_id` | uuid, FK → profiles | |
| `reported_id` | uuid, FK → profiles | |
| `category` | enum | `toxic_behavior \| cheating \| fake_profile \| harassment \| other` |
| `details` | text, nullable | Texto livre complementar |
| `status` | enum, default `pending` | `pending \| reviewed` |
| `created_at` | timestamptz | |

Sem moderação automática — toda denúncia fica pendente até revisão manual por admin.

### 3.7 `blocks`
Bloqueio entre dois usuários — por denúncia (automático) ou voluntário. Uma única
linha por par normalizado, lida nos dois sentidos pela RLS.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `user_a_id` | uuid, FK → profiles | Par normalizado |
| `user_b_id` | uuid, FK → profiles | |
| `report_id` | uuid, nullable, FK → reports | Presente se originado de denúncia |
| `created_at` | timestamptz | |

Constraint: `unique(user_a_id, user_b_id)`.

Efeito: os dois usuários deixam de aparecer um para o outro; conversa existente vira
somente leitura.

**Reversão**: `report_id` presente → só `permission_level = admin` remove.
`report_id` nulo (voluntário) → o próprio usuário que bloqueou remove quando quiser.

### 3.8 `notifications`
Central de notificações — persistente, visível mesmo se o usuário não estava online
no momento do evento. Único canal de notificação do MVP (sem push/e-mail).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid, FK → profiles | Destinatário |
| `type` | enum | `match` (mais tipos podem ser adicionados depois) |
| `ref_id` | uuid, nullable | Referência ao registro relacionado |
| `read` | boolean, default false | |
| `created_at` | timestamptz | |

### 3.9 Estado local (fora do banco)
`seen_availability_warning`: flag do modal de aviso "Estou disponível" — persistida
em **localStorage**, não no banco. Decisão explícita: é cosmética, não precisa
sobreviver a troca de dispositivo nem ser auditável.

## 4. Fluxos principais

### 4.1 Swipe → Match
1. Usuário dá like/pass em `swipes`.
2. Se like recíproco, cria-se linha em `matches` (`origin = swipe`) via
   `insert ... on conflict do nothing` sobre o par normalizado.
3. Cria-se notificação (`type = match`) para os dois usuários.
4. Chat liberado automaticamente pela RLS.
5. Se o usuário está na tela Discover no momento do match, modal fullscreen "É um
   match!" dispara via Realtime (ver nota técnica na seção 7). Se offline/fora da
   tela, sem modal retroativo — só notificação normal.

### 4.2 Disponíveis agora → Quick match
1. Lista mostra perfis com `is_available = true` **e** presença ativa (Realtime)
   simultaneamente. Se a conexão cair, o perfil some da lista mesmo com a flag ainda
   `true` no banco.
2. Filtros: função (`role`) e rank (faixa). **Não** inclui horário (exclusivo do swipe).
3. Primeira ativação do toggle "Estou disponível": modal de aviso obrigatório —
   "Qualquer jogador disponível pode te chamar direto, sem pedir aceite antes." CTA
   único de confirmação ("Entendi"), sem "cancelar" de mesmo peso visual. Não repete
   após a primeira vez (`seen_availability_warning` em localStorage).
4. Clique num perfil cria diretamente `matches` (`origin = quick_start`), sem exigir
   reciprocidade. Confirmação sóbria (toast "Chat iniciado com [nome]"), não modal
   de celebração.
5. Chat libera imediatamente, mesma RLS do fluxo normal.
6. Paginação por cursor/keyset (não offset), por ser lista em tempo real via Presence.

### 4.3 Denúncia e bloqueio
1. Usuário denuncia → insere em `reports` (`category`, `details` opcional,
   `status = pending`).
2. Insere automaticamente em `blocks` (linha única, par normalizado) com `report_id`
   preenchido.
3. Denunciado some das listas para o denunciante e vice-versa; chat existente vira
   somente leitura.
4. Admin revisa a fila de `reports` (`status = pending`) e decide ação diretamente no
   Supabase no MVP.

### 4.4 Bloqueio voluntário (sem denúncia)
1. Usuário bloqueia diretamente, sem passar por `reports`.
2. Insere em `blocks` sem `report_id`.
3. Mesmo efeito do bloqueio por denúncia, mas o próprio usuário pode reverter quando
   quiser.

### 4.5 Banimento
1. Admin altera `profiles.status` para `banned`, preenchendo `banned_by`/`banned_at`.
2. RLS geral nega, para quem tem `status != active`: descoberta, leitura/escrita em
   `messages` (inclusive histórico antigo), presença Realtime, inserts em `reports`
   e `blocks`.
3. O usuário banido pode ler o próprio perfil (`profiles`) — necessário para o
   frontend detectar o banimento e exibir a tela de bloqueio total. É a única leitura
   permitida a uma conta banida.
4. Do lado de quem não está banido: continua enxergando o histórico do chat
   (read-only), só não recebe mensagens novas.
5. Reversão: admin volta `status` para `active`.

## 5. RLS — policies principais

- **`profiles` (leitura da própria linha)**: sempre permitida, banido ou não —
  necessária para o app detectar `status = banned` e exibir a tela de bloqueio total.
- **`profiles` (leitura de outros perfis, swipe/Disponíveis agora)**: exige
  `status = active` de ambos os lados (usuário logado e candidato); exclusões de
  swipes/matches/blocks e filtros aplicados na query da aplicação.
- **`profiles` (update da própria linha)**: usuário pode atualizar username, avatar_url,
  bio, role, main_agent, rank, availability_schedule, is_available — **mas não**
  permission_level, status, banned_by, banned_at. Ver seção 8.1 sobre por que isso
  precisa de um trigger, não só da policy.
- **`swipes` (insert)**: só o próprio usuário como `swiper_id`; ambos `status = active`.
- **`swipes` (select)**: usuário só vê as próprias linhas como `swiper_id`.
- **`matches` (select)**: usuário só vê matches onde é `user_a_id` ou `user_b_id`.
- **`matches` (insert)**: **sem policy de insert direto pelo client.** Criação de match
  (por swipe recíproco ou por quick_start) passa por função `SECURITY DEFINER` (RPC),
  nunca por insert cru do frontend. Ver seção 8.2.
- **`match_reads`**: usuário só acessa as próprias linhas.
- **`messages` (select)**: permitido se existe match correspondente (histórico
  preservado mesmo com bloqueio ativo ou banimento).
- **`messages` (insert)**: permitido apenas com match confirmado, sem bloqueio ativo
  e ambos `status = active`.
- **`notifications`**: usuário só lê/atualiza as próprias.
- **`reports` (insert)**: qualquer usuário `status = active`; select restrito a admin.
- **`blocks` (select)**: usuário só vê linhas onde é `user_a_id` ou `user_b_id` — sem
  isso, a query de descoberta não consegue nem excluir bloqueados da própria lista.
- **`blocks` (insert)**: **sem policy de insert direto pelo client** — bloqueio
  (voluntário ou por denúncia) também passa por função `SECURITY DEFINER`. Ver 8.2.
- **`blocks` (delete)**: `report_id IS NULL` → quem criou o bloqueio; `report_id IS
  NOT NULL` → só admin.
- **Alteração de `profiles.status` e `permission_level`**: update restrito a admin
  (reforçado pelo trigger da seção 8.1, não só pela policy).

## 6. Navegação e telas

Bottom nav com 4 destinos + telas/modais secundários:

```
[ Discover ]  [ Matches ]  [ Notificações ]  [ Perfil ]
```

Telas fora da bottom nav: Onboarding (pré-login), Chat individual (a partir de
Matches), Report/Block (modal), Tela de bloqueio total (usuário banido).

**Indicador de disponibilidade**: como `is_available` é global (persiste entre
telas), um dot discreto fixo no header/bottom nav sinaliza quando ativo, mesmo fora
da tela Discover.

### 6.1 Onboarding
Sequência curta, uma decisão por tela, com indicador de progresso:

| Passo | Tela | Campos | Nota de UX |
|---|---|---|---|
| 1 | Cadastro | Email, senha | Validação inline |
| 2 | Identidade | Username, avatar (opcional) | Avatar pulável |
| 3 | Perfil de jogo | Role, main agent, rank | Rank como seletor visual de ícones, não dropdown |
| 4 | Bio (opcional) | Bio (até 50 char) | Contador de caracteres; pulável |

Responsivo: em telas largas, card centralizado com largura máxima (~480px).

### 6.2 Discover (tela inicial)
Segmented control no topo: **Swipe ⇄ Disponíveis agora**.

**Modo Swipe:**
- Card único visível por vez (próximo levemente visível atrás)
- Avatar, username, role, rank, main agent, bio
- Gesto de swipe **e** botões explícitos de like/pass (obrigatórios — desktop sem
  touch e acessibilidade)
- Ícone de filtro (funil) no header, ao lado do segmented control, com badge/dot
  quando há filtro não-default. Abre **bottom sheet** (mobile) / **popover**
  (desktop) com: chips de role (múltipla escolha), range slider duplo de rank,
  toggle "Usar meu horário como filtro" (off por padrão). CTAs "Limpar filtros" e
  "Aplicar" no rodapé — sem aplicar filtro a cada toque.
- Estado vazio ilustrado ("Sem mais perfis... ajuste seus filtros"), com CTA que
  abre o mesmo sheet de filtros
- Modal "É um match!": fullscreen, avatares dos dois, CTAs "Enviar mensagem" e
  "Continuar vendo perfis"

**Modo Disponíveis agora:**
- Lista (não cards): avatar, username, role, rank, botão de ação direto ("Chamar")
- Filtros no topo: role e rank (faixa) — sem horário
- Paginação por cursor/keyset
- Modal de aviso na primeira ativação do toggle
- Clique num perfil → toast sóbrio "Chat iniciado com [nome]", navega ao chat
- Estado vazio: "Ninguém disponível agora com esses filtros"

**Responsividade**: mobile — card ocupa a maior parte da viewport, botões fixos na
área segura. Tablet/desktop — card centralizado, largura máxima ~400-440px, nunca
esticado. Lista de "Disponíveis agora" naturalmente responsiva, com largura máxima
em telas largas.

### 6.3 Matches / Chats
- Lista de conversas ordenada por `matches.last_message_at`
- Cada item: avatar, nome, prévia da última mensagem, timestamp, indicador de não
  lida (via `match_reads`), badge discreto de origem (swipe/quick_start)
- Conversas somente-leitura: opacidade reduzida no item; dentro do chat, campo de
  digitação substituído por faixa informativa ("Esta conversa não está mais ativa")

**Chat individual:**
- Header: avatar, nome, role/rank do outro usuário
- Bolhas diferenciadas por remetente, com timestamp
- Bloquear/denunciar acessível pelo header (menu de opções)
- Desktop: layout de duas colunas (lista + chat aberto). Mobile: navegação
  full-screen (uma tela por vez)

### 6.4 Notificações
- Lista cronológica, mais recente primeiro
- Tipo `match`: avatar + "Novo match com [nome]" + timestamp, tap leva ao chat
- Badge de contagem não lida no ícone da bottom nav
- Marcar como lida ao tocar no item individual
- Estado vazio: "Nenhuma notificação ainda"

### 6.5 Perfil / Configurações
- Visualização do próprio perfil (mesmo formato do card de swipe)
- Edição: username, avatar, bio, role, main_agent, rank, availability_schedule
- Toggle "Estou disponível" também disponível aqui (redundância intencional)
- Logout

### 6.6 Estados globais
- **Loading**: skeleton screens (não spinner genérico) em toda tela de lista
- **Erro de rede**: mensagem clara + ação de retry
- **Usuário banido**: tela de bloqueio total substitui toda a navegação, informando
  o status ao próprio usuário (RLS garante leitura do próprio perfil mesmo banido)

### 6.7 Responsividade — breakpoints

| Faixa | Comportamento |
|---|---|
| < 640px (mobile) | Uma tela por vez, bottom nav, card de swipe ocupando a viewport |
| 640–1024px (tablet) | Conteúdo centralizado, largura máxima, bottom nav mantida |
| > 1024px (desktop) | Navegação lateral em vez de bottom nav, duas colunas no chat, card centralizado com largura fixa |

Não é prioridade otimizar profundamente desktop — o produto é mobile-first por
natureza; responsividade aqui significa "não quebra e permanece usável".

## 7. Nota técnica de implementação — Realtime de matches

O Supabase Realtime (`postgres_changes`) **não suporta filtro `OR` entre duas
colunas** numa única subscription. Para detectar matches em tempo real (disparo do
modal "É um match!"), é necessário abrir **duas subscriptions** na tabela `matches`
— uma com `user_a_id=eq.<meu_id>`, outra com `user_b_id=eq.<meu_id>` — mesclando os
eventos no client.

## 8. Segurança

Segurança é tratada como requisito de primeira classe, não como revisão posterior.
Pontos abaixo são específicos deste sistema (não uma lista genérica de checklist).

### 8.1 Escalonamento de privilégio via update de `profiles`
RLS por si só não faz restrição por coluna — uma policy `update using (id =
auth.uid())` sem mais nada permitiria o próprio usuário setar `permission_level =
'admin'`, `status = 'active'` (se banido) ou forjar `banned_by`/`banned_at` via
chamada REST direta ao Supabase, mesmo que a UI nunca exponha esses campos. É
necessário um **trigger `BEFORE UPDATE`** que rejeita qualquer mudança nessas quatro
colunas a menos que quem está executando já seja admin:

```sql
create or replace function fn_protect_profile_privileged_columns()
returns trigger as $$
begin
  if (select permission_level from profiles where id = auth.uid()) <> 'admin' then
    if new.permission_level is distinct from old.permission_level
       or new.status is distinct from old.status
       or new.banned_by is distinct from old.banned_by
       or new.banned_at is distinct from old.banned_at then
      raise exception 'not authorized to change privileged fields';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_protect_profile_privileged_columns
before update on profiles
for each row execute function fn_protect_profile_privileged_columns();
```

### 8.2 Criação de `matches` e `blocks` não pode ser insert cru do client
Se a criação de match ou bloqueio fosse um simples `insert` liberado por RLS, um
usuário malicioso poderia, via chamada direta à API REST do Supabase (contornando a
UI): criar match com qualquer pessoa sem reciprocidade real, criar match com um
usuário banido ou bloqueado, ou inserir um "bloqueio" fraudulento em nome de outra
pessoa. A defesa é **não ter policy de insert nessas tabelas** e expor a operação só
por função `SECURITY DEFINER` (RPC), que valida as regras de negócio server-side
antes de gravar:

```sql
create or replace function fn_create_match_from_swipe(p_swiped_id uuid)
returns void as $$
declare
  v_a uuid; v_b uuid; v_reciprocal boolean;
begin
  if (select status from profiles where id = auth.uid()) <> 'active'
     or (select status from profiles where id = p_swiped_id) <> 'active' then
    raise exception 'inactive account';
  end if;

  insert into swipes(swiper_id, swiped_id, liked)
  values (auth.uid(), p_swiped_id, true)
  on conflict (swiper_id, swiped_id) do update set liked = true;

  select exists(
    select 1 from swipes
    where swiper_id = p_swiped_id and swiped_id = auth.uid() and liked = true
  ) into v_reciprocal;

  if v_reciprocal then
    v_a := least(auth.uid(), p_swiped_id);
    v_b := greatest(auth.uid(), p_swiped_id);
    insert into matches(user_a_id, user_b_id, origin)
    values (v_a, v_b, 'swipe')
    on conflict (user_a_id, user_b_id) do nothing;
  end if;
end;
$$ language plpgsql security definer;
```

A mesma lógica (função `SECURITY DEFINER`, checando `status`, ausência de bloqueio
mútuo e `is_available` + presença real antes de gravar) vale para `quick_start` e
para a criação de `blocks` a partir de uma denúncia. O Claude Code deve implementar
todas as escritas sensíveis (match, bloqueio, banimento) como funções RPC — nunca
como insert/update direto exposto ao client.

### 8.3 Realtime e RLS
O Supabase Realtime só respeita RLS em `postgres_changes` se a replicação estiver
configurada corretamente por tabela. É preciso confirmar explicitamente que as
subscriptions em `matches`, `messages` e `notifications` estão sujeitas às mesmas
policies de select — do contrário, um evento pode vazar dados de outro usuário pelo
canal Realtime mesmo que a query REST equivalente estivesse protegida.

### 8.4 Presence não é fonte de verdade para autorização
Payloads de `track()` no canal de Presence são definidos pelo próprio client e podem
ser adulterados. Presence deve ser usado só para exibir "está online agora" na lista
de Disponíveis agora — nunca para decidir permissão de leitura/escrita. Toda
autorização real continua vindo de RLS/RPC, não do payload de presença.

### 8.5 Chaves e segredos
- A **anon key** do Supabase é pública por design (protegida pela RLS) — pode ir no
  bundle do frontend normalmente.
- A **service role key** (que ignora RLS) **nunca** entra no código da aplicação nem
  no bundle do frontend — uso restrito a scripts server-side/admin, fora do runtime
  do app. Mesmo durante o setup via MCP, garantir que credenciais de acesso ao
  projeto não fiquem versionadas no repositório (`.env` no `.gitignore`).

### 8.6 Upload de avatar
- Bucket de storage com policy restringindo upload/update/delete ao próprio usuário
  (path prefixado por `user_id`), não um bucket com escrita aberta a qualquer
  autenticado.
- Validar tipo de arquivo (apenas image/png, image/jpeg, image/webp) e tamanho
  máximo no client **e** via policy/constraint no bucket — nunca confiar só na
  validação client-side.
- Não aceitar upload de SVG sem sanitização (SVG pode carregar `<script>` embutido —
  risco de XSS se o arquivo for servido com o content-type errado ou renderizado
  inline).

### 8.7 Conteúdo gerado por usuário (bio, username, mensagens)
- React escapa JSX por padrão — não usar `dangerouslySetInnerHTML` em nenhum ponto
  que renderize bio, username ou conteúdo de mensagens.
- Mesmo assim, sanitizar/validar no insert (tamanho máximo já garantido por
  `varchar(50)` na bio; aplicar limite equivalente em `messages.content` a nível de
  aplicação e, idealmente, por `check constraint` no banco).

### 8.8 Abuso e limitação de taxa
RLS não limita volume — nada impede, hoje, que uma conta envie milhares de swipes,
mensagens ou denúncias por segundo. Para o MVP, o mínimo recomendado:
- Rate limiting nativo do Supabase Auth (proteção de força bruta em login/signup) —
  habilitar nas configurações do projeto.
- Rate limiting a nível de aplicação (ou Edge Function) para envio de mensagens e
  denúncias, mesmo que simples (ex: N mensagens por minuto por usuário), para evitar
  flood de chat e denúncias em massa.

### 8.9 Evasão de banimento
Fora de escopo do MVP: nada impede um usuário banido de criar uma nova conta com
outro e-mail. Verificação de identidade/dispositivo para prevenir isso é um
trade-off de custo x benefício que não faz sentido pro prazo de 2-3 dias — registrado
aqui como risco aceito conscientemente, não como omissão.

### 8.10 Infraestrutura
- HTTPS e certificado TLS gerenciados automaticamente pela Vercel — sem
  configuração manual.
- Manter dependências do frontend atualizadas (`npm audit` ou Dependabot) — SPA
  estático não tem servidor próprio pra corrigir, mas uma dependência JS vulnerável
  ainda é superfície de ataque (XSS via lib comprometida, por exemplo).
- Confirmar CORS do projeto Supabase restrito ao(s) domínio(s) real(is) do app
  (incluindo o domínio de preview da Vercel, se usado) antes de ir pra produção —
  evita que outro site use a mesma anon key contra seu projeto de forma abusiva,
  embora RLS já limite o dano possível.
- Variáveis de ambiente (URL e anon key do Supabase) configuradas nas Environment
  Variables do projeto na Vercel, não commitadas no repositório.

## 9. Pontos em aberto / fora do MVP

- **Moderação dedicada**: nível `moderator` em `permission_level`, chat de moderação
  separado, tela de gestão/promoção de moderador — tudo fora do MVP (prazo de 2-3
  dias). No MVP, a única ferramenta de moderação é o admin agindo direto no Supabase
  (`reports.status`, `blocks`, `profiles.status`/`banned_by`/`banned_at`).
- Lista exata de categorias fixas em `reports.category` — ajustar na implementação
  se necessário.
- Histórico de banimentos múltiplos: `banned_by`/`banned_at` guardam só a última
  ação. Migrar para tabela de histórico dedicada se for necessário auditar múltiplos
  banimentos — não decidido, não bloqueia o MVP.
- Badge de origem do match (swipe vs. quick_start) na lista de conversas: validar em
  uso real se agrega ou só polui a lista.
- Copy final do modal de aviso "Estou disponível" — só a diretriz de tom foi definida.

## 10. Requisitos funcionais

```
Módulo: Autenticação e Onboarding
1. O sistema deve permitir cadastro com email e senha (Supabase Auth)
2. O sistema deve coletar username, avatar (opcional), role, main agent, rank e bio (opcional, até 50 caracteres) em sequência, com etapas puláveis onde indicado
3. O sistema deve validar campos inline durante o onboarding, não só no submit
4. O sistema deve exibir indicador de progresso durante o onboarding

Módulo: Perfil
5. O sistema deve permitir visualizar o próprio perfil no mesmo formato exibido a outros usuários
6. O sistema deve permitir editar username, avatar, bio, role, main_agent, rank e availability_schedule
7. O sistema deve permitir ativar/desativar o toggle "Estou disponível" (is_available) a partir do perfil e da tela Discover
8. O sistema deve exibir um modal de aviso na primeira ativação do toggle "Estou disponível", persistindo a flag de visualização em localStorage
9. O sistema deve permitir logout

Módulo: Descoberta — Swipe
10. O sistema deve exibir um card por vez com avatar, username, role, rank, main_agent e bio
11. O sistema deve permitir dar like/pass via gesto de arraste e via botões explícitos
12. O sistema deve excluir do deck: o próprio usuário, perfis já swipados, perfis com match existente (qualquer origem), perfis bloqueados e perfis com status != active
13. O sistema deve permitir filtrar o deck por role, rank (faixa) e, opcionalmente, horário de disponibilidade, via bottom sheet/popover acessado por ícone de filtro no header
14. O sistema deve criar um match automaticamente quando houver like recíproco, de forma idempotente sob concorrência
15. O sistema deve exibir um modal fullscreen de "É um match!" em tempo real quando o match ocorrer com o usuário na tela Discover
16. O sistema deve exibir estado vazio ilustrado quando não houver mais perfis

Módulo: Descoberta — Disponíveis agora
17. O sistema deve listar perfis com is_available=true e presença ativa (Realtime) simultaneamente
18. O sistema deve permitir filtrar a lista por role e rank (faixa), sem filtro de horário
19. O sistema deve paginar a lista por cursor/keyset
20. O sistema deve criar um match com origin=quick_start ao clicar em um perfil da lista, sem exigir reciprocidade, e navegar direto ao chat com confirmação sóbria (toast)
21. O sistema deve exibir estado vazio quando não houver ninguém disponível com os filtros aplicados

Módulo: Matches e Chat
22. O sistema deve listar as conversas do usuário ordenadas por atividade recente (matches.last_message_at)
23. O sistema deve exibir indicador de mensagem não lida por conversa, com base em match_reads
24. O sistema deve diferenciar visualmente conversas somente-leitura (por bloqueio ou banimento de uma das partes)
25. O sistema deve permitir enviar mensagens em matches ativos, sem bloqueio e com ambos os usuários ativos
26. O sistema deve preservar o histórico de mensagens mesmo após bloqueio ou banimento
27. O sistema deve permitir acessar denúncia/bloqueio a partir do header do chat individual
28. O sistema deve exibir layout de duas colunas (lista + chat) em telas largas, e navegação full-screen em mobile

Módulo: Denúncia e Bloqueio
29. O sistema deve permitir denunciar um usuário com categoria fixa e detalhes opcionais em texto livre
30. O sistema deve criar um bloqueio automático (par normalizado) ao registrar uma denúncia
31. O sistema deve permitir bloqueio voluntário sem denúncia associada
32. O sistema deve remover perfis bloqueados das listas de descoberta, para ambos os lados
33. O sistema deve permitir que o próprio usuário reverta um bloqueio voluntário
34. O sistema deve restringir a reversão de bloqueio originado de denúncia a usuários com permission_level=admin

Módulo: Moderação e Banimento (admin, sem painel dedicado no MVP)
35. O sistema deve permitir que um admin altere profiles.status para banned, registrando banned_by e banned_at
36. O sistema deve bloquear, para contas banidas: descoberta, leitura/escrita de mensagens (inclusive histórico antigo), presença Realtime, envio de denúncias e bloqueios
37. O sistema deve exibir uma tela de bloqueio total substituindo a navegação para o usuário banido, informando seu status
38. O sistema deve permitir que um admin reverta o banimento (status volta a active)
39. O sistema deve permitir que um admin revise a fila de denúncias pendentes diretamente no Supabase

Módulo: Notificações
40. O sistema deve criar uma notificação in-app do tipo match para ambos os usuários ao ocorrer um match
41. O sistema deve listar notificações em ordem cronológica, mais recente primeiro
42. O sistema deve exibir badge de contagem não lida no ícone de notificações da navegação
43. O sistema deve marcar notificações como lidas ao abrir o item individual
44. O sistema deve exibir estado vazio para usuários sem notificações

Módulo: Estados Globais
45. O sistema deve exibir skeleton screens (não spinner genérico) em toda tela de lista durante carregamento
46. O sistema deve exibir mensagem de erro de rede com ação de retry
```

