import { useAvailability } from '../contexts/availability'

// Indicador global e discreto: não existe header/bottom nav compartilhado ainda, então fica fixo no canto.
export function AvailabilityDot() {
  const { isAvailable } = useAvailability()
  if (!isAvailable) return null

  return (
    <div role="status" className="pointer-events-none fixed top-1.5 right-1.5 z-30" data-testid="availability-dot">
      <span className="sr-only">Você está disponível agora</span>
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ready opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ready shadow-glow-ready" />
      </span>
    </div>
  )
}
