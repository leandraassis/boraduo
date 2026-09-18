import type { Enums } from '../../types/database'

type RankType = Enums<'rank_type'>

const RANKS: { value: RankType; label: string; color: string }[] = [
  { value: 'iron', label: 'Iron', color: '#5c5c5c' },
  { value: 'bronze', label: 'Bronze', color: '#a9784f' },
  { value: 'silver', label: 'Silver', color: '#c7cdd6' },
  { value: 'gold', label: 'Gold', color: '#e8c34c' },
  { value: 'platinum', label: 'Platinum', color: '#57c6c1' },
  { value: 'diamond', label: 'Diamond', color: '#b48cf0' },
  { value: 'ascendant', label: 'Ascendant', color: '#4bd18a' },
  { value: 'immortal', label: 'Immortal', color: '#c0577d' },
  { value: 'radiant', label: 'Radiant', color: '#fdf4b0' },
]

interface RankSelectorProps {
  value: RankType | null
  onChange: (value: RankType) => void
}

export function RankSelector({ value, onChange }: RankSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Rank">
      {RANKS.map((r) => {
        const selected = value === r.value
        return (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(r.value)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition ${
              selected ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-500'
            }`}
          >
            <span className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ backgroundColor: r.color }} />
            <span className={`text-xs font-medium ${selected ? 'text-purple-300' : 'text-neutral-300'}`}>
              {r.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
