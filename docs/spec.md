# Spec — BoraDuo (App de Match de Teammates para Valorant)

## 1. Visão geral

App de descoberta de teammates para Valorant com mecânica de swipe.
Dois caminhos de descoberta coexistem:

1. **Swipe assíncrono**: usuário curte/rejeita perfis; curtida mútua vira match.
2. **Disponíveis agora**: lista filtrada de jogadores disponíveis agora, sem depender
   de swipe prévio. Contato aqui é via **quick match**, não exige reciprocidade.

Escopo do MVP: apenas Valorant, rank autodeclarado, sem curadoria automática de
conteúdo, sem ferramentas de moderação além de denúncia/bloqueio simples e banimento
administrativo (tela mínima `/app/admin/users` para banir/desbanir — ver seção 6.8; o
restante da moderação continua manual no Supabase).

Web app, mobile-first. Sem integrações externas; notificações apenas in-app,
persistidas até o usuário abrir o app (sem push nativo, sem e-mail).

## 2. Stack

- **Frontend**: React + Vite, **CSR (sem SSR)** — decisão baseada no conteúdo em si
  (quase tudo privado/autenticado e dinâmico via Realtime, então SSR não traz ganho
  de SEO nem de performance percebida relevante).
- **Backend/DB/Auth/Realtime**: Supabase (Postgres + RLS + Auth + Realtime Presence)
- **Autenticação**: Supabase Auth, provider único de email/senha, com recuperação de senha por
  e-mail (seção 6.9). Sem Discord OAuth no MVP (avaliar como provider adicional depois, não bloqueante).
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
| `username` | text | Riot ID completo (`Nome#TAG`). Único (case-insensitive, `CHECK` de formato `^[^\s#]{3,16}#[A-Za-z0-9]{3,5}$`, trim server-side). Usado pelo admin para localizar jogadores em ban/desban e denúncias — a moderação sempre age por `id`, nunca pela string do username |
| `avatar_url` | text, nullable | Avatar opcional, não obrigatório |
| `bio` | varchar(50), nullable | Limite de ~50 caracteres |
| `role` | enum | Função no jogo: `duelist \| sentinel \| controller \| initiator`. Não confundir com `permission_level` |
| `main_agent_id` | text, NOT NULL, FK → agents(id) `ON DELETE RESTRICT` | Personagem mais jogado (um só por perfil). Ver 3.10. Substituiu o texto livre `main_agent`, removido |
| `rank` | enum | Tier único, sem subdivisão: `iron \| bronze \| silver \| gold \| platinum \| diamond \| ascendant \| immortal \| radiant`. Autodeclarado |
| `availability_schedule` | text, nullable | Informativo. Não filtra "Disponíveis agora". Pode opcionalmente ser usado como filtro no swipe |
| `is_available` | boolean, default false | Flag de intenção "agora", independente da conexão real |
| `permission_level` | enum, default `user` | `user \| admin`. Sem nível `moderator` no MVP |
| `status` | enum, default `active` | `active \| banned` (suspensão temporária fora do MVP) |
| `banned_by` | uuid, nullable, FK → profiles | Auditoria de quem baniu |
| `banned_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |
| `terms_version` | text, nullable | Versão dos Termos de Uso e da Política de Privacidade aceita (`AAAA-MM-DD`, `CHECK` de formato). Nulo nas contas anteriores ao aceite. Ver 6.10 |
| `terms_accepted_at` | timestamptz, nullable | Quando aceitou essa versão. Sempre do servidor (trigger), nunca do cliente |

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
| `initiator_id` | uuid, nullable, FK → profiles | Quem iniciou o quick match (um dos dois do par). Nulo em matches por swipe e nos quick matches anteriores ao limite (não contam para ele). Base do limite de quick match (seção 4.2) |
| `last_message_at` | timestamptz | **Desnormalizado**, atualizado via trigger a cada `insert` em `messages`. Usado para ordenar a lista de conversas por atividade recente |
| `created_at` | timestamptz | |

Constraint: `unique(user_a_id, user_b_id)`; `check (initiator_id is null or initiator_id in (user_a_id, user_b_id))`.
Índice parcial `(initiator_id, created_at desc) where origin = 'quick_start'` para a contagem do limite.

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
Bloqueio entre dois usuários — por denúncia (automático) ou voluntário. Uma linha por par
normalizado **e por quem bloqueou** (até duas por par: cada lado tem o seu bloqueio). O par está
bloqueado enquanto existir qualquer linha; os efeitos valem nos dois sentidos, mas cada usuário só
enxerga (e só remove) a linha que ele mesmo criou.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `user_a_id` | uuid, FK → profiles | Par normalizado |
| `user_b_id` | uuid, FK → profiles | |
| `blocker_id` | uuid, FK → profiles | Quem criou o bloqueio (o denunciante, se veio de denúncia); sempre um dos dois do par |
| `report_id` | uuid, nullable, FK → reports | Presente se originado de denúncia |
| `created_at` | timestamptz | |

Constraint: `unique(user_a_id, user_b_id, blocker_id)` (`blocks_pair_blocker_key`);
`check (blocker_id in (user_a_id, user_b_id))`.

Efeito: os dois usuários deixam de aparecer um para o outro; conversa existente vira
somente leitura.

**Reversão**: `report_id` presente → só `permission_level = admin` remove.
`report_id` nulo (voluntário) → o próprio usuário que bloqueou (`blocker_id`) remove quando
quiser; o bloqueado nunca remove. Se quem já bloqueou voluntariamente depois denuncia o mesmo
usuário, o bloqueio dele passa a ser de denúncia (`report_id` preenchido).

**Bloqueios cruzados**: se o agressor já tinha bloqueado a vítima e a vítima o denuncia, a denúncia
cria a linha **da vítima** (com `report_id`) ao lado da voluntária do agressor. O agressor pode remover
a dele, mas o par continua bloqueado pela da vítima, e nenhum dos dois é informado do que o outro fez
(a lista "Usuários bloqueados" de cada um só mostra as linhas em que ele é o `blocker_id`). Da mesma
forma, se A bloqueia B e depois B bloqueia A, o bloqueio de B é registrado e o par só reabre quando
os dois removerem. Consequência para a moderação: apagar o bloqueio de denúncia não desbloqueia o par
se o outro lado ainda tiver um bloqueio voluntário.

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

### 3.10 `agents`
Tabela de referência dos agentes de Valorant, usada na seleção do main
(`profiles.main_agent_id`). Somente leitura para o app.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | text (PK) | Slug estável, `^[a-z0-9]+$`: `jett`, `kayo`... |
| `name` | text, unique | Nome de exibição (`KAY/O`) |
| `role` | enum `role_type` | Função do agente (mesmo enum de `profiles.role`) |

- **`agents.role` só pré-preenche `profiles.role` no formulário.** Não existe regra no
  banco ligando os dois: função e main são salvos de forma independente, e o jogador
  pode ter um main de outra função. O filtro do swipe continua usando `profiles.role`.
- **Escrita só por migration.** RLS ativa sem policy de escrita; `REVOKE ALL` de
  `anon`/`authenticated` (o Supabase concede ALL a tabela nova por padrão) e `GRANT
  SELECT` só para `authenticated`. Agentes novos entram por seed idempotente numa
  migration, sem deploy do front (o app lê a tabela).
- Fora do MVP: imagens de agentes, filtro por agente no swipe e mais de um main.

### 3.9 Estado local (fora do banco)
`seen_availability_warning`: flag do modal de aviso "Estou disponível" — persistida
em **localStorage**, não no banco. Decisão explícita: é cosmética, não precisa
sobreviver a troca de dispositivo nem ser auditável.

## 4. Fluxos principais

### 4.1 Swipe → Match
1. Usuário dá like/pass em `swipes`.
2. Se like recíproco, cria-se linha em `matches` (`origin = swipe`) via
   `insert ... on conflict do nothing` sobre o par normalizado. `fn_create_match_from_swipe` toma
   antes um `pg_advisory_xact_lock` sobre o par normalizado, que serializa os dois sentidos (A→B e
   B→A): sem ele, dois likes simultâneos não enxergam o swipe ainda não commitado um do outro e o
   match nunca nasce (req. 14).
3. Cria-se notificação (`type = match`) para os dois usuários **somente se aquela chamada criou o
   match** (`returning id`). Chamada repetida, ou match que já existia (ex.: `quick_start`), não gera
   notificação nem duplica o badge.
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
   de celebração. `fn_create_quick_match` grava `initiator_id = auth.uid()` e **limita os chats
   iniciados por usuário a 3 por minuto e 15 por 24 h**; acima disso levanta `rate_limit_exceeded`
   e a tela mostra um aviso (o texto vale para os dois limites). Só contam matches realmente criados.
   Chamar quem já tem chat com o usuário não cria nada, não gasta cota e apenas reabre a conversa.
   As chamadas do mesmo usuário são serializadas por `pg_advisory_xact_lock`, para que chamadas
   paralelas não passem juntas pela contagem.
5. Chat libera imediatamente, mesma RLS do fluxo normal.
6. Paginação por cursor/keyset (não offset), por ser lista em tempo real via Presence.

### 4.3 Denúncia e bloqueio
1. Usuário denuncia → insere em `reports` (`category`, `details` opcional,
   `status = pending`).
2. Insere automaticamente em `blocks` (par normalizado, `blocker_id` = denunciante) com
   `report_id` preenchido. Se o denunciante já tinha um bloqueio voluntário próprio, ele é
   convertido em bloqueio de denúncia; um bloqueio do outro lado do par não é tocado (ver 3.7).
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
1. Admin bane pela tela `/app/admin/users` (seção 6.8), que chama `fn_admin_ban_user`: a RPC
   altera `profiles.status` para `banned`, preenchendo `banned_by`/`banned_at`. (Continua
   possível fazer o mesmo à mão no SQL Editor do Supabase.)
2. RLS geral nega, para quem tem `status != active`: descoberta, leitura/escrita em
   `messages` (inclusive histórico antigo), presença Realtime, inserts em `reports`
   e `blocks`.
3. O usuário banido pode ler o próprio perfil (`profiles`) — necessário para o
   frontend detectar o banimento e exibir a tela de bloqueio total. É a única leitura
   permitida a uma conta banida.
4. Do lado de quem não está banido: continua enxergando o histórico do chat
   (read-only), só não recebe mensagens novas.
5. Reversão: admin desbane pela mesma tela (`fn_admin_unban_user`): `status` volta para
   `active` e `banned_by`/`banned_at` são limpos.

## 5. RLS — policies principais

- **`profiles` (leitura da própria linha)**: sempre permitida, banido ou não —
  necessária para o app detectar `status = banned` e exibir a tela de bloqueio total.
- **`profiles` (leitura de outros perfis, swipe/Disponíveis agora)**: exige
  `status = active` de ambos os lados (usuário logado e candidato); exclusões de
  swipes/matches/blocks e filtros aplicados na query da aplicação.
- **`profiles` (update da própria linha)**: usuário pode atualizar username, avatar_url,
  bio, role, main_agent_id, rank, availability_schedule, is_available — **mas não**
  permission_level, status, banned_by, banned_at. Ver seção 8.1 sobre por que isso
  precisa de um trigger, não só da policy.
- **`agents` (select)**: qualquer usuário `authenticated`; `anon` não lê. Nenhuma escrita
  pelo app (sem policy de insert/update/delete e sem privilégio de escrita).
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
- **`reports` (insert)**: **sem policy de insert direto pelo client** — a denúncia nasce só por
  `fn_report_user` (SECURITY DEFINER: exige conta ativa, limita `details` a 500 caracteres e cria o
  bloqueio junto). Select restrito a admin.
- **`blocks` (select)**: usuário só vê as linhas que ele mesmo criou (`blocker_id`), para quem foi
  bloqueado/denunciado não descobrir quem o bloqueou. A checagem de bloqueio na policy de `messages`
  usa `fn_pair_is_blocked` (`SECURITY DEFINER`), que não depende dessa policy. Admin também lê
  (necessário para o delete de bloqueio de denúncia).
  `fn_get_swipe_deck` e `fn_get_available_now` são `SECURITY INVOKER` (a RLS de `profiles`, `swipes`
  e `matches` continua valendo) e, por isso, **não** podem ler `blocks` direto: sob essa policy só
  enxergariam os bloqueios criados pelo próprio usuário, e quem foi bloqueado/denunciado continuaria
  vendo quem o bloqueou (violando o req. 32, "ambos os lados"). Elas excluem bloqueados por
  `not fn_pair_is_blocked(auth.uid(), p.id)`, que enxerga o par nos dois sentidos.
- **`blocks` (insert)**: **sem policy de insert direto pelo client** — bloqueio
  (voluntário ou por denúncia) também passa por função `SECURITY DEFINER`. Ver 8.2.
- **`blocks` (delete)**: `report_id IS NULL` → quem criou o bloqueio (`blocker_id`, nunca o
  bloqueado); `report_id IS NOT NULL` → só admin (que também precisa de select em `blocks`).
- **Alteração de `profiles.status` e `permission_level`**: update restrito a admin
  (reforçado pelo trigger da seção 8.1, não só pela policy). O client **não** faz esse update:
  banir/desbanir pela UI passa só por `fn_admin_ban_user` / `fn_admin_unban_user` (seção 8.2).
- **Listagem de usuários para o admin**: a policy de leitura de `profiles` só deixa o admin ver
  perfis ativos (e o próprio), então um banido ficaria invisível e não teria como ser desbanido.
  A tela de administração lê por `fn_admin_list_users` (SECURITY DEFINER, exige admin ativo) e
  as denúncias de um usuário por `fn_admin_get_user_reports`. Na busca por e-mail a RPC lê
  `auth.users` e devolve o e-mail; em qualquer outra listagem o campo vem nulo.

## 6. Navegação e telas

Bottom nav com 4 destinos + telas/modais secundários:

```
[ Discover ]  [ Matches ]  [ Notificações ]  [ Perfil ]
```

Telas fora da bottom nav: Onboarding (pré-login), Chat individual (a partir de
Matches), Report/Block (modal), Tela de bloqueio total (usuário banido), Administração de
usuários `/app/admin/users` (só admin, sem item na bottom nav — ver 6.8).

**Indicador de disponibilidade**: como `is_available` é global (persiste entre
telas), um dot discreto fixo no header/bottom nav sinaliza quando ativo, mesmo fora
da tela Discover.

### 6.1 Onboarding
Sequência curta, uma decisão por tela, com indicador de progresso:

| Passo | Tela | Campos | Nota de UX |
|---|---|---|---|
| 1 | Cadastro | Email, senha | Validação inline |
| 2 | Identidade | Username, avatar (opcional) | Avatar pulável |
| 3 | Perfil de jogo | Role, agente principal (obrigatório), rank | Rank como seletor visual de ícones, não dropdown. Agente: combobox só de texto, agrupado por função, com busca. Escolher o agente pré-preenche a role até o jogador escolhê-la à mão |
| 4 | Bio (opcional) | Bio (até 50 char) | Contador de caracteres; pulável |

Responsivo: em telas largas, card centralizado com largura máxima (~480px).

### 6.2 Discover (tela inicial)
Segmented control no topo: **Swipe ⇄ Disponíveis agora**.

**Modo Swipe:**
- Card único visível por vez (próximo levemente visível atrás)
- Avatar, username, role, rank, agente principal (nome + função do agente), bio
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
- Edição: username, avatar, bio, role, main_agent_id (seleção de agente), rank, availability_schedule.
  Perfil já criado começa com a role como escolhida: trocar o agente nunca a sobrescreve
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

### 6.8 Administração de usuários (`/app/admin/users`)
Tela interna, mínima, só para `permission_level = admin`:
- **Acesso**: a rota renderiza apenas para admin; qualquer outro perfil é redirecionado para
  `/app/discover` antes de montar qualquer conteúdo, e nenhum link para ela aparece para
  quem não é admin. O ponto de entrada é o cartão "Administração" em Perfil, renderizado só
  quando `profile.permission_level === 'admin'` (a bottom nav não muda).
- **Como o admin acha o alvo** (a base pode ter milhares de usuários, então a tela não abre
  numa lista de todos): a entrada é a **fila de denunciados** — usuários com denúncia
  `pending`, do mais recentemente denunciado para o mais antigo, só contas ativas. Dali o admin
  vai para a **busca** ou para os filtros.
  - **Busca** (campo com debounce de 350 ms): **trecho do username/Riot ID** (mínimo 3 caracteres, sem
    diferenciar maiúscula; `%` e `_` digitados valem como literais) ou **e-mail exato** (texto com
    `@`, correspondência completa, nunca parcial, para a busca não virar enumeração de contas).
    Menos de 3 caracteres não consulta e mostra uma dica. A busca **substitui a fila** (o chip
    "Só com denúncias pendentes" fica desligado), senão um alvo sem denúncia "sumiria". Como o
    username agora é único, uma busca pelo Riot ID completo aponta para no máximo uma conta.
  - **Filtros**: abas `Ativos | Banidos | Todos` e o chip "Só com denúncias pendentes". Sem escolha
    manual, "Ativos" vale só para a fila (denúncias de quem já foi banido não entulham a fila);
    busca e navegação livre procuram em todos, senão um banido não seria achado para desbanir. A
    escolha manual da aba vale em qualquer modo.
  - **`username` é único** (case-insensitive) desde a mudança para Riot ID completo, mas cada linha e
    o modal de banir continuam mostrando também o **id curto** (8 primeiros caracteres do uuid),
    função, rank, agente e data de cadastro — referência estável e barata para suporte/auditoria,
    independente do username.
- **Lista** paginada por cursor `(sort_at, id)` (20 por página, "Carregar mais"; a consulta pede 21
  para saber se há próxima página), via `fn_admin_list_users`. Cada linha: username, id curto,
  status (Ativo/Banido), badge "Admin", dados de identificação e o botão de denúncias.
- **Denúncias**: a linha mostra "N denúncias pendentes" (ou "Ver denúncias"), que expande um painel
  carregado sob demanda por `fn_admin_get_user_reports` com categoria, texto, data, status e quem
  denunciou. O texto é conteúdo de usuário e só é renderizado como texto.
- **Conversa da denúncia**: numa denúncia `pending`, "Ver conversa" mostra a troca entre denunciante e
  denunciado via `fn_admin_get_report_conversation(report_id)` (o client nunca escolhe os dois
  usuários; o servidor recusa denúncia já revisada). Devolve as **200 mensagens mais recentes**, em
  ordem cronológica — o abuso recente é o que motiva a denúncia, então o corte descarta as mais antigas.
- **Ações por linha**: Banir (com modal de confirmação que repete a identidade) e Desbanir, só por
  `fn_admin_ban_user` / `fn_admin_unban_user`. Linhas de admin não oferecem ação (a RPC também
  recusa banir admin).
- **Banir revisa as denúncias**: `fn_admin_ban_user` marca como `reviewed`, na mesma transação, as
  denúncias `pending` em que o alvo é o **denunciado** (as que ele fez contra outros e as contra
  outros usuários não mudam). Assim o banido sai da fila e, se for desbanido depois, as denúncias
  antigas (já decididas) não voltam a aparecer; denúncia **nova** contra ele entra na fila normalmente.
  O modal de banir avisa quantas serão revisadas, e o painel de denúncias da linha passa a mostrá-las
  como "Revisada". Desbanir não altera denúncias. Não há `reviewed_by`: o `banned_by` do perfil é a
  trilha de quem decidiu. Marcar denúncias como revisadas **sem** banir (ignorar uma denúncia)
  continua manual (`update reports set status = 'reviewed'`), e um banimento feito à mão no SQL Editor
  também não revisa nada.
- **Fora do escopo**: chat do admin com usuários, revisão de denúncias e promoção a admin
  continuam manuais no Supabase. Usuário banido que queira contestar segue o procedimento dos
  Termos de Uso (seção 5, `/termos#moderacao`, e-mail de contato), linkado na tela de banido.

### 6.9 Recuperação de senha (`/forgot-password`, `/reset-password`)
Duas telas públicas (sem login), sem nenhuma mudança no banco: o fluxo é todo do Supabase Auth.
- **Entrada**: link "Esqueci minha senha" na tela de login.
- **`/forgot-password`**: campo de e-mail que chama `supabase.auth.resetPasswordForEmail` com
  `redirectTo = <origem>/reset-password`. A tela mostra **sempre a mesma confirmação** ("Se existir
  uma conta com esse e-mail, enviamos um link…"), exista a conta ou não: o Supabase responde
  sucesso também para e-mail não cadastrado, e a tela não faz nada que revele quais contas existem.
  Só os erros de limite de envio (429) e de rede aparecem como aviso. Reenvio bloqueado por 60 s.
- **`/reset-password`**: aberta pelo link do e-mail. Formulário de nova senha + confirmação, com a
  mesma checklist de requisitos do cadastro (mín. 8, minúscula, maiúscula, número e símbolo), que o
  servidor também aplica. Ao salvar (`updateUser({ password })`) a tela encerra as **demais** sessões
  da conta (`signOut({ scope: 'others' })`), avisa "Senha alterada" e leva ao app já conectado.
  Recusas do servidor têm mensagem própria: senha fraca e "igual à atual". Link expirado, já usado
  ou acesso direto sem sessão mostram "Link inválido ou expirado" com atalho para pedir outro.
- **O link entrega uma sessão completa** (o usuário prova ter o e-mail). Por isso o app nunca pode
  deixá-lo cair direto em `/app` sem passar pela troca: `redirectRecoveryLinkToResetPage()` (roda em
  `main.tsx`, antes de montar) leva qualquer URL com `type=recovery` no hash para `/reset-password`
  preservando o hash, e `RecoveryRedirect` faz o mesmo ao receber o evento `PASSWORD_RECOVERY`.
  Sem isso, com a URL não liberada no painel, o link cairia no Site URL e o usuário seria logado por
  `/login → /app` sem nunca definir a senha.
- **Configuração manual no Supabase (não automatizável)**: liberar `<domínio>/reset-password` em
  *Authentication → URL Configuration → Redirect URLs* (produção e, no desenvolvimento,
  `http://localhost:5173/reset-password`) e configurar um **SMTP próprio**: o SMTP padrão do Supabase
  tem limite muito baixo de e-mails por hora e serve também à confirmação de e-mail e a esta
  recuperação. Ver README (Deploy).

### 6.10 Termos de Uso, Política de Privacidade e aceite (`/termos`, `/privacidade`)
- **Páginas públicas** (sem login), em PT-BR, orientadas à LGPD, linkadas no rodapé das telas de
  autenticação, na caixa do cadastro, em Perfil e na tela de banido. Descrevem o que o app realmente faz:
  Riot ID autodeclarado e não verificado; contato direto sem aceite prévio em "Disponíveis agora"; limites de
  uso; bloqueio e denúncia; **a moderação pode ler a conversa entre denunciante e denunciado ao analisar uma
  denúncia**; banimento e como contestá-lo (`#moderacao`); dados tratados, bases legais, operadores
  (Supabase e Vercel) e transferência internacional, retenção e direitos do art. 18 (`#direitos`).
  **Não há exclusão de conta no MVP**: a exclusão é por pedido ao e-mail de contato.
- **Idade mínima: 18 anos** (constante `MIN_AGE`), declarada na caixa de aceite e nos dois textos.
- **Aceite no cadastro**: caixa obrigatória ("Tenho 18 anos ou mais e aceito os Termos de Uso e a Política
  de Privacidade"). O `signUp` grava a versão (`TERMS_VERSION`, em `src/lib/legal.ts`) em
  `user_metadata.terms_version`. Ao **criar o perfil**, o trigger `fn_protect_profile_privileged_columns` lê
  essa versão de `auth.users` e **recusa** (`terms not accepted`) se ela não existir ou não tiver o formato
  `AAAA-MM-DD`, mesmo em chamada direta à API; grava `terms_version` e `terms_accepted_at` (= `created_at` do
  cadastro, do servidor) e **ignora** qualquer `terms_*` enviado no payload do perfil. Como o aceite vem do
  cadastro, ele sobrevive à confirmação de e-mail (o usuário pode voltar dias depois).
- **Aceite obrigatório (gate)**: `AppGuard` mostra `TermsGate` no lugar do app para quem tem
  `terms_version` diferente da vigente (contas anteriores ao aceite ou depois de uma nova versão). Aceitar faz
  `update({ terms_version })`; o trigger só permite que o **próprio** usuário aceite por si (nem admin forja o
  aceite de outra conta), a versão nunca volta a nulo e `terms_accepted_at` vira `now()` do servidor quando a
  versão muda. Quem recusa só pode sair da conta. Conta banida vai para a tela de banido, antes do gate.
- **Nova versão dos textos**: publicar a mudança e trocar `TERMS_VERSION` e `TERMS_UPDATED_LABEL`; todos veem o
  gate no próximo acesso.
- **Identificação e foro**: os textos **não nomeiam um responsável** (pessoa ou razão social) nem elegem um
  foro. O controlador é "o BoraDuo", identificado apenas pelo e-mail de contato; a lei aplicável é a do Brasil e
  as disputas vão ao foro competente segundo a lei, inclusive o do domicílio do consumidor. Decisão do produto:
  submeter à revisão jurídica se isso atende à LGPD (art. 9º, III, prevê a identificação do controlador).
- **Rascunho e dados de contato**: `LEGAL_DRAFT = true` mostra o aviso "Rascunho em revisão" nas páginas.
  Os dados que os textos trazem ficam em `LEGAL` (`src/lib/legal.ts`: e-mail de contato e região dos servidores
  do Supabase); qualquer valor que comece com `[PREENCHER` é destacado na tela. **Antes do deploy**: conferir os
  dois valores, submeter o texto a **revisão jurídica** e só então `LEGAL_DRAFT = false`.

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

**Banimento pela UI** (`fn_admin_ban_user`, `fn_admin_unban_user`, `fn_admin_list_users`,
`fn_admin_get_user_reports`): mesmo
padrão das demais RPCs — `SECURITY DEFINER`, `search_path` fixo, `auth.uid()` não nulo
(`not authenticated`), conta ativa (`inactive account`, para um admin banido não conseguir se
desbanir), `permission_level = 'admin'` (`not authorized`) e alvo existente (`invalid target`).
Banir admin é recusado (`cannot ban another admin`). São idempotentes: banir quem já está
banido não sobrescreve `banned_by`/`banned_at`; desbanir quem está ativo não faz nada. Banir
também marca como `reviewed` as denúncias `pending` contra o alvo (mesma transação; ver 6.8).
`EXECUTE` é revogado de `public`, `anon` **e** `authenticated` e concedido só a
`authenticated` (os privilégios padrão do Supabase dão EXECUTE direto a `anon`/`authenticated`,
então `revoke ... from public` sozinho deixaria `anon` chamando).

A listagem (`fn_admin_list_users`) e as denúncias (`fn_admin_get_user_reports`) seguem as mesmas
guardas. A busca usa índice trigram (`pg_trgm`, no schema `extensions`) em `lower(username)`; o
`LIKE` recebe o texto com `\`, `%` e `_` escapados, e o e-mail é comparado por igualdade
(nunca `LIKE`). O e-mail só sai na busca por e-mail. Índices de apoio: `profiles (created_at desc,
id desc)`, `reports (reported_id, created_at desc) where status = 'pending'` (fila) e
`reports (reported_id, created_at desc)` (denúncias de um usuário).

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

**Implementado (Fase 8.2)**: limites no banco, valendo também para chamadas REST diretas —
trigger `BEFORE INSERT` em `messages` (máx. **30 mensagens/min por usuário**, somando todas as
conversas) e checagem dentro de `fn_report_user` (máx. **3 denúncias/min por usuário**). Ao
estourar, o banco levanta `rate_limit_exceeded` e a interface mostra uma mensagem clara. O
**quick match** também tem limite (`fn_create_quick_match`: máx. **3 chats iniciados por minuto e
15 por 24 h por usuário**, seção 4.2), para uma conta não encher a lista de conversas de todos os
disponíveis. Swipes não têm limite no MVP.

**Risco aceito conscientemente — Leaked password protection**: a checagem de senhas vazadas
(HaveIBeenPwned) do Supabase Auth é recurso do plano Pro, indisponível no free tier. Fica de
fora do MVP, sem workaround por fora; o advisor `auth_leaked_password_protection` continuará
aparecendo. A política de senha (mín. 8 caracteres, com minúscula, maiúscula, número e símbolo) é
aplicada pelo próprio Supabase Auth (verificado: senha fraca retorna `422 weak_password`) e
espelhada no formulário de cadastro.

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
  **Verificado na Fase 8.2**: a API do Supabase (REST, Auth e Storage) responde
  `Access-Control-Allow-Origin: *` para qualquer origem e **não oferece configuração de CORS
  por domínio** — o item não é executável como escrito. A defesa efetiva é a RLS/RPC (a anon
  key é pública por design) somada a: **Site URL e Redirect URLs** do Auth restritos aos
  domínios reais (impede uso do fluxo de auth a partir de outros sites), limites de taxa do
  Auth e CSP no app (`connect-src`, em `vercel.json`).
- Variáveis de ambiente (URL e anon key do Supabase) configuradas nas Environment
  Variables do projeto na Vercel, não commitadas no repositório.

## 9. Pontos em aberto / fora do MVP

- **Moderação dedicada**: nível `moderator` em `permission_level`, chat de moderação
  separado, tela de gestão/promoção de moderador — tudo fora do MVP (prazo de 2-3
  dias). Banir e desbanir tem tela própria (seção 6.8, adicionada depois do lançamento);
  o resto da moderação (`reports.status`, `blocks`, promoção a admin) continua o admin
  agindo direto no Supabase. Chat entre admin e usuário e revisão de denúncias pela UI
  seguem fora de escopo.
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
2. O sistema deve coletar username (Riot ID completo, formato `Nome#TAG`, único no banco), avatar (opcional), role, main agent (escolhido numa lista de agentes, obrigatório), rank e bio (opcional, até 50 caracteres) em sequência, com etapas puláveis onde indicado
3. O sistema deve validar campos inline durante o onboarding, não só no submit
4. O sistema deve exibir indicador de progresso durante o onboarding

Módulo: Perfil
5. O sistema deve permitir visualizar o próprio perfil no mesmo formato exibido a outros usuários
6. O sistema deve permitir editar username, avatar, bio, role, main_agent_id, rank e availability_schedule
7. O sistema deve permitir ativar/desativar o toggle "Estou disponível" (is_available) a partir do perfil e da tela Discover
8. O sistema deve exibir um modal de aviso na primeira ativação do toggle "Estou disponível", persistindo a flag de visualização em localStorage
9. O sistema deve permitir logout

Módulo: Descoberta — Swipe
10. O sistema deve exibir um card por vez com avatar, username, role, rank, agente principal (main_agent_id) e bio
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
20. O sistema deve criar um match com origin=quick_start ao clicar em um perfil da lista, sem exigir reciprocidade, e navegar direto ao chat com confirmação sóbria (toast), limitando a 3 chats iniciados por minuto e 15 por 24 h por usuário (acima disso, mostra um aviso e não cria o match)
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

Módulo: Moderação e Banimento (admin; banir/desbanir pela tela /app/admin/users, o resto direto no Supabase)
35. O sistema deve permitir que um admin bana um usuário comum pela UI (fn_admin_ban_user), alterando profiles.status para banned, registrando banned_by e banned_at e marcando como revisadas as denúncias pendentes contra ele
36. O sistema deve bloquear, para contas banidas: descoberta, leitura/escrita de mensagens (inclusive histórico antigo), presença Realtime, envio de denúncias e bloqueios
37. O sistema deve exibir uma tela de bloqueio total substituindo a navegação para o usuário banido, informando seu status
38. O sistema deve permitir que um admin reverta o banimento pela UI (fn_admin_unban_user: status volta a active, banned_by e banned_at são limpos)
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

Módulo: Recuperação de senha
47. O sistema deve permitir pedir a recuperação de senha pelo e-mail a partir da tela de login, sempre mostrando a mesma confirmação, exista ou não conta com o e-mail informado
48. O sistema deve permitir definir uma nova senha pelo link recebido por e-mail, aplicando os mesmos requisitos de senha do cadastro, encerrando as demais sessões da conta e recusando links expirados ou inválidos com opção de pedir outro

Módulo: Termos, privacidade e aceite
49. O sistema deve publicar os Termos de Uso e a Política de Privacidade em páginas públicas, acessíveis do cadastro, do login, do Perfil e da tela de banido
50. O sistema deve exigir, no cadastro, o aceite dos Termos e da Política com a declaração de idade mínima de 18 anos, registrar a versão aceita e a data (do servidor) no perfil e recusar, no servidor, a criação de perfil sem esse aceite
51. O sistema deve bloquear o uso do app para quem não aceitou a versão vigente dos Termos e da Política (contas anteriores ao aceite ou após nova versão), exibindo uma tela de aceite obrigatório e permitindo sair da conta
```

