import { RANK_INFO, ROLE_INFO, type RankType, type RoleType } from '../../lib/gameData'
import { ArrowRightIcon, CheckIcon } from '../icons'
import { RoleIcon } from '../RoleIcon'

interface SamplePlayer {
  initials: string
  name: string
  role: RoleType
  rank: RankType
  gradient: string
}

const CARD_PLAYERS: [SamplePlayer, SamplePlayer] = [
  { initials: 'VX', name: 'ViperX', role: 'controller', rank: 'ascendant', gradient: 'from-brand to-indigo-500' },
  { initials: 'RG', name: 'ReynaGod', role: 'duelist', rank: 'ascendant', gradient: 'from-match to-sky-600' },
]

function Player({ player, alignEnd }: { player: SamplePlayer; alignEnd?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${alignEnd ? 'flex-row-reverse text-right' : ''}`}>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-sm font-bold text-ink ${player.gradient}`}
      >
        {player.initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{player.name}</p>
        <p
          className={`mt-0.5 flex items-center gap-1.5 text-xs text-match ${alignEnd ? 'justify-end' : ''}`}
        >
          <RoleIcon role={player.role} className="h-3.5 w-3.5" />
          {ROLE_INFO[player.role].label}
        </p>
        <p className={`mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted ${alignEnd ? 'justify-end' : ''}`}>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: RANK_INFO[player.rank].color }}
          />
          {RANK_INFO[player.rank].label}
        </p>
      </div>
    </div>
  )
}

export function DuoSampleCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-line-strong bg-surface/80 p-5 backdrop-blur ${className}`}
    >
      <p className="text-[11px] leading-4 font-semibold tracking-[0.04em] text-ink-muted uppercase">
        Exemplo de duo
      </p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <Player player={CARD_PLAYERS[0]} />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-field text-match">
          <ArrowRightIcon className="h-4 w-4" />
        </span>
        <Player player={CARD_PLAYERS[1]} alignEnd />
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 text-xs text-ink-muted">
        {['Funções complementares', 'Mesmo elo', 'Mesmo horário'].map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <CheckIcon className="h-3.5 w-3.5 text-ready" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
