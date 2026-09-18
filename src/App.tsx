import { Navigate, Route, Routes } from 'react-router-dom'
import { AppGuard } from './components/AppGuard'
import { AppShell } from './components/AppShell'
import { AuthGuard } from './components/AuthGuard'
import { ChatPlaceholder } from './components/chat/ChatStates'
import { Banned } from './pages/Banned'
import { Chat } from './pages/Chat'
import { Discover } from './pages/Discover'
import { Login } from './pages/Login'
import { Matches } from './pages/Matches'
import { Notifications } from './pages/Notifications'
import { Onboarding } from './pages/Onboarding'
import { Profile } from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/banned"
        element={
          <AuthGuard>
            <Banned />
          </AuthGuard>
        }
      />

      <Route
        element={
          <AppGuard>
            <AppShell />
          </AppGuard>
        }
      >
        <Route path="/app" element={<Navigate to="/app/discover" replace />} />
        <Route path="/app/discover" element={<Discover />} />
        <Route path="/app/matches" element={<Matches />}>
          <Route index element={<ChatPlaceholder />} />
          <Route path=":matchId" element={<Chat />} />
        </Route>
        <Route path="/app/notifications" element={<Notifications />} />
        <Route path="/app/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
