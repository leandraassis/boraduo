import { useAvailability } from '../../contexts/availability'
import { Switch } from '../Switch'

export function AvailableToggleBar() {
  const { isAvailable, loaded, loadFailed, retryLoad, saving, error, requestToggle } = useAvailability()

  return (
    <section
      className={`rounded-2xl border p-3.5 transition-colors ${
        isAvailable ? 'border-ready/40 bg-ready/5' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-3">
        <Switch
          checked={isAvailable}
          onChange={() => requestToggle()}
          labelledBy="discover-availability-label"
          disabled={saving || !loaded}
        />
        <div className="min-w-0">
          <p id="discover-availability-label" className="text-sm font-semibold text-ink">
            Estou disponível
          </p>
          <p className="mt-0.5 text-xs leading-4 text-ink-muted">
            {isAvailable
              ? 'Você aparece aqui para quem estiver conectado agora.'
              : 'Ative para aparecer na lista de outros jogadores.'}
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      {loadFailed && (
        <p role="alert" className="mt-2 text-xs text-danger">
          Não foi possível carregar sua disponibilidade.{' '}
          <button type="button" onClick={retryLoad} className="cursor-pointer font-medium text-match hover:underline">
            Tentar novamente
          </button>
        </p>
      )}
    </section>
  )
}
