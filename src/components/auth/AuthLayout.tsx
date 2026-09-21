import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

const backgroundStyle = {
  backgroundImage: [
    'radial-gradient(60% 45% at 0% 0%, rgba(124, 58, 237, 0.2), transparent 70%)',
    'radial-gradient(50% 40% at 100% 100%, rgba(34, 211, 238, 0.1), transparent 70%)',
    'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: 'auto, auto, 36px 36px, 36px 36px',
}

export function AuthLayout({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className="relative isolate min-h-screen bg-canvas font-inter text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={backgroundStyle} />

      <div className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-5 lg:py-8">
          <Logo />
          <span className="hidden items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-ink-muted uppercase backdrop-blur sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ready" aria-hidden="true" />
            Comunidade tática de Valorant
          </span>
        </header>

        <main className={`flex flex-1 flex-col pb-10 ${centered ? 'justify-center' : ''}`}>{children}</main>

        <footer className="border-t border-line py-6 text-center text-xs leading-5 text-ink-muted">
          <nav aria-label="Documentos legais" className="mb-2 flex justify-center gap-4">
            <Link to="/termos" className="font-medium hover:text-ink hover:underline">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="font-medium hover:text-ink hover:underline">
              Política de Privacidade
            </Link>
          </nav>
          BoraDuo é uma plataforma independente, não afiliada nem endossada pela Riot Games, Inc.
        </footer>
      </div>
    </div>
  )
}
