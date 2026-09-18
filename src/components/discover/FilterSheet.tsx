import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DEFAULT_FILTERS,
  HIGHEST_RANK,
  LOWEST_RANK,
  type DeckFilters,
} from '../../lib/deck'
import {
  RANK_INFO,
  ROLE_INFO,
  ROLE_VALUES,
  SCHEDULE_WINDOWS,
  type RoleType,
  type ScheduleWindow,
} from '../../lib/gameData'
import { focusRing, primaryButtonClass, smallLabelClass } from '../formStyles'
import { CloseIcon } from '../icons'
import { RoleIcon } from '../RoleIcon'
import { Switch } from '../Switch'
import { RankRangeSlider } from './RankRangeSlider'

interface FilterSheetProps {
  filters: DeckFilters
  mySchedule: ScheduleWindow[]
  onApply: (filters: DeckFilters) => void
  onClose: () => void
}

function rangeLabel(filters: DeckFilters): string {
  if (filters.minRank === LOWEST_RANK && filters.maxRank === HIGHEST_RANK) return 'Todos os ranks'
  if (filters.minRank === filters.maxRank) return RANK_INFO[filters.minRank].label
  return `${RANK_INFO[filters.minRank].label} – ${RANK_INFO[filters.maxRank].label}`
}

export function FilterSheet({ filters, mySchedule, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<DeckFilters>(filters)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const hasSchedule = mySchedule.length > 0

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleRole(role: RoleType) {
    setDraft((d) => ({
      ...d,
      roles: d.roles.includes(role) ? d.roles.filter((r) => r !== role) : [...d.roles, role],
    }))
  }

  const scheduleNames = mySchedule
    .map((value) => SCHEDULE_WINDOWS.find((w) => w.value === value)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        className="sheet-enter fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-b-0 border-line-strong bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:absolute md:inset-x-auto md:top-full md:right-0 md:bottom-auto md:mt-3 md:max-h-none md:w-[400px] md:rounded-2xl md:border md:pb-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">Filtros</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar filtros"
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:text-ink ${focusRing}`}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className={smallLabelClass}>Função</h3>
            <span className="text-xs text-ink-muted">
              {draft.roles.length === 0 ? 'Todas' : `${draft.roles.length} selecionada${draft.roles.length > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE_VALUES.map((role) => {
              const selected = draft.roles.includes(role)
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleRole(role)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${focusRing} ${
                    selected
                      ? 'border-brand bg-brand/15 text-ink'
                      : 'border-line bg-field text-ink-muted hover:border-line-strong'
                  }`}
                >
                  <span className={selected ? 'text-match' : ''}>
                    <RoleIcon role={role} className="h-4 w-4" />
                  </span>
                  {ROLE_INFO[role].label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className={smallLabelClass}>Rank</h3>
            <span className="text-xs text-ink-muted" aria-live="polite">
              {rangeLabel(draft)}
            </span>
          </div>
          <RankRangeSlider
            min={draft.minRank}
            max={draft.maxRank}
            onChange={(minRank, maxRank) => setDraft((d) => ({ ...d, minRank, maxRank }))}
          />
        </section>

        <section className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-line bg-field/60 p-4">
          <div className="min-w-0">
            <p id="filter-schedule-label" className="text-sm font-semibold text-ink">
              Usar meu horário como filtro
            </p>
            <p id="filter-schedule-hint" className="mt-1 text-xs leading-4 text-ink-muted">
              {hasSchedule ? (
                <>Mostra só quem joga em horários em comum com os seus ({scheduleNames}).</>
              ) : (
                <>
                  Defina seus horários no{' '}
                  <Link to="/app/profile" className="font-medium text-match hover:underline">
                    perfil
                  </Link>{' '}
                  para usar este filtro.
                </>
              )}
            </p>
          </div>
          <Switch
            checked={draft.useMySchedule && hasSchedule}
            onChange={(useMySchedule) => setDraft((d) => ({ ...d, useMySchedule }))}
            labelledBy="filter-schedule-label"
            describedBy="filter-schedule-hint"
            disabled={!hasSchedule}
          />
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className={`cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-3.5 text-sm font-medium text-ink-muted transition hover:text-ink ${focusRing}`}
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={() => onApply({ ...draft, useMySchedule: draft.useMySchedule && hasSchedule })}
            className={`${primaryButtonClass} flex-1`}
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  )
}
