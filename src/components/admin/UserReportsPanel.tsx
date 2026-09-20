import { useEffect, useState } from 'react'
import { fetchUserReports, type AdminReport } from '../../lib/admin'
import { REPORT_CATEGORIES } from '../../lib/moderation'
import { focusRing } from '../formStyles'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const categoryLabel = (category: AdminReport['category']) => REPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category

interface PanelState {
  attempt: number
  status: 'loading' | 'ready' | 'error'
  reports: AdminReport[]
}

interface UserReportsPanelProps {
  id: string
  userId: string
}

// Carrega sob demanda (só quando o admin expande). O texto da denúncia é conteúdo de usuário: sempre como texto.
export function UserReportsPanel({ id, userId }: UserReportsPanelProps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<PanelState>({ attempt: 0, status: 'loading', reports: [] })

  if (state.attempt !== attempt) {
    setState({ attempt, status: 'loading', reports: [] })
  }

  useEffect(() => {
    let cancelled = false
    fetchUserReports(userId)
      .then((reports) => {
        if (!cancelled) setState((s) => (s.attempt === attempt ? { ...s, status: 'ready', reports } : s))
      })
      .catch(() => {
        if (!cancelled) setState((s) => (s.attempt === attempt ? { ...s, status: 'error' } : s))
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  return (
    <div id={id} className="mt-3 border-t border-line pt-3">
      {state.status === 'loading' && (
        <div role="status" aria-busy="true" aria-label="Carregando denúncias" className="space-y-2">
          <div className="h-3.5 w-40 animate-pulse rounded bg-line" />
          <div className="h-3 w-full animate-pulse rounded bg-line" />
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="text-sm">
          <p className="text-danger">Não foi possível carregar as denúncias.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className={`mt-1 cursor-pointer text-sm font-medium text-match hover:underline ${focusRing}`}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {state.status === 'ready' && state.reports.length === 0 && <p className="text-sm text-ink-muted">Nenhuma denúncia contra este usuário.</p>}

      {state.status === 'ready' && state.reports.length > 0 && (
        <ul className="space-y-3">
          {state.reports.map((report) => (
            <li key={report.id} data-testid="admin-report" data-pending={report.pending ? 'true' : 'false'}>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span className="font-semibold text-ink">{categoryLabel(report.category)}</span>
                <span className={report.pending ? 'font-semibold text-danger' : 'text-ink-muted'}>{report.pending ? 'Pendente' : 'Revisada'}</span>
                <span className="text-ink-muted">{dateFormat.format(new Date(report.createdAt))}</span>
              </p>
              {report.details && <p className="mt-1 text-sm leading-5 break-words whitespace-pre-wrap text-ink">{report.details}</p>}
              <p className="mt-0.5 text-xs text-ink-muted">Denunciado por {report.reporterUsername ?? 'conta removida'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
