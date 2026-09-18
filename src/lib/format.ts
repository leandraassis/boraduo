const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const shortDateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const longDateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })
const longDateWithYearFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function calendarDaysAgo(iso: string, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000)
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

export function formatListTimestamp(iso: string, now: Date = new Date()): string {
  const days = calendarDaysAgo(iso, now)
  if (days <= 0) return formatTime(iso)
  if (days === 1) return 'Ontem'
  if (days < 7) return weekdayFormat.format(new Date(iso)).replace('.', '')
  return shortDateFormat.format(new Date(iso))
}

export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const days = calendarDaysAgo(iso, now)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  const date = new Date(iso)
  return date.getFullYear() === now.getFullYear() ? longDateFormat.format(date) : longDateWithYearFormat.format(date)
}

export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
