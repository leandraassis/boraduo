import { useState, type FormEvent } from 'react'
import type { Agent } from '../../lib/agents'
import type { RankType, RoleType } from '../../lib/gameData'
import { AgentSelect } from '../AgentSelect'
import { FormSection } from '../FormSection'
import { primaryButtonClass, textButtonClass } from '../formStyles'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'
import { RankSelector } from '../RankSelector'
import { RoleSelector } from '../RoleSelector'

interface StepGameProfileProps {
  role: RoleType | null
  mainAgentId: string | null
  rank: RankType | null
  onRoleChange: (value: RoleType) => void
  onAgentChange: (agent: Agent) => void
  onRankChange: (value: RankType) => void
  onNext: () => void
  onBack: () => void
}

export function StepGameProfile({
  role,
  mainAgentId,
  rank,
  onRoleChange,
  onAgentChange,
  onRankChange,
  onNext,
  onBack,
}: StepGameProfileProps) {
  const [touched, setTouched] = useState(false)
  const mainAgentError = mainAgentId === null ? 'Agente principal obrigatório' : null
  const isValid = role !== null && rank !== null && !mainAgentError

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    onNext()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormSection title="Função principal" aside="Selecione 1">
        <RoleSelector value={role} onChange={onRoleChange} />
        {touched && role === null && (
          <p role="alert" className="mt-2 text-xs text-danger">
            Escolha uma função
          </p>
        )}
      </FormSection>

      <FormSection title="Agente principal">
        <AgentSelect
          id="mainAgent"
          label="Agente principal"
          value={mainAgentId}
          onChange={onAgentChange}
          onBlur={() => setTouched(true)}
          invalid={touched && mainAgentError !== null}
          describedBy={touched && mainAgentError ? 'mainAgent-error' : undefined}
        />
        {touched && mainAgentError && (
          <p id="mainAgent-error" role="alert" className="mt-1.5 text-xs text-danger">
            {mainAgentError}
          </p>
        )}
      </FormSection>

      <FormSection title="Rank" aside="Autodeclarado">
        <RankSelector value={rank} onChange={onRankChange} />
        {touched && rank === null && (
          <p role="alert" className="mt-2 text-xs text-danger">
            Escolha um rank
          </p>
        )}
      </FormSection>

      <button type="submit" className={primaryButtonClass}>
        Continuar para bio
        <ArrowRightIcon className="h-4 w-4" />
      </button>

      <div>
        <button type="button" onClick={onBack} className={textButtonClass}>
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar ao passo anterior
        </button>
      </div>
    </form>
  )
}
