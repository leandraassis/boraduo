import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LEGAL_DRAFT, TERMS_UPDATED_LABEL, TERMS_VERSION } from '../../lib/legal'
import { AuthLayout } from '../auth/AuthLayout'
import { textButtonClass } from '../formStyles'
import { ArrowLeftIcon } from '../icons'

export function Fill({ children }: { children: string }) {
  if (!children.startsWith('[PREENCHER')) return <>{children}</>
  return <mark className="rounded bg-danger/15 px-1 font-medium text-danger">{children}</mark>
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mt-9 text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-ink-muted">{children}</div>
    </section>
  )
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

interface LegalLayoutProps {
  title: string
  intro: string
  children: ReactNode
  otherPage: { to: string; label: string }
}

export function LegalLayout({ title, intro, children, otherPage }: LegalLayoutProps) {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash])

  return (
    <AuthLayout>
      <article className="mx-auto w-full max-w-[720px] pb-4">
        <Link to="/login" className={textButtonClass}>
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="mt-4 text-[28px] leading-9 font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1 text-xs text-ink-muted">
          Versão {TERMS_VERSION} · Última atualização: {TERMS_UPDATED_LABEL}
        </p>

        {LEGAL_DRAFT && (
          <p role="note" className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            Rascunho em revisão: este texto ainda será revisado juridicamente.
          </p>
        )}

        <p className="mt-6 text-sm leading-6 text-ink-muted">{intro}</p>

        {children}

        <p className="mt-10 border-t border-line pt-5 text-sm">
          <Link to={otherPage.to} className="font-semibold text-match hover:underline">
            {otherPage.label}
          </Link>
        </p>
      </article>
    </AuthLayout>
  )
}
