export const PASSWORD_MIN_LENGTH = 8

// Mesmo conjunto de símbolos que a política de senha do Supabase Auth reconhece.
const SYMBOL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'number', label: 'Pelo menos um número', test: (p) => /[0-9]/.test(p) },
  { id: 'lowercase', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'symbol', label: 'Um símbolo especial (!@#$%^&*)', test: (p) => SYMBOL_REGEX.test(p) },
]
