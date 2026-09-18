import { useState, type FormEvent } from 'react'
import type { Enums } from '../../types/database'
import { RankSelector } from './RankSelector'
import { RoleSelector } from './RoleSelector'

interface StepGameProfileProps {
  role: Enums<'role_type'> | null
  mainAgent: string
  rank: Enums<'rank_type'> | null
  onRoleChange: (value: Enums<'role_type'>) => void
  onMainAgentChange: (value: string) => void
  onRankChange: (value: Enums<'rank_type'>) => void
  onNext: () => void
}

export function StepGameProfile({
  role,
  mainAgent,
  rank,
  onRoleChange,
  onMainAgentChange,
  onRankChange,
  onNext,
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
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Função</p>
        <RoleSelector value={role} onChange={onRoleChange} />
        {touched && role === null && <p className="mt-1 text-xs text-red-400">Escolha uma função</p>}
      </div>

      <div>
        <label htmlFor="mainAgent" className="mb-1 block text-sm font-medium text-neutral-300">
          Agente principal
        </label>
        <input
          id="mainAgent"
          type="text"
          value={mainAgent}
          onChange={(e) => onMainAgentChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
          placeholder="Ex: Jett, Sova, Omen..."
        />
        {touched && mainAgentError && <p className="mt-1 text-xs text-red-400">{mainAgentError}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Rank</p>
        <RankSelector value={rank} onChange={onRankChange} />
        {touched && rank === null && <p className="mt-1 text-xs text-red-400">Escolha um rank</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition hover:bg-purple-500"
      >
        Continuar
      </button>
    </form>
  )
}
