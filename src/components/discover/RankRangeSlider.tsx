import { RANK_INFO, RANK_VALUES, type RankType } from '../../lib/gameData'

const LAST_INDEX = RANK_VALUES.length - 1
const THUMB_RADIUS_PX = 11

interface RankRangeSliderProps {
  min: RankType
  max: RankType
  onChange: (min: RankType, max: RankType) => void
}

export function RankRangeSlider({ min, max, onChange }: RankRangeSliderProps) {
  const minIndex = RANK_VALUES.indexOf(min)
  const maxIndex = RANK_VALUES.indexOf(max)
  const percent = (index: number) => (index / LAST_INDEX) * 100
  // Com os dois polegares na ponta direita, o mínimo precisa ficar por cima para poder voltar.
  const minOnTop = minIndex === LAST_INDEX

  return (
    <div>
      <div className="relative h-6">
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line"
          style={{ left: THUMB_RADIUS_PX, right: THUMB_RADIUS_PX }}
        >
          <div
            className="absolute h-full rounded-full bg-linear-to-r from-brand to-match"
            style={{ left: `${percent(minIndex)}%`, width: `${percent(maxIndex) - percent(minIndex)}%` }}
          />
          {RANK_VALUES.map((rank, index) => (
            <span
              key={rank}
              aria-hidden="true"
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
              style={{ left: `${percent(index)}%`, backgroundColor: RANK_INFO[rank].color }}
            />
          ))}
        </div>

        <input
          type="range"
          className="rank-range absolute inset-0 h-full w-full"
          style={{ zIndex: minOnTop ? 4 : 3 }}
          min={0}
          max={LAST_INDEX}
          step={1}
          value={minIndex}
          aria-label="Rank mínimo"
          aria-valuetext={RANK_INFO[min].label}
          onChange={(e) => onChange(RANK_VALUES[Math.min(Number(e.target.value), maxIndex)], max)}
        />
        <input
          type="range"
          className="rank-range absolute inset-0 h-full w-full"
          style={{ zIndex: 3 }}
          min={0}
          max={LAST_INDEX}
          step={1}
          value={maxIndex}
          aria-label="Rank máximo"
          aria-valuetext={RANK_INFO[max].label}
          onChange={(e) => onChange(min, RANK_VALUES[Math.max(Number(e.target.value), minIndex)])}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-ink-muted">
        <span>{RANK_INFO[RANK_VALUES[0]].label}</span>
        <span>{RANK_INFO[RANK_VALUES[LAST_INDEX]].label}</span>
      </div>
    </div>
  )
}
