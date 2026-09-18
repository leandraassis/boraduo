import { useState, type FormEvent } from 'react'
import type { RankType, RoleType } from '../../lib/gameData'
import { MAIN_AGENT_MAX_LENGTH } from '../../lib/profileLimits'
import { TextField } from '../auth/TextField'
import { FormSection } from '../FormSection'
import { primaryButtonClass, textButtonClass } from '../formStyles'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'
import { RankSelector } from '../RankSelector'
import { RoleSelector } from '../RoleSelector'

interface StepGameProfileProps {
  role: RoleType | null
  mainAgent: string
  rank: RankType | null
  onRoleChange: (value: RoleType) => void
  onMainAgentChange: (value: string) => void
  onRankChange: (value: RankType) => void
  onNext: () => void
  onBack: () => void
}

export function StepGameProfile({
  role,
  mainAgent,
  rank,
  onRoleChange,
  onMainAgentChange,
  onRankChange,
  onNext,
  onBack,
}: StepGameProfileProps) {
  const [touched, setTouched] = useState(false)
  const mainAgentError = mainAgent.trim().length === 0 ? 'Agente principal obrigatório' : null
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
        <TextField
          id="mainAgent"
          label="Agente principal"
          hideLabel
          value={mainAgent}
          onChange={onMainAgentChange}
          onBlur={() => setTouched(true)}
          maxLength={MAIN_AGENT_MAX_LENGTH}
          placeholder="Ex: Jett, Sova, Omen..."
          error={touched ? mainAgentError : null}
        />
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
