import { focusRing } from './formStyles'

// Carregamento de tela inteira (guards de rota): esqueleto de lista em vez de tela em branco ou spinner.
export function ScreenSkeleton() {
  return (
    <div className="min-h-dvh bg-canvas font-inter" role="status" aria-busy="true" aria-label="Carregando">
      <div className="mx-auto w-full max-w-[480px] animate-pulse px-4 pt-6 md:max-w-[640px]">
        <div className="h-8 w-40 rounded-lg bg-surface" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-line" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="h-4 w-32 rounded bg-line" />
                <div className="h-3 w-44 max-w-full rounded bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Falha de rede em tela inteira, com retry.
export function ScreenError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 font-inter text-ink">
      <div role="alert" className="w-full max-w-sm rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center">
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-5 text-ink-muted">Verifique sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={onRetry}
          className={`mt-5 cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
