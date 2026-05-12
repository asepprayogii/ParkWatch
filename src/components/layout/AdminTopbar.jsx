import { useAuth } from '../../store/authContext'
import { useTheme } from '../../store/ThemeContext'
import { logout } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function AdminTopbar({ title }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const initials = (user?.full_name?.charAt(0) || 'A').toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <>
      <style>{`
        .pw-topbar { 
          background: ${theme === 'dark' ? '#242C3B' : '#FFFFFF'}; 
          border-bottom: 1px solid ${theme === 'dark' ? '#353F54' : '#E2E8F0'}; 
          font-family: 'Plus Jakarta Sans', sans-serif; 
        } 
        .pw-topbar::after { 
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; 
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent); 
        }
      `}</style>

      <div className="pw-topbar fixed top-0 left-0 right-0 z-50 px-4 h-14 flex items-center justify-between">
        
        {/* ✅ Logo + Label Admin (TETAP ADA) */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ParkWatch" className="w-7 h-7 object-contain shrink-0" />
          <div>
            <p className={cn("font-bold text-sm leading-none", theme === 'dark' ? "text-white" : "text-slate-900")} style={{ letterSpacing: '-0.3px' }}>
              ParkWatch
            </p>
            <p className="leading-none mt-0.5" style={{ color: theme === 'dark' ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Admin
            </p>
          </div>
        </div>

        {/* ❌ Title tengah DIHAPUS */}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-slate-800"
            style={{ color: 'rgba(176,210,255,0.8)' }}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          {/* ✅ MOBILE: Logout Icon */}
          <button 
            onClick={handleLogout}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:bg-red-500/10 transition-colors"
            style={{ color: theme === 'dark' ? 'rgba(252,99,99,0.8)' : 'rgba(239,68,68,0.7)' }}
            title="Keluar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* ✅ DESKTOP: Avatar */}
          <div
            className="hidden md:flex w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
              boxShadow: '0 0 10px rgba(34,211,238,0.25)',
            }}
          >
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        </div>
      </div>
    </>
  )
}