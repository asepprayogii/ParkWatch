import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-slate-700 font-semibold mb-4">Admin Dashboard — coming soon</h1>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition"
      >
        Logout
      </button>
    </div>
  )
}