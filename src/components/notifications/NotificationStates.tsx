import { focusRing } from '../formStyles'
import { BellIcon } from '../icons'

export function NotificationsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Carregando notificações">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-line" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-48 max-w-full rounded bg-line" />
            <div className="h-3 w-16 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  )
}

const cardClass = 'flex flex-col items-center rounded-2xl border border-line bg-surface/60 px-6 py-12 text-center'

export function NotificationsEmpty() {
  return (
    <div className={cardClass}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line-strong bg-field text-ink-muted">
        <BellIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">Nenhuma notificação ainda</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-5 text-ink-muted">
        Quando você der match com alguém, o aviso aparece aqui.
      </p>
    </div>
  )
}

export function NotificationsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className={cardClass}>
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">Não foi possível carregar suas notificações</h2>
      <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">Verifique sua conexão e tente de novo.</p>
      <button
        type="button"
        onClick={onRetry}
        className={`mt-5 cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
      >
        Tentar novamente
      </button>
    </div>
  )
}
