
# BoraDuo
 
App web para encontrar teammates de Valorant. Em vez de garimpar grupos de LFG no Discord, o jogador filtra por **função, rank e disponibilidade** e conversa com quem combina com ele. Mobile-first, sem integrações externas.
 
## Como funciona
 
Duas formas de descoberta que convivem no mesmo app:
 
- **Swipe:** navegação por perfis com like/pass. Curtida mútua vira match e libera o chat.
- **Disponíveis agora:** lista de jogadores online neste momento, com contato direto (sem precisar de reciprocidade) para quem quer jogar *agora*.

Além disso: chat entre matches, notificações in-app, denúncia e bloqueio entre usuários, e uma tela administrativa mínima para banir e desbanir contas.
 
## Stack
 
React + Vite (CSR) · TypeScript · Tailwind · Supabase (Postgres, RLS, Auth, Realtime) · Vercel
 
## Destaques técnicos
 
- **Segurança na camada do banco:** as regras de acesso vivem em RLS, então valem mesmo para chamadas diretas à API do Supabase.
- **Escritas sensíveis só por RPC:** matches, bloqueios, denúncias e banimentos passam por funções `SECURITY DEFINER` que validam as regras no servidor, sem `insert` direto do client.
- **Proteção de colunas privilegiadas:** um trigger impede que um usuário altere o próprio `permission_level` ou `status`, o que a RLS sozinha não garante.
- **Tempo real:** Realtime Presence para "Disponíveis agora".
- **Moderação com trilha:** banimento reversível, denúncias revisadas no mesmo passo e conversa da denúncia acessível ao admin.

## Documentação
 
Toda a explicação do projeto está em [`docs/`](docs/):
 
| Documento                                                    | O que tem                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [docs/documentacao-boraduo.md](docs/documentacao-boraduo.md) | Visão do sistema: problema, personas, arquitetura, módulos, telas, decisões de escopo e glossário                |
| [docs/spec.md](docs/spec.md)                                 | Especificação técnica: modelo de dados, fluxos, policies de RLS, telas em detalhe, segurança e requisitos funcionais |
 
## Escopo do MVP
 
Apenas Valorant, rank autodeclarado, notificações só in-app e moderação manual além de banir/desbanir. A lista completa do que ficou de fora, e o porquê, está na seção 8 da [documentação](docs/documentacao-boraduo.md).
 
## Rodando localmente
 
```bash
npm install
npm run dev
```
 
O app precisa de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` (veja `.env.example`).