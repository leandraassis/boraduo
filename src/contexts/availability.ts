import { createContext, useContext } from 'react'

export interface PresenceState {
  status: 'connecting' | 'ready' | 'error'
  onlineIds: ReadonlySet<string>
  retry: () => void
}

export interface AvailabilityContextValue {
  isAvailable: boolean
  loaded: boolean
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
