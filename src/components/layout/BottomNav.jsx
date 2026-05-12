import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'
import { getUnreadCount } from '../../services/notifications'
import { supabase } from '../../lib/supabase'

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
    to: '/user/riwayat',
    label: 'Riwayat',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/user/upload',
    label: 'Lapor',
    isMain: true,
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/user/notifications',
    label: 'Notifikasi',
    hasNotifBadge: true,
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/user/profile',
    label: 'Profil',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(setUnread)

    const channel = supabase
      .channel('user-bottom-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const isDark = theme === 'dark'

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 12px rgba(239,68,68,0.7); }
        }
        .pw-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 9999;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          background: ${isDark ? 'rgba(36,44,59,0.97)' : 'rgba(255,255,255,0.97)'};
          border-top: 1px solid ${isDark ? '#353F54' : '#E2E8F0'};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pw-bottom-nav::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.25), transparent);
        }
        .pw-nav-tab { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .pw-nav-tab:active { transform: scale(0.92); }
        .pw-main-btn {
          background: linear-gradient(135deg, #185FA5, #06B6D4);
          box-shadow: 0 4px 18px rgba(6,182,212,0.45);
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
        }
        .pw-main-btn:active { transform: scale(0.92); box-shadow: 0 2px 10px rgba(6,182,212,0.3); }
      `}</style>

      <nav className="pw-bottom-nav md:hidden">
        <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
          {navItems.map((item) =>
            item.isMain ? (
              <NavLink key={item.to} to={item.to} className="flex flex-col items-center -mt-5 pw-nav-tab">
                {({ isActive }) => (
                  <>
                    <div
                      className="pw-main-btn w-13 h-13 rounded-2xl flex items-center justify-center"
                      style={{
                        width: 52, height: 52,
                        ...(isActive && { boxShadow: '0 4px 20px rgba(6,182,212,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)' }),
                      }}
                    >
                      {item.icon()}
                    </div>
                    <span className="text-[10px] mt-1 font-semibold" style={{ color: '#22D3EE' }}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-xl pw-nav-tab relative"
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <span style={{
                        color: isActive
                          ? '#22D3EE'
                          : isDark ? 'rgba(176,210,255,0.45)' : '#94a3b8',
                      }}>
                        {item.icon(isActive)}
                      </span>

                      {item.hasNotifBadge && unread > 0 && (
                        <span
                          className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1"
                          style={{
                            animation: 'pw-badge-pulse 2s ease-in-out infinite',
                            border: `2px solid ${isDark ? '#242C3B' : '#fff'}`,
                          }}
                        >
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>

                    <span
                      className="text-[10px] mt-0.5 font-semibold"
                      style={{
                        color: isActive
                          ? '#22D3EE'
                          : isDark ? 'rgba(176,210,255,0.45)' : '#94a3b8',
                      }}
                    >
                      {item.label}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#22D3EE', boxShadow: '0 0 6px rgba(34,211,238,0.8)' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </nav>
    </>
  )
}