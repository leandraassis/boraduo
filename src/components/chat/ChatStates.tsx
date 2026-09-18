import { Link } from 'react-router-dom'
import { focusRing } from '../formStyles'
import { ChatIcon, LockIcon } from '../icons'

export function ChatPlaceholder() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line-strong bg-field text-match">
        <ChatIcon className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-ink">Selecione uma conversa</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-5 text-ink-muted">
        Escolha um match na lista para ver as mensagens e continuar o papo.
      </p>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="Carregando conversa">
      <div className="flex animate-pulse items-center gap-3 border-b border-line px-4 py-3 lg:px-5">
        <div className="h-11 w-11 rounded-xl bg-line" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-line" />
          <div className="h-3 w-24 rounded bg-line" />
        </div>
      </div>
      <div className="flex-1 animate-pulse space-y-3 px-4 py-6 lg:px-5">
        <div className="h-9 w-48 rounded-2xl bg-surface" />
        <div className="ml-auto h-9 w-40 rounded-2xl bg-line" />
        <div className="h-14 w-64 rounded-2xl bg-surface" />
        <div className="ml-auto h-9 w-52 rounded-2xl bg-line" />
      </div>
    </div>
  )
}

export function ChatNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">Conversa não encontrada</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-5 text-ink-muted">
        Este match não existe ou você não tem acesso a ele.
      </p>
      <Link
        to="/app/matches"
        className={`mt-5 rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
      >
        Voltar para as conversas
      </Link>
    </div>
  )
}

export function ChatError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">Não foi possível carregar as mensagens</h2>
      <p className="mt-2 text-sm text-ink-muted">Verifique sua conexão e tente de novo.</p>
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

export function ReadOnlyNotice() {
  return (
    <div role="status" className="flex items-start gap-3 border-t border-line bg-surface/80 px-4 py-4 lg:px-5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-field text-ink-muted">
        <LockIcon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">Esta conversa não está mais ativa</p>
        <p className="mt-0.5 text-xs leading-4 text-ink-muted">
          Você ainda pode ver o histórico, mas não é possível enviar novas mensagens.
        </p>
      </div>
    </div>
  )
}
