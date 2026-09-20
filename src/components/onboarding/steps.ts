export interface OnboardingStepConfig {
  name: string
  trackerHint: string
  title: string
  subtitle: string
  hero: { before: string; highlight: string; after: string }
  heroText: string
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    name: 'Credenciais de acesso',
    trackerHint: 'E-mail e senha',
    title: 'Criar sua conta',
    subtitle: 'Conecte-se para achar a duo perfeita sem toxicidade.',
    hero: { before: 'Crie sua conta e ache sua duo com ', highlight: 'sinergia real', after: ' e sem toxicidade.' },
    heroText:
      'Diga adeus à roleta-russa de ranqueada. Encontre parceiros alinhados com seu elo, sua função e seu estilo de jogo.',
  },
  {
    name: 'Identidade do agente',
    trackerHint: 'Riot ID e avatar',
    title: 'Quem é você in-game?',
    subtitle: 'Informe seu Riot ID e personalize seu avatar para encontrar os duos mais compatíveis.',
    hero: { before: 'Mostre ', highlight: 'quem você é', after: ' antes mesmo do primeiro contato.' },
    heroText: 'É assim que os outros jogadores vão te ver antes de chamar você para um duo.',
  },
  {
    name: 'Perfil de jogo',
    trackerHint: 'Função, agente e rank',
    title: 'Qual é o seu estilo no Valorant?',
    subtitle: 'O BoraDuo combina funções complementares para formar o duo perfeito.',
    hero: { before: 'Construa sua identidade ', highlight: 'competitiva', after: ' no Valorant.' },
    heroText:
      'Conectamos funções complementares: quem joga de Controlador encontra um Duelista ou Iniciador alinhado.',
  },
  {
    name: 'Bio',
    trackerHint: 'Seu card de apresentação',
    title: 'Conte seu estilo de jogo',
    subtitle: 'Uma bio curta ajuda a achar quem joga igual a você. Você pode pular e editar depois.',
    hero: { before: 'Uma frase e a ', highlight: 'duo certa', after: ' reconhece você.' },
    heroText: 'Sua bio aparece no card que os outros jogadores veem antes do match. Curta e direta funciona melhor.',
  },
]

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length
