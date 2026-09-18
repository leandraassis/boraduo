import { useAvailability } from '../contexts/availability'

// Uma única instância por vez: no ícone de Perfil da BottomNav e, quando a nav está oculta (chat no
// mobile), fixa no canto da tela — assim o ponto aparece em qualquer tela de /app/*.
export function AvailabilityDot({ className = 'absolute -top-0.5 -right-1' }: { className?: string }) {
  const { isAvailable } = useAvailability()
  if (!isAvailable) return null

  return (
    <span role="status" className={`pointer-events-none ${className}`} data-testid="availability-dot">
      <span className="sr-only">Você está disponível agora</span>
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ready opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ready shadow-glow-ready ring-2 ring-canvas" />
      </span>
    </span>
  )
}
