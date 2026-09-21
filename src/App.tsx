import { Navigate, Route, Routes } from 'react-router-dom'
import { AppGuard } from './components/AppGuard'
import { AppShell } from './components/AppShell'
import { AuthGuard } from './components/AuthGuard'
import { RecoveryRedirect } from './components/auth/RecoveryRedirect'
import { ChatPlaceholder } from './components/chat/ChatStates'
import { AdminUsers } from './pages/AdminUsers'
import { Banned } from './pages/Banned'
import { Chat } from './pages/Chat'
import { Discover } from './pages/Discover'
import { ForgotPassword } from './pages/ForgotPassword'
import { Login } from './pages/Login'
import { Matches } from './pages/Matches'
import { Notifications } from './pages/Notifications'
import { Onboarding } from './pages/Onboarding'
import { Privacy } from './pages/Privacy'
import { Profile } from './pages/Profile'
import { ResetPassword } from './pages/ResetPassword'
import { Terms } from './pages/Terms'

function App() {
  return (
    <>
      <RecoveryRedirect />
      <AppRoutes />
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />

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
        <Route path="/app/admin/users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
