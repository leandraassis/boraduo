import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AvailableNowList } from '../components/discover/AvailableNowList'
import { FilterControl } from '../components/discover/FilterControl'
import { MatchCelebrationModal } from '../components/discover/MatchCelebrationModal'
import { ModeSwitch, type DiscoverMode } from '../components/discover/ModeSwitch'
import { SwipeMode } from '../components/discover/SwipeMode'
import { useMatchCelebration } from '../hooks/useMatchCelebration'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { DEFAULT_FILTERS, type DeckFilters } from '../lib/deck'
import { parseSchedule } from '../lib/gameData'

export function Discover() {
  const { session } = useSession()
  const { profile } = useProfile(session?.user.id)
  const navigate = useNavigate()
  // Montado aqui (acima dos dois modos): uma única instância e um único canal Realtime, e o modal de match
  // aparece tanto em Swipe quanto em "Disponíveis agora".
  const celebration = useMatchCelebration(session?.user.id)
  const [params, setParams] = useSearchParams()
  const mode: DiscoverMode = params.get('mode') === 'available' ? 'available' : 'swipe'
  const [swipeFilters, setSwipeFilters] = useState<DeckFilters>(DEFAULT_FILTERS)
  const [availableFilters, setAvailableFilters] = useState<DeckFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const mySchedule = parseSchedule(profile?.availability_schedule ?? null)
  const isSwipe = mode === 'swipe'

  function changeMode(next: DiscoverMode) {
    setFiltersOpen(false)
    setParams(next === 'available' ? { mode: 'available' } : {}, { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas font-inter text-ink">
      <header className="mx-auto flex w-full max-w-[440px] items-center gap-3 px-4 pt-6 pb-4">
        <h1 className="sr-only">Descobrir</h1>
        <ModeSwitch mode={mode} onChange={changeMode} />
        <FilterControl
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={isSwipe ? swipeFilters : availableFilters}
          mySchedule={mySchedule}
          showSchedule={isSwipe}
          onApply={isSwipe ? setSwipeFilters : setAvailableFilters}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-6">
        {isSwipe ? (
          <SwipeMode filters={swipeFilters} onOpenFilters={() => setFiltersOpen(true)} />
        ) : (
          <AvailableNowList filters={availableFilters} onOpenFilters={() => setFiltersOpen(true)} />
        )}
      </main>

      {celebration.current && (
        <MatchCelebrationModal
          me={profile ? { username: profile.username, avatarUrl: profile.avatar_url, rank: profile.rank } : null}
          match={celebration.current}
          onSendMessage={() => {
            const { matchId } = celebration.current!
            celebration.dismiss()
            navigate(`/app/matches/${matchId}`)
          }}
          onDismiss={celebration.dismiss}
        />
      )}
    </div>
  )
}
