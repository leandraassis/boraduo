import { Constants, type Enums } from '../types/database'

export type RoleType = Enums<'role_type'>
export type RankType = Enums<'rank_type'>

export const ROLE_VALUES = Constants.public.Enums.role_type
export const RANK_VALUES = Constants.public.Enums.rank_type

export const ROLE_INFO: Record<RoleType, { label: string; description: string }> = {
  duelist: { label: 'Duelista', description: 'First bloods & entry' },
  sentinel: { label: 'Sentinela', description: 'Defesa & retake' },
  controller: { label: 'Controlador', description: 'Smokes & controle de visão' },
  initiator: { label: 'Iniciador', description: 'Info & flashes' },
}

export const RANK_INFO: Record<RankType, { label: string; color: string }> = {
  iron: { label: 'Ferro', color: '#6b7280' },
  bronze: { label: 'Bronze', color: '#a9784f' },
  silver: { label: 'Prata', color: '#c7cdd6' },
  gold: { label: 'Ouro', color: '#e8c34c' },
  platinum: { label: 'Platina', color: '#57c6c1' },
  diamond: { label: 'Diamante', color: '#b48cf0' },
  ascendant: { label: 'Ascendente', color: '#4bd18a' },
  immortal: { label: 'Imortal', color: '#c0577d' },
  radiant: { label: 'Radiante', color: '#fdf4b0' },
}

export const SCHEDULE_WINDOWS = [
  { value: 'tarde', label: 'Tarde', hours: '14h - 18h' },
  { value: 'noite', label: 'Noite', hours: '19h - 00h' },
  { value: 'madrugada', label: 'Madrugada', hours: '00h - 05h' },
  { value: 'fim_de_semana', label: 'Fim de semana', hours: 'Livre / flex' },
] as const

export type ScheduleWindow = (typeof SCHEDULE_WINDOWS)[number]['value']

// `profiles.availability_schedule` guarda as janelas escolhidas como slugs separados por vírgula.
export function parseSchedule(value: string | null): ScheduleWindow[] {
  if (!value) return []
  const selected = new Set(value.split(','))
  return SCHEDULE_WINDOWS.filter((w) => selected.has(w.value)).map((w) => w.value)
}

export function serializeSchedule(windows: ScheduleWindow[]): string | null {
  const ordered = SCHEDULE_WINDOWS.filter((w) => windows.includes(w.value)).map((w) => w.value)
  return ordered.length > 0 ? ordered.join(',') : null
}
