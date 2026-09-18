import { useEffect, useRef } from 'react'
import type { CelebratedMatch } from '../../hooks/useMatchCelebration'
import { RANK_INFO, type RankType } from '../../lib/gameData'
import { Avatar } from '../Avatar'
import { focusRing, primaryButtonClass } from '../formStyles'
import { BoltIcon, ChatIcon } from '../icons'

export interface MatchCelebrationMe {
  username: string
  avatarUrl: string | null
  rank: RankType
}

interface MatchCelebrationModalProps {
  me: MatchCelebrationMe | null
  match: CelebratedMatch
  onSendMessage: () => void
  onDismiss: () => void
}

function Player({ name, label, avatarUrl, rank }: { name: string; label: string; avatarUrl: string | null; rank: RankType | null }) {
  return (
    <div className="flex w-28 min-w-0 flex-col items-center text-center">
      <Avatar url={avatarUrl} name={name} className="h-24 w-24 rounded-2xl" />
      <p className="mt-3 w-full truncate text-base font-semibold text-ink">{label}</p>
      {rank && (
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_INFO[rank].color }} aria-hidden="true" />
          {RANK_INFO[rank].label}
        </p>
      )}
    </div>
  )
}

export function MatchCelebrationModal({ me, match, onSendMessage, onDismiss }: MatchCelebrationModalProps) {
  const ctaRef = useRef<HTMLButtonElement>(null)
  const { other } = match

  useEffect(() => {
    ctaRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      aria-describedby="match-description"
      data-testid="match-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/95 p-4 backdrop-blur-[20px]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_30%,rgba(124,58,237,0.28),transparent)]" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-line-strong bg-surface p-6 text-center shadow-glow-brand">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand-soft via-match to-ready" />

        <h2 id="match-title" className="text-3xl leading-9 font-bold tracking-[-0.02em] text-ink">
          É um <span className="bg-linear-to-r from-brand-soft to-match bg-clip-text text-transparent">match!</span>
        </h2>
        <p id="match-description" className="mx-auto mt-2 max-w-[280px] text-sm leading-5 text-ink-muted">
          Você e <span className="font-semibold text-match">{other.username}</span> curtiram um ao outro. Bora jogar?
        </p>

        <div className="mt-8 flex items-start justify-center gap-2">
          <Player
            name={me?.username ?? 'Você'}
            label="Você"
            avatarUrl={me?.avatarUrl ?? null}
            rank={me?.rank ?? null}
          />
          <span className="mt-8 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-field text-match">
            <BoltIcon className="h-5 w-5" />
          </span>
          <Player name={other.username} label={other.username} avatarUrl={other.avatarUrl} rank={other.rank} />
        </div>

        <button ref={ctaRef} type="button" onClick={onSendMessage} className={`${primaryButtonClass} mt-8`}>
          <ChatIcon className="h-4 w-4" />
          Enviar mensagem
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={`mt-2 w-full cursor-pointer rounded-xl py-3 text-sm font-medium text-ink-muted transition hover:text-ink ${focusRing}`}
        >
          Continuar vendo perfis
        </button>
      </div>
    </div>
  )
}
