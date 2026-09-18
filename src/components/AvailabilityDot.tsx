import { useAvailability } from '../contexts/availability'

// Renderizado uma única vez, na BottomNav do AppShell: presente em qualquer tela de /app/*.
export function AvailabilityDot() {
  const { isAvailable } = useAvailability()
  if (!isAvailable) return null

  return (
    <span role="status" className="pointer-events-none absolute -top-0.5 -right-1" data-testid="availability-dot">
      <span className="sr-only">Você está disponível agora</span>
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ready opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ready shadow-glow-ready ring-2 ring-canvas" />
      </span>
    </span>
  )
}
