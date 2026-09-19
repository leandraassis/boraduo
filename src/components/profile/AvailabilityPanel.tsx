import { useAvailability } from '../../contexts/availability'

export function AvailabilityPanel() {
  const { isAvailable: available, loaded, loadFailed, retryLoad, saving, error, requestToggle } = useAvailability()

  return (
    <section
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        available ? 'border-ready/40 bg-ready/5 shadow-glow-ready' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-labelledby="availability-title"
          disabled={saving || !loaded}
          onClick={requestToggle}
          className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match disabled:cursor-wait disabled:opacity-60 ${
            available ? 'border-ready bg-ready' : 'border-line-strong bg-field'
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-ink shadow transition-transform ${
              available ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>

        <div className="min-w-0">
          <p id="availability-title" className="flex items-center gap-2 text-base font-semibold text-ink">
            {available && <span className="h-2 w-2 shrink-0 rounded-full bg-ready" aria-hidden="true" />}
            Estou disponível agora
          </p>
          <p
            className={`mt-0.5 text-[11px] leading-4 font-semibold tracking-[0.04em] uppercase ${
              available ? 'text-ready' : 'text-ink-muted'
            }`}
          >
            {available
              ? 'Qualquer jogador pode te chamar direto'
              : 'Ative para aparecer em “Disponíveis agora”'}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {loadFailed && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Não foi possível carregar sua disponibilidade.{' '}
          <button type="button" onClick={retryLoad} className="cursor-pointer font-medium text-match hover:underline">
            Tentar novamente
          </button>
        </p>
      )}
    </section>
  )
}
