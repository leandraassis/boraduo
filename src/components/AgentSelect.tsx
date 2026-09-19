import { useEffect, useId, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useAgents } from '../hooks/useAgents'
import { filterAgents, groupAgents, type Agent } from '../lib/agents'
import { ROLE_INFO, ROLE_TEXT_CLASS } from '../lib/gameData'
import { inputClass, textButtonClass } from './formStyles'
import { ChevronDownIcon } from './icons'

interface AgentSelectProps {
  id: string
  label: string
  value: string | null
  onChange: (agent: Agent) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
}

const popupClass =
  'absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-line-strong bg-surface p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)]'

// Combobox (WAI-ARIA 1.2, lista com filtro): o foco fica sempre no campo e `aria-activedescendant` aponta a
// opção destacada. Só texto: lista agrupada por função, com busca por nome.
export function AgentSelect({ id, label, value, onChange, onBlur, invalid, describedBy }: AgentSelectProps) {
  const { status, agents, byId, retry } = useAgents()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const groups = useMemo(() => groupAgents(filterAgents(agents, query)), [agents, query])
  const flat = useMemo(() => groups.flatMap((group) => group.agents), [groups])
  const selected = value ? byId.get(value) : undefined
  // Se o destaque saiu da lista (a busca mudou), o primeiro resultado passa a ser o ativo.
  const active = flat.find((agent) => agent.id === activeId) ?? flat[0]
  const activeDomId = active ? `${listboxId}-opt-${active.id}` : undefined
  const listVisible = open && status === 'ready'

  useEffect(() => {
    if (listVisible && activeDomId) document.getElementById(activeDomId)?.scrollIntoView({ block: 'nearest' })
  }, [listVisible, activeDomId])

  function openList() {
    setOpen(true)
    setActiveId(value)
  }

  function closeList() {
    setOpen(false)
    setQuery('')
  }

  function select(agent: Agent) {
    onChange(agent)
    closeList()
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        openList()
        return
      }
      if (flat.length === 0) return
      const index = active ? flat.indexOf(active) : -1
      const next = e.key === 'ArrowDown' ? Math.min(index + 1, flat.length - 1) : Math.max(index - 1, 0)
      setActiveId(flat[next].id)
    } else if (e.key === 'Enter' && open) {
      // Com a lista aberta, Enter escolhe a opção; nunca envia o formulário por acidente.
      e.preventDefault()
      if (active) select(active)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      closeList()
    }
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={listVisible}
          aria-controls={listVisible && flat.length > 0 ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={listVisible ? activeDomId : undefined}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck={false}
          disabled={status !== 'ready'}
          value={open ? query : (selected?.name ?? '')}
          placeholder={status === 'ready' ? 'Buscar agente (ex: Jett, Sova, Omen)' : 'Carregando agentes...'}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={openList}
          onClick={() => {
            if (!open) openList()
          }}
          onBlur={() => {
            closeList()
            onBlur?.()
          }}
          className={`${inputClass} pr-10 disabled:cursor-wait disabled:opacity-60 ${invalid ? 'border-danger/60!' : ''}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-ink-muted">
          <ChevronDownIcon className="h-4 w-4" />
        </span>

        {listVisible &&
          (flat.length > 0 ? (
            // mousedown sem preventDefault tiraria o foco do campo antes do clique na opção.
            <div id={listboxId} role="listbox" aria-label={label} onMouseDown={(e) => e.preventDefault()} className={popupClass}>
              {groups.map((group) => {
                const headingId = `${listboxId}-group-${group.role}`
                return (
                  <div key={group.role} role="group" aria-labelledby={headingId}>
                    <div
                      id={headingId}
                      className={`px-3 pt-2 pb-1 text-[11px] leading-4 font-semibold tracking-[0.04em] uppercase ${ROLE_TEXT_CLASS[group.role]}`}
                    >
                      {ROLE_INFO[group.role].label}
                    </div>
                    {group.agents.map((agent) => {
                      const isActive = agent.id === active?.id
                      const isSelected = agent.id === value
                      return (
                        <div
                          key={agent.id}
                          id={`${listboxId}-opt-${agent.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onMouseMove={() => setActiveId(agent.id)}
                          onClick={() => select(agent)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                            isActive ? 'bg-brand/15 text-ink' : 'text-ink-muted'
                          } ${isSelected ? 'font-semibold text-ink' : ''}`}
                        >
                          <span>{agent.name}</span>
                          {isSelected && (
                            <span aria-hidden="true" className="text-match">
                              ✓
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={popupClass} onMouseDown={(e) => e.preventDefault()}>
              <p role="status" className="px-3 py-3 text-sm text-ink-muted">
                Nenhum agente encontrado
              </p>
            </div>
          ))}
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          Não foi possível carregar os agentes.{' '}
          <button type="button" onClick={retry} className={`${textButtonClass} text-xs! underline`}>
            Tentar de novo
          </button>
        </p>
      )}
    </div>
  )
}
