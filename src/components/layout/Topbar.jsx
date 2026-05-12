import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'
import { getUnreadCount } from '../../services/notifications'
import { supabase } from '../../lib/supabase'

export default function Topbar({ title }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(setUnread)
    const channel = supabase
      .channel('topbar-notif-count')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const initials = (user?.full_name?.charAt(0) || 'U').toUpperCase()

  return (
    <>
      <style>{`
        .pw-user-topbar { 
          background: ${theme === 'dark' ? '#242C3B' : '#FFFFFF'}; 
          border-bottom: 1px solid ${theme === 'dark' ? '#353F54' : '#E2E8F0'}; 
          font-family: 'Plus Jakarta Sans', sans-serif;
          /* ✅ Fix untuk fixed positioning di mobile */
          will-change: transform;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        } 
        .pw-user-topbar::after { 
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; 
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent); 
        } 
        @keyframes pw-notif-pulse { 
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); } 
          50% { box-shadow: 0 0 12px rgba(239,68,68,0.7); } 
        }
        /* ✅ Mencegah body scroll bermasalah dengan fixed element */
        html, body {
          overscroll-behavior-y: none;
        }
      `}</style>

      {/* ✅ Topbar dengan fixed positioning yang benar */}
      <div 
        className="pw-user-topbar fixed top-0 left-0 right-0 z-[9999] h-14 flex items-center justify-between px-4"
        style={{
          // ✅ Hardware acceleration untuk fixed positioning
          willChange: 'transform',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        
        {/* ✅ Logo + Label User */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ParkWatch" className="w-7 h-7 object-contain shrink-0" />
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: theme === 'dark' ? '#fff' : '#0f172a', letterSpacing: '-0.3px' }}>
              ParkWatch
            </p>
            <p className="leading-none mt-0.5" style={{ color: theme === 'dark' ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              User
            </p>
          </div>
        </div>

        {/* ✅ Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: theme === 'dark' ? 'rgba(176,210,255,0.8)' : '#64748b' }}
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

          {/* Avatar → profil */}
          <button
            onClick={() => navigate('/user/profile')}
            className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
              boxShadow: '0 0 10px rgba(34,211,238,0.25)',
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-xs font-bold text-white">{initials}</span>
            )}
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold border-2"
                style={{
                  fontSize: '8px', padding: '0 3px',
                  borderColor: theme === 'dark' ? '#242C3B' : '#fff',
                  animation: 'pw-notif-pulse 2s ease-in-out infinite',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}