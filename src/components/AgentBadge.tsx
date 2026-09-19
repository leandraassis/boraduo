import { useAgents } from '../hooks/useAgents'
import { ROLE_INFO, ROLE_TEXT_CLASS } from '../lib/gameData'
import { RoleIcon } from './RoleIcon'

interface AgentBadgeProps {
  agentId: string | null | undefined
  className?: string
}

// Nome do agente + função dele (cor do token e rótulo em texto). Sem agente, ou enquanto a lista não chegou
// (ou falhou), não renderiza nada: o resto do card continua íntegro.
export function AgentBadge({ agentId, className = '' }: AgentBadgeProps) {
  const { byId } = useAgents()
  const agent = agentId ? byId.get(agentId) : undefined
  if (!agent) return null

  const roleColor = ROLE_TEXT_CLASS[agent.role]

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line-strong bg-canvas/70 px-2.5 py-1 text-xs font-medium tracking-[0.02em] backdrop-blur ${className}`}
    >
      <span className="sr-only">Agente principal: </span>
      <span className={`shrink-0 ${roleColor}`}>
        <RoleIcon role={agent.role} className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-ink">{agent.name}</span>
      <span className={`shrink-0 ${roleColor}`}>{ROLE_INFO[agent.role].label}</span>
    </span>
  )
}
