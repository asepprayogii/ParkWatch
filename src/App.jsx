import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import UserFeed from './pages/user/UserFeed'
import UserUpload from './pages/user/UserUpload'
import UserNotifications from './pages/user/UserNotifications'
import UserProfile from './pages/user/UserProfile'

import SatpamDashboard from './pages/satpam/SatpamDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

function RedirectByRole({ user }) {
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'satpam') return <Navigate to="/satpam/dashboard" replace />
  return <Navigate to="/user/feed" replace />
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <RedirectByRole user={user} /> : <LoginPage />} />
      <Route path="/register" element={user ? <RedirectByRole user={user} /> : <RegisterPage />} />

      {/* User routes */}
      <Route path="/user/*" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Routes>
            <Route path="feed" element={<UserFeed />} />
            <Route path="upload" element={<UserUpload />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="profile" element={<UserProfile />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Satpam routes */}
      <Route path="/satpam/*" element={
        <ProtectedRoute allowedRoles={['satpam']}>
          <Routes>
            <Route path="dashboard" element={<SatpamDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      <Route path="/" element={user ? <RedirectByRole user={user} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={user ? <RedirectByRole user={user} /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App