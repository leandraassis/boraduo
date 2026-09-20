// Erros do Supabase (Auth e PostgREST) traduzidos para mensagens claras em PT-BR. O texto cru do servidor vem
// em inglês e, numa queda de rede, é só "Failed to fetch" — não serve para mostrar ao usuário.

interface SupabaseErrorLike {
  message?: string
  code?: string
  status?: number
  name?: string
}

const NETWORK_MESSAGE = 'Sem conexão. Verifique sua internet e tente de novo.'
const RATE_LIMIT_MESSAGE = 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'

export function isNetworkError(error: SupabaseErrorLike): boolean {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return true
  return !error.code && /failed to fetch|network|load failed|fetch failed/i.test(error.message ?? '')
}

function isRateLimited(error: SupabaseErrorLike): boolean {
  return error.status === 429 || /rate_limit|rate limit|too many/i.test(`${error.code ?? ''} ${error.message ?? ''}`)
}

export function loginErrorMessage(error: SupabaseErrorLike): string {
  if (isNetworkError(error)) return NETWORK_MESSAGE
  if (isRateLimited(error)) return RATE_LIMIT_MESSAGE
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message ?? '')) {
    return 'E-mail ou senha incorretos.'
  }
  if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message ?? '')) {
    return 'Confirme seu e-mail antes de entrar. Enviamos um link para a sua caixa de entrada.'
  }
  return 'Não foi possível entrar agora. Tente de novo.'
}

export function signUpErrorMessage(error: SupabaseErrorLike): string {
  if (isNetworkError(error)) return NETWORK_MESSAGE
  if (isRateLimited(error)) return RATE_LIMIT_MESSAGE
  if (error.code === 'user_already_exists' || /already registered/i.test(error.message ?? '')) {
    return 'Este e-mail já está cadastrado. Tente entrar.'
  }
  if (error.code === 'weak_password') return 'Essa senha é fraca demais. Escolha outra.'
  if (error.code === 'email_address_invalid' || error.code === 'validation_failed') return 'E-mail inválido.'
  return 'Não foi possível criar sua conta agora. Tente de novo.'
}

// No insert do onboarding, 23505 é ambíguo: tanto reenvio duplicado do mesmo perfil (colide com a PK
// `id`, já foi criado, seguro tratar como sucesso) quanto Riot ID já usado por outra conta (colide com
// `profiles_username_unique_ci_idx`, o insert falhou de verdade). Só o texto da constraint distingue.
export function isUsernameTakenError(error: SupabaseErrorLike): boolean {
  return error.code === '23505' && /profiles_username_unique_ci_idx/.test(error.message ?? '')
}

export function createProfileErrorMessage(error: SupabaseErrorLike): string {
  if (isNetworkError(error)) return NETWORK_MESSAGE
  if (error.code === '23505') return 'Esse Riot ID já está cadastrado. Escolha outro.'
  if (error.code === '23514') return 'Revise o Riot ID: use o formato Nome#TAG (ex: Fenix#1234).'
  return 'Não foi possível criar seu perfil. Tente de novo.'
}

// Mesma checagem, para quando o erro acontece na edição do perfil já existente (não na criação).
export function saveProfileErrorMessage(error: SupabaseErrorLike): string {
  if (isNetworkError(error)) return NETWORK_MESSAGE
  if (error.code === '23505') return 'Esse Riot ID já está cadastrado. Escolha outro.'
  if (error.code === '23514') return 'Revise o Riot ID: use o formato Nome#TAG (ex: Fenix#1234).'
  return 'Não foi possível salvar. Tente novamente.'
}
