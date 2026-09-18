import { Outlet } from 'react-router-dom'
import { AvailabilityDot } from './AvailabilityDot'
import { AvailabilityProvider } from './AvailabilityProvider'
import { ToastProvider } from './ToastProvider'

// Layout persistente de /app/*: mantém disponibilidade + presença + toast montados entre telas.
export function AppShell() {
  return (
    <ToastProvider>
      <AvailabilityProvider>
        <Outlet />
        <AvailabilityDot />
      </AvailabilityProvider>
    </ToastProvider>
  )
}
