import { useEffect, useSyncExternalStore } from 'react'
import { fetchAgents, type Agent } from '../lib/agents'

export interface AgentsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  agents: Agent[]
  byId: ReadonlyMap<string, Agent>
}

const EMPTY: AgentsState = { status: 'idle', agents: [], byId: new Map() }

// Cache no módulo: a lista é a mesma para todos e muda só por migration, então o seletor, o card do swipe e o
// preview do perfil compartilham uma única consulta (e nenhum pisca "carregando" ao trocar de tela).
let state: AgentsState = EMPTY
const listeners = new Set<() => void>()

function publish(next: AgentsState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function loadAgents() {
  if (state.status === 'loading' || state.status === 'ready') return
  publish({ ...state, status: 'loading' })
  fetchAgents()
    .then((agents) => publish({ status: 'ready', agents, byId: new Map(agents.map((a) => [a.id, a])) }))
    .catch(() => publish({ ...EMPTY, status: 'error' }))
}

export function useAgents() {
  const snapshot = useSyncExternalStore(subscribe, () => state)

  // Cada tela que monta tenta de novo se a última tentativa falhou; `loadAgents` ignora se já carregou/está carregando.
  useEffect(() => {
    loadAgents()
  }, [])

  return { ...snapshot, retry: loadAgents }
}
