import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'

const navItems = [
  {
    to: '/user/feed',
    label: 'Beranda',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/user/upload',
    label: 'Lapor',
    isMain: true,
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/user/notifications',
    label: 'Notifikasi',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) =>
          item.isMain ? (
            <NavLink key={item.to} to={item.to} className="flex flex-col items-center -mt-5">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                {item.icon()}
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-1">{item.label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition
                ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-red-400 hover:text-red-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs font-medium">Keluar</span>
        </button>
      </div>
    </div>
  )
}