import { createContext, useContext } from 'react'

export interface PresenceState {
  status: 'connecting' | 'ready' | 'error'
  onlineIds: ReadonlySet<string>
  retry: () => void
}

export interface AvailabilityContextValue {
  isAvailable: boolean
  loaded: boolean
  // A leitura inicial de is_available falhou (rede): o toggle fica bloqueado até um retry.
  loadFailed: boolean
  retryLoad: () => void
  saving: boolean
  error: string | null
  requestToggle: () => void
  presence: PresenceState
}

export const AvailabilityContext = createContext<AvailabilityContextValue | null>(null)

export function useAvailability(): AvailabilityContextValue {
  const value = useContext(AvailabilityContext)
  if (!value) throw new Error('useAvailability deve ser usado dentro de AvailabilityProvider')
  return value
}
