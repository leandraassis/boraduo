import { focusRing, primaryButtonClass } from '../formStyles'
import { FunnelIcon } from '../icons'

export function DeckSkeleton() {
  return (
    <>
      <div
        className="relative min-h-[420px] flex-1 animate-pulse md:max-h-[640px]"
        role="status"
        aria-busy="true"
        aria-label="Carregando perfis"
      >
        <div className="absolute inset-x-3 top-3 bottom-0 rounded-2xl border border-line bg-surface/60" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 bottom-4 rounded-2xl border border-line bg-surface" aria-hidden="true">
          <div className="absolute inset-x-5 bottom-5 space-y-3">
            <div className="h-7 w-40 rounded-lg bg-line" />
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-lg bg-line" />
              <div className="h-7 w-28 rounded-lg bg-line" />
              <div className="h-7 w-16 rounded-lg bg-line" />
            </div>
            <div className="h-4 w-full rounded bg-line" />
            <div className="h-4 w-2/3 rounded bg-line" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex animate-pulse items-start justify-center gap-10" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-surface" />
          <div className="h-3 w-10 rounded bg-surface" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-surface" />
          <div className="h-3 w-10 rounded bg-surface" />
        </div>
      </div>
    </>
  )
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="h-36 w-44" fill="none" aria-hidden="true">
      <circle cx="100" cy="82" r="62" stroke="#2a2a36" strokeWidth="1.5" strokeDasharray="4 6" />
      <circle cx="100" cy="82" r="38" stroke="#38384a" strokeWidth="1.5" />
      <rect x="52" y="44" width="70" height="92" rx="12" transform="rotate(-9 52 44)" fill="#1c1c24" stroke="#38384a" strokeWidth="1.5" />
      <rect x="78" y="34" width="70" height="92" rx="12" transform="rotate(8 78 34)" fill="#1c1c24" stroke="#7c3aed" strokeWidth="1.5" />
      <circle cx="122" cy="68" r="12" fill="#7c3aed" fillOpacity="0.25" stroke="#7c3aed" strokeWidth="1.5" />
      <path d="M100 100h44M108 112h28" stroke="#38384a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="158" cy="118" r="18" fill="#0f0f14" stroke="#22d3ee" strokeWidth="2" />
      <path d="m171 131 12 12" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      <path d="M152 118h12" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function DeckEmptyState({ onAdjustFilters }: { onAdjustFilters: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center">
      <EmptyIllustration />
      <h2 className="mt-4 text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
        Sem mais perfis por enquanto
      </h2>
      <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">
        Volte mais tarde ou ajuste seus filtros para ver mais jogadores.
      </p>
      <button type="button" onClick={onAdjustFilters} className={`${primaryButtonClass} mt-6 max-w-[240px]`}>
        <FunnelIcon className="h-4 w-4" />
        Ajustar filtros
      </button>
    </div>
  )
}

export function DeckError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center"
    >
      <h2 className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">Não foi possível carregar os perfis</h2>
      <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">Verifique sua conexão e tente de novo.</p>
      <button
        type="button"
        onClick={onRetry}
        className={`mt-6 cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
      >
        Tentar novamente
      </button>
    </div>
  )
}
