import { optionClass } from './formStyles'
import { RANK_INFO, RANK_VALUES, type RankType } from '../lib/gameData'

interface RankSelectorProps {
  value: RankType | null
  onChange: (value: RankType) => void
}

export function RankSelector({ value, onChange }: RankSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Rank">
      {RANK_VALUES.map((rank) => {
        const selected = value === rank
        return (
          <button
            key={rank}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(rank)}
            className={`flex flex-col items-center gap-1.5 px-2 py-3 ${optionClass(selected)}`}
          >
            <span
              className="h-3.5 w-3.5 rounded-full ring-1 ring-black/30"
              style={{ backgroundColor: RANK_INFO[rank].color }}
              aria-hidden="true"
            />
            <span className={`text-xs font-medium ${selected ? 'text-ink' : 'text-ink-muted'}`}>
              {RANK_INFO[rank].label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
