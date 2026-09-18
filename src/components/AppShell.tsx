import { Outlet, useMatch } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { AvailabilityDot } from './AvailabilityDot'
import { AvailabilityProvider } from './AvailabilityProvider'
import { BottomNav } from './BottomNav'
import { ToastProvider } from './ToastProvider'

// Layout persistente de /app/*: mantém disponibilidade, presença e toast montados entre telas e
// reserva o espaço da bottom nav fixa (o ponto de disponibilidade vive nela, uma única vez).
export function AppShell() {
  // Com uma conversa aberta no mobile a nav sai da frente do campo de mensagem; a partir de lg a
  // lista de conversas fica ao lado e a nav segue como saída (a seta de voltar some nessa largura).
  const inChat = useMatch('/app/matches/:matchId') !== null
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const navHidden = inChat && !isDesktop

  return (
    <div className="contents" style={navHidden ? ({ '--app-nav-h': '0px' } as React.CSSProperties) : undefined}>
      <ToastProvider>
        <AvailabilityProvider>
          <div className="flex min-h-dvh flex-col bg-canvas">
            <div className="flex flex-1 flex-col pb-(--app-nav-h)">
              <Outlet />
            </div>
            {navHidden ? <AvailabilityDot className="fixed top-1.5 right-1.5 z-30" /> : <BottomNav />}
          </div>
        </AvailabilityProvider>
      </ToastProvider>
    </div>
  )
}
