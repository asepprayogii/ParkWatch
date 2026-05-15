import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'
import { getUnreadCount } from '../../services/notifications'
import { logout } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navItems = [
  {
    to: '/user/feed',
    label: 'Beranda',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/user/upload',
    label: 'Lapor Parkir',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/user/riwayat',
    label: 'Riwayat',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/user/notifications',
    label: 'Notifikasi',
    hasNotifBadge: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/user/profile',
    label: 'Profil Saya',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const formatBadge = (num) => (num > 99 ? '99+' : num > 0 ? num : null)

export default function UserSidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user-sidebar-collapsed') ?? 'false') } catch { return false }
  })
  const [hovered, setHovered] = useState(null)
  const [unread, setUnread] = useState(0)
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const isDark = theme === 'dark'

  useEffect(() => {
    localStorage.setItem('user-sidebar-collapsed', JSON.stringify(collapsed))
    onCollapse?.(collapsed)
  }, [collapsed, onCollapse])

  useEffect(() => {
    if (!user?.id) return
    const fetchUnread = async () => {
      try { setUnread(await getUnreadCount(user.id)) } catch {}
    }
    fetchUnread()
    const ch = supabase.channel('user-sb-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayBadge = formatBadge(unread)

  const sidebarBg   = isDark ? '#242C3B' : '#ffffff'
  const borderColor = isDark ? 'rgba(55,138,221,0.15)' : '#E2E8F0'
  const textPrimary = isDark ? '#ffffff' : '#0f172a'
  const textMuted   = isDark ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)'
  const navDefault  = isDark ? '#94a3b8' : '#64748b'

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 14px rgba(239,68,68,0.75); }
        }
        .usr-nav { transition: all 0.18s cubic-bezier(.4,0,.2,1); }
        .usr-nav:hover { transform: translateX(2px); }
        .usr-toggle:hover { background: rgba(55,138,221,0.18) !important; }
        .usr-logout:hover { background: rgba(252,99,99,0.08) !important; border-color: rgba(252,99,99,0.2) !important; color: #fc6363 !important; }
      `}</style>

      {/* DESKTOP ONLY — z-[60] supaya sidebar menimpa topbar (z-50) */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full overflow-hidden"
        style={{
          zIndex: 60,
          width: collapsed ? 64 : 224,
          background: sidebarBg,
          borderRight: `1px solid ${borderColor}`,
          transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Shine top edge */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.35),transparent)' }} />

        {/* ── Logo + Toggle ── */}
        <div
          className="flex items-center h-14 px-3 shrink-0"
          style={{ borderBottom: `1px solid ${borderColor}`, justifyContent: collapsed ? 'center' : 'space-between' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src="/logo.webp" alt="logo" className="w-7 h-7 object-contain shrink-0" />
              <div className="overflow-hidden">
                <p className="font-bold text-sm leading-none" style={{ color: textPrimary, letterSpacing: '-0.3px' }}>ParkWatch</p>
                <p className="leading-none mt-0.5" style={{ color: textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Panel Pelapor</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="usr-toggle w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all"
            style={{
              background: 'rgba(55,138,221,0.08)',
              border: '1px solid rgba(55,138,221,0.18)',
              color: 'rgba(176,210,255,0.6)',
              cursor: 'pointer',
              marginLeft: collapsed ? 0 : 'auto',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />}
            </svg>
          </button>
        </div>

        {/* ── Nav Items ── */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const showBadge = item.hasNotifBadge && displayBadge
            return (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setHovered(item.to)}
                onMouseLeave={() => setHovered(null)}
              >
                <NavLink
                  to={item.to}
                  className="usr-nav flex items-center rounded-xl text-sm font-bold relative overflow-hidden px-2 py-2.5"
                  style={({ isActive }) => ({
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: isActive ? '#fff' : navDefault,
                    background: isActive
                      ? 'linear-gradient(135deg,rgba(24,95,165,0.9),rgba(6,182,212,0.8))'
                      : 'transparent',
                    boxShadow: isActive ? '0 0 18px rgba(6,182,212,0.15)' : 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active left bar */}
                      {isActive && (
                        <span style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
                          background: 'linear-gradient(180deg,#22D3EE,#185FA5)',
                          borderRadius: '0 3px 3px 0',
                        }} />
                      )}
                      <div className="relative shrink-0">
                        {item.icon}
                        {collapsed && showBadge && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"
                            style={{ border: `2px solid ${sidebarBg}` }} />
                        )}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {showBadge && (
                            <span className="text-white rounded-full font-bold shrink-0 flex items-center justify-center"
                              style={{
                                fontSize: 9, minWidth: 18, height: 18, padding: '0 5px',
                                background: 'linear-gradient(135deg,#ef4444,#f97316)',
                                boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                                animation: 'pw-badge-pulse 2s ease-in-out infinite',
                              }}>
                              {displayBadge}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Tooltip collapsed */}
                {collapsed && hovered === item.to && (
                  <div style={{
                    position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(2,18,42,0.95)', border: '1px solid rgba(55,138,221,0.2)',
                    backdropFilter: 'blur(10px)', color: '#f0f6ff',
                    fontSize: 12, fontWeight: 500, padding: '5px 10px',
                    borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100,
                    pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}>
                    {item.label}{showBadge && ` (${displayBadge})`}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="px-2 py-3 flex flex-col gap-1"
          style={{ borderTop: `1px solid ${borderColor}` }}>
          <div
            className="relative"
            onMouseEnter={() => setHovered('logout')}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              onClick={handleLogout}
              className="usr-logout w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                padding: '9px 10px', gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'rgba(252,99,99,0.65)', border: '1px solid transparent',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span>Keluar</span>}
            </button>
            {collapsed && hovered === 'logout' && (
              <div style={{
                position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(2,18,42,0.95)', border: '1px solid rgba(55,138,221,0.2)',
                backdropFilter: 'blur(10px)', color: '#fc6363',
                fontSize: 12, fontWeight: 500, padding: '5px 10px',
                borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100,
                pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}>Keluar</div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
