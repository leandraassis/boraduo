import { useRef, useState, type PointerEvent } from 'react'
import type { DeckCard, SwipeDirection } from '../../lib/deck'
import { ProfileCard } from '../ProfileCard'

const MAX_ROTATION_DEG = 15

interface SwipeCardProps {
  card: DeckCard
  depth: 0 | 1
  exit: SwipeDirection | null
  onCommit: (direction: SwipeDirection) => void
  onExited: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function SwipeCard({ card, depth, exit, onCommit, onExited }: SwipeCardProps) {
  const startRef = useRef<{ x: number; pointerId: number } | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [cardWidth, setCardWidth] = useState(320)

  const isTop = depth === 0
  const threshold = Math.max(90, cardWidth * 0.28)

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!isTop || exit || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, pointerId: e.pointerId }
    setCardWidth(e.currentTarget.offsetWidth)
    setDragging(true)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const start = startRef.current
    if (!start || start.pointerId !== e.pointerId) return
    setDragX(e.clientX - start.x)
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const start = startRef.current
    if (!start || start.pointerId !== e.pointerId) return
    startRef.current = null
    setDragging(false)

    const dx = e.clientX - start.x
    if (!cancelled && Math.abs(dx) >= threshold) {
      setDragX(dx)
      onCommit(dx > 0 ? 'like' : 'pass')
      return
    }
    setDragX(0)
  }

  const intent: SwipeDirection | null = exit ?? (dragX > 12 ? 'like' : dragX < -12 ? 'pass' : null)
  const strength = exit ? 1 : clamp(Math.abs(dragX) / threshold, 0, 1)

  let transform: string
  let transition: string
  let opacity = 1
  if (!isTop) {
    transform = 'translateY(14px) scale(0.94)'
    transition = 'transform 250ms ease, opacity 250ms ease'
    opacity = 0.7
  } else if (exit) {
    const sign = exit === 'like' ? 1 : -1
    transform = `translateX(${sign * 140}%) rotate(${sign * 18}deg)`
    transition = 'transform 260ms ease-in, opacity 260ms ease-in'
    opacity = 0
  } else {
    const rotation = clamp(dragX * 0.06, -MAX_ROTATION_DEG, MAX_ROTATION_DEG)
    transform = `translateX(${dragX}px) rotate(${rotation}deg)`
    transition = dragging ? 'none' : 'transform 250ms ease'
  }

  const glow =
    intent === 'like'
      ? `0 0 24px rgba(16, 185, 129, ${0.35 * strength})`
      : intent === 'pass'
        ? `0 0 24px rgba(239, 68, 68, ${0.35 * strength})`
        : 'none'

  return (
    <div
      className="swipe-card absolute inset-x-0 top-0 bottom-4 select-none"
      style={{
        transformOrigin: 'center bottom',
        transform,
        transition,
        opacity,
        touchAction: 'pan-y',
        cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
        pointerEvents: isTop ? 'auto' : 'none',
        zIndex: isTop ? 2 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishDrag(e, false)}
      onPointerCancel={(e) => finishDrag(e, true)}
      onTransitionEnd={(e) => {
        if (exit && e.target === e.currentTarget && e.propertyName === 'transform') onExited()
      }}
    >
      <div className="relative h-full rounded-2xl" style={{ boxShadow: glow }}>
        <ProfileCard fill profile={card} />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-5 left-5 -rotate-6 rounded-xl border-2 border-ready bg-canvas/60 px-3 py-1 text-sm font-bold tracking-[0.12em] text-ready uppercase"
          style={{ opacity: intent === 'like' ? strength : 0 }}
        >
          Curtir
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-5 right-5 rotate-6 rounded-xl border-2 border-danger bg-canvas/60 px-3 py-1 text-sm font-bold tracking-[0.12em] text-danger uppercase"
          style={{ opacity: intent === 'pass' ? strength : 0 }}
        >
          Passar
        </span>
      </div>
    </div>
  )
}
