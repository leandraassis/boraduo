import { Outlet } from 'react-router-dom'
import { AvailabilityProvider } from './AvailabilityProvider'
import { BottomNav } from './BottomNav'
import { ToastProvider } from './ToastProvider'

// Layout persistente de /app/*: mantém disponibilidade, presença e toast montados entre telas e
// reserva o espaço da bottom nav fixa (o ponto de disponibilidade vive nela, uma única vez).
export function AppShell() {
  return (
    <ToastProvider>
      <AvailabilityProvider>
        <div className="flex min-h-dvh flex-col bg-canvas">
          <div className="flex flex-1 flex-col pb-(--app-nav-h)">
            <Outlet />
          </div>
          <BottomNav />
        </div>
      </AvailabilityProvider>
    </ToastProvider>
  )
}
