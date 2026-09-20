export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 22
export const BIO_MAX_LENGTH = 50

// Riot ID: "Nome#TAG". Validação propositalmente leve (não tenta replicar toda regra da Riot, que muda
// por região) — só a forma: exatamente um "#", nome 3-16 caracteres sem espaço nas pontas, tag 3-5
// caracteres ASCII alfanumérico. Espelha o CHECK `profiles_username_format` do banco.
export const USERNAME_FORMAT_REGEX = /^[^\s#]{3,16}#[A-Za-z0-9]{3,5}$/
export const USERNAME_FORMAT_HINT = 'Use o formato Nome#TAG (ex: Fenix#1234), igual ao seu Riot ID.'
