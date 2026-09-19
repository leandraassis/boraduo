import type { Tables } from '../types/database'
import type { RoleType } from './gameData'
import { supabase } from './supabase'

export type Agent = Tables<'agents'>

// Ordem dos grupos na lista de seleção. Não é a do enum `role_type` (duelist, sentinel, controller, initiator).
export const AGENT_GROUP_ORDER: RoleType[] = ['duelist', 'initiator', 'controller', 'sentinel']

// A tabela é só leitura para o app (novos agentes entram por migration) e pequena (~30 linhas): uma consulta só.
export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase.from('agents').select('id, name, role').order('name')
  if (error) throw error
  return data
}

// Compara sem caixa, acento nem pontuação: "kayo", "kay/o" e "KAY O" acham KAY/O.
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function filterAgents(agents: Agent[], query: string): Agent[] {
  const needle = normalizeSearch(query)
  if (!needle) return agents
  return agents.filter((agent) => normalizeSearch(agent.name).includes(needle))
}

export interface AgentGroup {
  role: RoleType
  agents: Agent[]
}

export function groupAgents(agents: Agent[]): AgentGroup[] {
  return AGENT_GROUP_ORDER.map((role) => ({ role, agents: agents.filter((a) => a.role === role) })).filter(
    (group) => group.agents.length > 0,
  )
}
