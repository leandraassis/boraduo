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
conteúdo, com painel administrativo mínimo (fila de denúncias, conversa da denúncia,
marcar como revisada e banir/desbanir; só promover a admin e remover o bloqueio de uma
denúncia continuam manuais, por SQL). O uso é restrito a maiores de 18 anos, com aceite
dos Termos de Uso e da Política de Privacidade no cadastro.

## 2. Personas e usuários do sistema

### 2.1 Usuário comum
Jogador de Valorant buscando teammates. Interage via:
- Descoberta (swipe ou lista de disponíveis)
- Chat com matches
- Denúncia e bloqueio de outros usuários
- Edição do próprio perfil

### 2.2 Administrador
Tem todas as permissões do usuário comum, mais:
- Revisão da fila de denúncias, com acesso à conversa entre denunciante e denunciado
- Banimento e reversão de banimento de contas
- Reversão de bloqueios originados de denúncia (manual, por SQL)

Contas admin são criadas por SQL (não há fluxo de convite/promoção no MVP). A moderação é feita
por uma tela interna (`/app/admin/users`), visível só para admin, que parte da fila de
denunciados e permite buscar por trecho do username (Riot ID completo, único no banco) ou por
e-mail exato (a tela também mostra id curto e outros dados, como referência estável independente
do username). Para cada denúncia pendente o admin vê a conversa entre as duas partes, com as
mensagens do denunciado destacadas, e pode **marcar como revisada** sem banir. Banir já marca
como revisadas as denúncias pendentes contra o banido. Toda revisão registra quem fez e quando.
Promoção a admin e reversão de bloqueio por denúncia continuam manuais (SQL Editor do Supabase);
os comandos estão na seção 11 do `spec.md`.

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
| Autenticação | Supabase Auth (email/senha) | Provider único no MVP, com confirmação de e-mail e recuperação de senha por link; OAuth (Discord) avaliado como adição futura |
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
           ├── blocks (bloqueios: par normalizado, uma linha por lado que bloqueou)
           └── notifications (central in-app)

agents (referência somente leitura; profiles.main_agent_id aponta para ela)
```

Ver `spec.md` para o modelo de dados, constraints, triggers, catálogo das funções e todas as
policies de RLS. O `spec.md` descreve as regras e não repete o SQL do schema: a fonte é o próprio
banco do Supabase (as migrations ficam só na máquina de desenvolvimento, fora do Git).

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
  usuário; bloqueio por denúncia só reverte por admin (manualmente, por SQL).
- Bloqueio é por lado: se A bloqueia B e B bloqueia A, são dois bloqueios independentes, e a
  conversa só volta a valer quando os dois forem desfeitos.

## 4.1 Segurança — pontos críticos deste sistema

Segurança é requisito de primeira classe. Os pontos abaixo
são detalhados com SQL/trigger na seção 8 do `spec.md`; aqui, o resumo do risco e da
mitigação:

| Risco | Mitigação |
|---|---|
| Usuário escalar o próprio `permission_level` ou reverter `status = banned` via chamada direta à API do Supabase (no update **ou já ao criar o perfil**) | Trigger `BEFORE INSERT OR UPDATE` em `profiles` que fixa esses campos no insert e rejeita mudança no update a menos que quem executa já seja admin — a RLS sozinha não protege coluna a coluna |
| Criar `matches`/`blocks`/`reports` fraudulentos direto pela API (sem reciprocidade real, com usuário banido/bloqueado, em nome de outra pessoa) | Sem policy de `insert` nessas tabelas — escrita só via função `SECURITY DEFINER` (RPC) que valida as regras de negócio no servidor. Duas requisições simultâneas de like recíproco geram um único match e uma única notificação (lock por par) |
| Vazamento de dados via canal Realtime mesmo com RLS de select correta na tabela | Testado: com várias conexões assinando `matches`, `messages`, `notifications` e `match_reads`, cada conta recebe só os próprios eventos e uma conta intrusa ou anônima, nenhum. O canal de Presence é privado (policy em `realtime.messages`) |
| Payload de Presence adulterado pelo client sendo tratado como fonte de verdade | Presence usado só para exibição ("está online"); nunca para autorização de leitura/escrita |
| Perfis bloqueados aparecendo (ou sendo contatados) pelo outro lado do bloqueio | Deck e "Disponíveis agora" consultam o bloqueio por função própria (`fn_pair_is_blocked`), que enxerga os bloqueios dos dois lados; a RLS sozinha só mostraria os do próprio usuário |
| Criar conta sem aceitar os termos ou declarando-se menor por chamada direta à API | O aceite (versão dos termos + 18 anos) viaja no cadastro e o trigger de criação do perfil recusa sem ele; a data do aceite vem do servidor |
| Service role key (ignora RLS) vazando no bundle do frontend | Nunca sai do ambiente server-side/admin; anon key (protegida por RLS) é a única exposta ao client |
| Upload de avatar malicioso (SVG com script, arquivo além do tamanho/tipo esperado, URL externa como avatar) | Policy de bucket restrita por `user_id`, validação de tipo/tamanho no client **e** no bucket (5 MB; PNG, JPEG, WebP), sem SVG; `avatar_url` só aceita o caminho do próprio perfil no bucket do projeto |
| Flood de mensagens/denúncias/quick matches (RLS não limita volume) | Rate limiting nativo do Supabase Auth + limites no banco: 30 mensagens/min por usuário (com `created_at` definido pelo servidor), 3 denúncias/min e 3 chats iniciados/min + 15/24 h em "Disponíveis agora". Swipes e volume de upload de avatar não têm limite no MVP (risco conhecido) |
| Evasão de banimento via nova conta com outro e-mail | Risco aceito conscientemente no MVP — verificação de identidade/dispositivo fica fora de escopo pelo prazo |

## 5. Funcionalidades por módulo

### 5.1 Onboarding
Cadastro (email/senha, com aceite dos Termos e da Política e declaração de 18 anos ou mais)
→ identidade (username, avatar opcional) → perfil de jogo (role, main agent, rank) → bio
opcional. Sequencial, validação inline, etapas puláveis onde indicado, com indicador de
progresso. O username é o **Riot ID completo** (`Nome#TAG`), único no app (sem diferenciar
maiúsculas), e é a forma de o admin localizar uma conta.

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
consentimento exibido na primeira ativação do toggle. Cada usuário pode iniciar até 3 chats
por minuto e 15 por 24 horas, para uma conta não encher a lista de conversas de todos os
disponíveis. O destinatário não recebe notificação: a conversa aparece na lista dele.

### 5.4 Matches e chat
Lista ordenada por atividade recente, com indicador de não lida por conversa.
Conversas somente-leitura (por bloqueio ou banimento) são visualmente diferenciadas,
preservando o histórico mas impedindo novas mensagens. Denúncia e bloqueio acessíveis
diretamente do chat.

### 5.5 Denúncia, bloqueio e banimento
Denúncia gera bloqueio automático entre as partes e só é acessível dentro do chat. Bloqueio
voluntário (sem denúncia) é reversível pelo próprio usuário (tela "Usuários bloqueados" no
Perfil); bloqueio por denúncia só é revertido por admin, por SQL. Banimento é uma ação
administrativa feita pela tela de administração, reversível, que congela a conta inteira —
descoberta, chat e presença — e leva o usuário a uma tela de bloqueio total.

### 5.6 Notificações
Central in-app única, persistente até leitura. Sem push nativo nem e-mail no MVP —
decisão consciente, já que o comportamento esperado ("fica guardado até o usuário
logar de novo") já é coberto pela própria tabela `notifications`, sem necessidade de
infraestrutura adicional (service worker, webhook externo).

### 5.7 Conta, senha e termos
- **Login** com e-mail e senha, com link para recuperar a senha.
- **Recuperação de senha**: o usuário informa o e-mail e recebe sempre a mesma confirmação,
  exista ou não conta com ele (não revela quem está cadastrado). O link do e-mail abre a tela de
  nova senha, que aplica os mesmos requisitos do cadastro e encerra as demais sessões da conta.
- **Termos de Uso e Política de Privacidade**: páginas públicas, com aceite obrigatório no cadastro.
  A versão aceita e a data ficam no perfil. Quem ainda não aceitou a versão vigente (contas
  anteriores ou após uma nova versão) vê uma tela de aceite antes de usar o app.
- **Exclusão de conta**: não há botão no MVP; a Política diz que o pedido é feito por e-mail. O
  procedimento manual ainda precisa ser definido (`spec.md`, seção 9).

## 6. Telas do sistema

| Tela | Tipo de acesso | Resumo |
|---|---|---|
| Login | Pré-login | E-mail e senha, links para cadastro, recuperação de senha e termos |
| Recuperar senha / Nova senha | Pré-login (`/forgot-password`, `/reset-password`) | Pedido do link por e-mail; definição da nova senha pelo link |
| Termos de Uso / Política de Privacidade | Públicas (`/termos`, `/privacidade`) | Textos legais, acessíveis do cadastro, do login, do Perfil e da tela de banido |
| Onboarding | Pré-login, sequencial | Cadastro (com aceite dos termos e 18+) → identidade (Riot ID) → perfil de jogo → bio |
| Discover | Bottom nav (inicial) | Swipe ⇄ Disponíveis agora, com filtro dedicado no modo Swipe |
| Matches | Bottom nav | Lista de conversas + chat individual |
| Notificações | Bottom nav | Lista cronológica de eventos |
| Perfil | Bottom nav | Visualização/edição do próprio perfil, usuários bloqueados, links legais, logout; card de Administração para admin |
| Chat individual | Secundária (a partir de Matches) | Conversa 1:1, com opção de bloquear/denunciar |
| Administração | Só admin (`/app/admin/users`) | Fila de denunciados, busca, conversa da denúncia, marcar como revisada, banir/desbanir |
| Modal "É um match!" | Overlay | Disparado em tempo real na tela Discover |
| Modal de aviso de disponibilidade | Overlay | Primeira ativação do toggle "Estou disponível" |
| Tela de aceite obrigatório | Substitui navegação | Para quem não aceitou a versão vigente dos termos; permite aceitar ou sair |
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
- Painel administrativo completo — só existe a tela mínima (fila de denúncias, conversa da
  denúncia, marcar como revisada, banir/desbanir); promoção a admin e reversão de bloqueio
  por denúncia seguem manuais, por SQL (`spec.md`, seção 11); não há chat de admin com usuários
- Exclusão de conta pelo app (o pedido é feito por e-mail, conforme a Política de Privacidade)
- Verificação de idade: o app só registra a declaração de 18 anos ou mais, sem comprovação
- Denunciar quem ainda não é conversa (a denúncia só existe dentro do chat)
- Limite de volume em swipes e em uploads de avatar
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
| Riot ID | `username` (profiles) | Formato `Nome#TAG`, único no banco sem diferenciar maiúsculas |
| Aceite dos termos | `terms_version`, `terms_accepted_at` (profiles) | Versão vigente em `TERMS_VERSION` (`src/lib/legal.ts`); a data vem do servidor |
| Personagem mais jogado | `main_agent_id` (profiles) → `agents` | Antes era texto livre (`main_agent`). A função do agente só pré-preenche `role` no formulário; os dois campos são independentes |
| Match via swipe | `matches.origin = 'swipe'` | |
| Match via Disponíveis agora | `matches.origin = 'quick_start'` | |
