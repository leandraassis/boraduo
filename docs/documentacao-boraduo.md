# Documentação do Sistema — BoraDuo

## 1. Sumário executivo

**BoraDuo** é um aplicativo web para encontrar teammates de Valorant. Resolve o
problema de achar jogadores compatíveis (por função no jogo, rank e disponibilidade)
de forma mais rápida e direcionada do que via Discord ou grupos de LFG ("looking for
group") genéricos, que exigem busca manual e não filtram por compatibilidade real.

O produto combina duas mecânicas de descoberta complementares:

- **Swipe assíncrono**: navegação por perfis, com match mútuo
  liberando o chat.
- **Disponíveis agora**: lista de jogadores online neste momento, com contato
  direto sem precisar de reciprocidade — para quem quer jogar *agora*, não depois.

Escopo do MVP: apenas Valorant, sem verificação de rank, sem moderação automática de
conteúdo, sem painel administrativo dedicado (admin opera direto no banco via
Supabase).

## 2. Personas e usuários do sistema

### 2.1 Usuário comum
Jogador de Valorant buscando teammates. Interage via:
- Descoberta (swipe ou lista de disponíveis)
- Chat com matches
- Denúncia e bloqueio de outros usuários
- Edição do próprio perfil

### 2.2 Administrador
Tem todas as permissões do usuário comum, mais:
- Revisão da fila de denúncias
- Banimento e reversão de banimento de contas
- Reversão de bloqueios originados de denúncia

Contas admin são criadas diretamente no banco (não há fluxo de convite/promoção no
MVP). Não existe painel administrativo dedicado — toda ação de moderação é feita
manualmente no Supabase (editor de tabelas ou SQL).

> Nível `moderator` (intermediário entre usuário comum e admin, com chat de
> moderação dedicado e tela de gestão) está desenhado como evolução futura, mas
> fica **fora do MVP** por restrição de prazo.

## 3. Arquitetura técnica

### 3.1 Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React + Vite | Build rápido, SPA leve, sem necessidade de SSR |
| Renderização | CSR (Client-Side Rendering) | Conteúdo majoritariamente privado/autenticado e dinâmico em tempo real — SSR não traria ganho de SEO (não há conteúdo público indexável) nem de performance percebida, e complicaria o deploy (exigiria processo Node persistente em vez de build estático) |
| Backend | Supabase (Postgres) | Banco relacional + Auth + RLS + Realtime prontos, sem servidor próprio a manter |
| Autenticação | Supabase Auth (email/senha) | Provider único no MVP; OAuth (Discord) avaliado como adição futura |
| Tempo real | Supabase Realtime (Presence + postgres_changes) | Necessário para "Disponíveis agora" (presença) e para o modal de match instantâneo |
| Deploy | Vercel | Build estático (SPA), HTTPS/TLS e domínio automáticos, sem servidor próprio a manter |
| Setup do banco (dev) | Claude Code via MCP do Supabase | Projeto Supabase criado previamente; migrations e RLS aplicadas pelo Claude Code diretamente via MCP, sem SQL manual no dashboard |

### 3.2 Estrutura de dados — visão geral

```
auth.users (Supabase Auth)
    │
    └── profiles (1:1) ── perfil de jogo, status de conta, permissão

profiles ──┬── swipes (decisões de like/pass)
           ├── matches (pares confirmados, origin: swipe | quick_start)
           │      └── match_reads (leitura por usuário)
           │      └── messages (chat do match)
           ├── reports (denúncias)
           ├── blocks (bloqueios, par normalizado)
           └── notifications (central in-app)
```

Ver `spec.md` para o schema SQL completo, incluindo tipos, constraints, trigger de
`last_message_at` e todas as policies de RLS.

### 3.3 Particularidade técnica — Realtime e filtro OR
O Supabase Realtime (`postgres_changes`) não suporta filtro `OR` entre duas colunas
numa única subscription. Como um match pode colocar o usuário atual em `user_a_id`
**ou** `user_b_id`, a detecção em tempo real do match (para o modal "É um match!")
exige abrir **duas subscriptions paralelas**, mesclando os eventos no client. Isso
está documentado explicitamente no prompt da Fase 7 (Notificações + modal de match),
para evitar que a implementação tente (e falhe) um filtro `OR` inexistente.

## 4. Modelo de permissões e segurança (RLS)

Toda regra de acesso é aplicada via Row Level Security do Postgres/Supabase, não em
lógica de aplicação isolada — a segurança vale mesmo se alguém acessar o banco
diretamente via API REST automática do Supabase.

Pontos centrais:
- Um usuário só enxerga seus próprios `swipes` (nunca quem deu like nele antes do
  match).
- Um usuário banido (`status = banned`) perde acesso a tudo, **exceto** à leitura da
  própria linha em `profiles` — isso é intencional: é o que permite o frontend
  detectar o banimento e mostrar a tela de bloqueio total, em vez de o app
  simplesmente quebrar silenciosamente.
- Mensagens nunca são apagadas por bloqueio ou banimento — o histórico é sempre
  preservado para leitura; só a escrita é bloqueada.
- Reversão de bloqueio depende da origem: bloqueio voluntário reverte pelo próprio
  usuário; bloqueio por denúncia só reverte por admin.

## 4.1 Segurança — pontos críticos deste sistema

Segurança é requisito de primeira classe. Os pontos abaixo
são detalhados com SQL/trigger na seção 8 do `spec.md`; aqui, o resumo do risco e da
mitigação:

| Risco | Mitigação |
|---|---|
| Usuário escalar o próprio `permission_level` ou reverter `status = banned` via chamada direta à API do Supabase | Trigger `BEFORE UPDATE` em `profiles` que rejeita mudança nesses campos a menos que quem executa já seja admin — a RLS de update sozinha não protege coluna a coluna |
| Criar `matches`/`blocks` fraudulentos direto pela API (sem reciprocidade real, com usuário banido/bloqueado, em nome de outra pessoa) | Sem policy de `insert` nessas tabelas — escrita só via função `SECURITY DEFINER` (RPC) que valida as regras de negócio no servidor |
| Vazamento de dados via canal Realtime mesmo com RLS de select correta na tabela | Confirmar que a replicação Realtime respeita RLS por tabela (`matches`, `messages`, `notifications`) — não é automático |
| Payload de Presence adulterado pelo client sendo tratado como fonte de verdade | Presence usado só para exibição ("está online"); nunca para autorização de leitura/escrita |
| Service role key (ignora RLS) vazando no bundle do frontend | Nunca sai do ambiente server-side/admin; anon key (protegida por RLS) é a única exposta ao client |
| Upload de avatar malicioso (SVG com script, arquivo além do tamanho/tipo esperado) | Policy de bucket restrita por `user_id`, validação de tipo/tamanho no client **e** no bucket, sem aceitar SVG não sanitizado |
| Flood de mensagens/denúncias/swipes (RLS não limita volume) | Rate limiting nativo do Supabase Auth + rate limiting de aplicação para envio de mensagens e denúncias |
| Evasão de banimento via nova conta com outro e-mail | Risco aceito conscientemente no MVP — verificação de identidade/dispositivo fica fora de escopo pelo prazo |

## 5. Funcionalidades por módulo

### 5.1 Onboarding
Cadastro (email/senha) → identidade (username, avatar opcional) → perfil de jogo
(role, main agent, rank) → bio opcional. Sequencial, validação inline, etapas
puláveis onde indicado, com indicador de progresso.

### 5.2 Descoberta — Swipe
Card único por vez, com avatar, username, role, rank, main agent e bio. Like/pass
via gesto ou botão explícito (necessário para desktop e acessibilidade). Deck exclui
automaticamente: o próprio usuário, perfis já avaliados, perfis com match existente
(qualquer origem), perfis bloqueados e contas inativas/banidas. Filtros (role, rank
em faixa, opcionalmente horário) ficam atrás de um ícone dedicado no header, sem
competir por espaço com o card.

### 5.3 Descoberta — Disponíveis agora
Lista de perfis com intenção (`is_available = true`) **e** presença de conexão real
simultâneas — sair do ar remove da lista mesmo sem desligar a flag manualmente.
Contato é direto (quick match), sem necessidade de reciprocidade, com aviso de
consentimento exibido na primeira ativação do toggle.

### 5.4 Matches e chat
Lista ordenada por atividade recente, com indicador de não lida por conversa.
Conversas somente-leitura (por bloqueio ou banimento) são visualmente diferenciadas,
preservando o histórico mas impedindo novas mensagens. Denúncia e bloqueio acessíveis
diretamente do chat.

### 5.5 Denúncia, bloqueio e banimento
Denúncia gera bloqueio automático entre as partes. Bloqueio voluntário (sem
denúncia) é reversível pelo próprio usuário; bloqueio por denúncia só é revertido
por admin. Banimento é uma ação administrativa manual (via Supabase), reversível,
que congela a conta inteira — descoberta, chat e presença.

### 5.6 Notificações
Central in-app única, persistente até leitura. Sem push nativo nem e-mail no MVP —
decisão consciente, já que o comportamento esperado ("fica guardado até o usuário
logar de novo") já é coberto pela própria tabela `notifications`, sem necessidade de
infraestrutura adicional (service worker, webhook externo).

## 6. Telas do sistema

| Tela | Tipo de acesso | Resumo |
|---|---|---|
| Onboarding | Pré-login, sequencial | Cadastro → identidade → perfil de jogo → bio |
| Discover | Bottom nav (inicial) | Swipe ⇄ Disponíveis agora, com filtro dedicado no modo Swipe |
| Matches | Bottom nav | Lista de conversas + chat individual |
| Notificações | Bottom nav | Lista cronológica de eventos |
| Perfil | Bottom nav | Visualização/edição do próprio perfil, logout |
| Chat individual | Secundária (a partir de Matches) | Conversa 1:1, com opção de bloquear/denunciar |
| Modal "É um match!" | Overlay | Disparado em tempo real na tela Discover |
| Modal de aviso de disponibilidade | Overlay | Primeira ativação do toggle "Estou disponível" |
| Tela de bloqueio total | Substitui navegação | Exibida a usuários com `status = banned` |

Ver `spec.md`, seção 6, para o detalhamento de layout, responsividade e
comportamento de cada tela.

## 7. Design system (resumo — ver prompt do Google Stitch para o detalhamento)

- Tema escuro, paleta roxo/ciano (identidade gamer sem copiar a marca do jogo)
- Tipografia: Inter, hierarquia H1/H2/corpo/label
- Componentes visuais reaproveitados entre telas (ex: ícones de rank/role usados
  tanto no onboarding quanto nos filtros e nos cards)
- Mobile-first; desktop tratado como adaptação responsiva, não como redesenho

## 8. Decisões de escopo — o que fica de fora do MVP

- Nível de permissão `moderator` e ferramentas de moderação dedicadas (chat de
  moderação, tela de gestão/promoção)
- Painel administrativo — toda ação de admin é manual, direto no Supabase
- Suspensão temporária de conta (só existem os estados `active` e `banned`)
- Verificação/validação de rank (é autodeclarado)
- Push notifications e notificações por e-mail
- Integrações externas (WhatsApp, Discord OAuth, N8N, etc.)
- Histórico auditável de múltiplos banimentos (só a última ação é registrada)
- Estado "pendente" em matches originados de "Disponíveis agora" (todo quick match é
  confirmado imediatamente)

## 9. Glossário de nomenclatura

Para evitar ambiguidade entre termos de produto e nomes de campos técnicos:

| Termo de produto | Campo técnico | Observação |
|---|---|---|
| "Disponíveis agora" | `is_available` (profiles) + Presence (Realtime) | Nome exibido ao usuário mudou de "Pronta entrega" para "Disponíveis agora" — atualizado em todo este documento e no spec técnico |
| Função no jogo (duelista, sentinela...) | `role` (profiles) | Não confundir com nível de permissão |
| Nível de permissão (usuário/admin) | `permission_level` (profiles) | Campo separado de `role` |
| Personagem mais jogado | `main_agent` (profiles) | |
| Match via swipe | `matches.origin = 'swipe'` | |
| Match via Disponíveis agora | `matches.origin = 'quick_start'` | |
