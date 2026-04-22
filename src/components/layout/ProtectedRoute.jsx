import { Navigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
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

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect ke halaman sesuai role masing-masing
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'satpam') return <Navigate to="/satpam/dashboard" replace />
    return <Navigate to="/user/feed" replace />
  }

  return children
}