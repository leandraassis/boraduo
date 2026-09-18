import { isDefaultFilters, type DeckFilters } from '../../lib/deck'
import type { ScheduleWindow } from '../../lib/gameData'
import { focusRing } from '../formStyles'
import { FunnelIcon } from '../icons'
import { FilterSheet } from './FilterSheet'

interface FilterControlProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DeckFilters
  mySchedule: ScheduleWindow[]
  onApply: (filters: DeckFilters) => void
}

export function FilterControl({ open, onOpenChange, filters, mySchedule, onApply }: FilterControlProps) {
  const active = !isDefaultFilters(filters)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={active ? 'Filtros (ativos)' : 'Filtros'}
        onClick={() => onOpenChange(!open)}
        className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border bg-surface transition hover:border-brand ${focusRing} ${
          active ? 'border-brand text-ink' : 'border-line-strong text-ink-muted hover:text-ink'
        }`}
      >
        <FunnelIcon className="h-5 w-5" />
        {active && (
          <span
            data-testid="filters-active-dot"
            className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-match ring-2 ring-surface"
          />
        )}
      </button>

      {open && (
        <FilterSheet
          filters={filters}
          mySchedule={mySchedule}
          onApply={(next) => {
            onApply(next)
            onOpenChange(false)
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
    </div>
  )
}
