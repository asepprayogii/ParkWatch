import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'
import { getUnreadCount } from '../../services/notifications'
import { supabase } from '../../lib/supabase'

export default function UserTopbar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(setUnread)
    const channel = supabase
      .channel('user-topbar-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const initials = (user?.full_name?.charAt(0) || 'U').toUpperCase()
  const isDark = theme === 'dark'
  const bg = isDark ? '#242C3B' : '#ffffff'
  const border = isDark ? '#353F54' : '#E2E8F0'
  const textMain = isDark ? '#ffffff' : '#0f172a'
  const textMuted = isDark ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)'

  return (
    <>
      <style>{`
        .pw-user-topbar-v2 {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          height: 56px;
          background: ${bg};
          border-bottom: 1px solid ${border};
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center;
        }
        .pw-user-topbar-v2::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent);
        }
        .pw-user-icon-btn {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .pw-user-icon-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; }
      `}</style>

      <div className="pw-user-topbar-v2 px-4 justify-between">

        {/* ══ MOBILE: Logo kiri ══ */}
        <div className="flex md:hidden items-center gap-2">
          <img src="/logo.png" alt="logo" className="w-7 h-7 object-contain" />
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: textMain, letterSpacing: '-0.3px' }}>ParkWatch</p>
            <p className="leading-none mt-0.5" style={{ color: textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.4px' }}>User</p>
          </div>
        </div>

        {/* ══ DESKTOP: Spacer kiri (sidebar menempati kiri) ══ */}
        <div className="hidden md:block" />

        {/* ══ KANAN: Actions (mobile & desktop) ══ */}
        <div className="flex items-center gap-2">

          {/* Notifikasi */}
          <button
            className="pw-user-icon-btn relative"
            onClick={() => navigate('/user/notifications')}
            title="Notifikasi"
          >
            <svg className="w-4 h-4" style={{ color: isDark ? 'rgba(176,210,255,0.8)' : '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold border-2"
                style={{
                  fontSize: '8px', padding: '0 3px',
                  borderColor: bg,
                  animation: 'pw-notif-pulse 2s ease-in-out infinite',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button className="pw-user-icon-btn" onClick={toggleTheme} title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
            {isDark ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* ══ DESKTOP: Avatar + nama + role ══ */}
          <div className="hidden md:flex items-center gap-3 pl-2" style={{ borderLeft: `1px solid ${border}` }}>
            <div className="text-right leading-none">
              <p className="text-xs font-bold" style={{ color: textMain }}>{user?.full_name ?? 'User'}</p>
              <p className="text-[10px] mt-0.5 font-medium capitalize" style={{ color: textMuted }}>{user?.role ?? 'user'}</p>
            </div>

            {/* Avatar */}
            <button
              onClick={() => navigate('/user/profile')}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
                boxShadow: '0 0 10px rgba(34,211,238,0.25)',
              }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{initials}</span>
              )}
            </button>
          </div>

          {/* ══ MOBILE: Avatar kecil ══ */}
          <button
            onClick={() => navigate('/user/profile')}
            className="md:hidden relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
              boxShadow: '0 0 10px rgba(34,211,238,0.25)',
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{initials}</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pw-notif-pulse {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 12px rgba(239,68,68,0.7); }
        }
      `}</style>
    </>
  )
}
