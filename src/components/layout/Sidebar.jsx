import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../../services/auth'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'
import { getUnreadCount } from '../../services/notifications'
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

// Style constants
const S = {
  sidebar: (collapsed, theme) => ({
    width: collapsed ? '64px' : '224px',
    background: theme === 'dark' ? '#242C3B' : '#FFFFFF',
    borderRight: `1px solid ${theme === 'dark' ? '#353F54' : '#E2E8F0'}`,
    transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }),
  shineTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.35), transparent)',
  },
  logoIcon: {
    background: 'linear-gradient(135deg, #185FA5, #06B6D4)',
    boxShadow: '0 0 16px rgba(6,182,212,0.3)',
    borderRadius: '9px', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarRing: {
    background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
    boxShadow: '0 0 10px rgba(34,211,238,0.2)',
  },
  activeBar: {
    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px',
    background: 'linear-gradient(180deg, #22D3EE, #185FA5)',
    borderRadius: '0 3px 3px 0',
  },
  badge: {
    background: 'linear-gradient(135deg, #ef4444, #f97316)',
    boxShadow: '0 0 8px rgba(239,68,68,0.4)',
    animation: 'pw-badge-pulse 2s ease-in-out infinite',
  },
  tooltip: {
    position: 'absolute', left: '56px', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(2,18,42,0.95)', border: '1px solid rgba(55,138,221,0.2)',
    backdropFilter: 'blur(10px)', color: '#f0f6ff',
    fontSize: '12px', fontWeight: 500, padding: '5px 10px',
    borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 100,
    pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
}

export default function Sidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(() => {
    // ✅ Load collapsed state from localStorage on mount
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [hoveredItem, setHoveredItem] = useState(null)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation() // ✅ Untuk persist state saat route berubah
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // ✅ Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
    onCollapse?.(collapsed)
  }, [collapsed, onCollapse])

  // ✅ Pastikan collapsed state tetap saat pindah halaman
  useEffect(() => {
    // Tidak perlu reset collapsed saat route berubah
    // State sudah persist via localStorage
  }, [location])

  useEffect(() => {
    if (!user?.id) return
    const fetchUnread = async () => {
      try { setUnread(await getUnreadCount(user.id)) } catch {}
    }
    fetchUnread()
    const channel = supabase
      .channel('sidebar-user-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    // onCollapse dipanggil via useEffect di atas
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'
  const displayBadge = formatBadge(unread)
  
  // ✅ Avatar URL dengan fallback ke initials
  const avatarUrl = user?.avatar_url || null

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 14px rgba(239,68,68,0.75); }
        }
        .pw-nav-item { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .pw-nav-item:hover { transform: translateX(2px); }
        .pw-toggle:hover { background: rgba(55,138,221,0.2) !important; }
        .pw-logout:hover { background: rgba(252,99,99,0.08) !important; border-color: rgba(252,99,99,0.2) !important; color: #fc6363 !important; }
      `}</style>

      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50 overflow-hidden"
        style={S.sidebar(collapsed, theme)}
      >
        {/* Shiny top edge */}
        <div style={S.shineTop} />

        {/* Logo + Toggle */}
        <div
          className="flex items-center h-14 px-3"
          style={{
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0'}`,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              {/* ✅ LOGO DARI PUBLIC /logo.png */}
              <img src="/logo.webp" alt="ParkWatch" className="w-8 h-8 object-contain shrink-0" />
              <div className="overflow-hidden">
                <p className="font-bold text-sm leading-none tracking-tight"
                  style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                  ParkWatch
                </p>
                <p className="text-xs leading-none mt-0.5"
                  style={{ color: theme === 'dark' ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)', letterSpacing: '0.4px', textTransform: 'uppercase', fontSize: '9px' }}>
                  User
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleToggle}
            className="pw-toggle w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200"
            style={{
              background: 'rgba(55,138,221,0.08)', border: '1px solid rgba(55,138,221,0.18)',
              color: 'rgba(176,210,255,0.5)', cursor: 'pointer',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />}
            </svg>
          </button>
        </div>

        {/* User Info - ✅ Dengan Avatar */}
        <div
          className="px-3 py-3 flex items-center overflow-hidden"
          style={{
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0'}`,
            gap: collapsed ? 0 : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {/* ✅ Avatar dengan fallback initials */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={S.avatarRing}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user?.full_name || 'User'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback ke initials jika gambar error
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            {/* Fallback initials (muncul jika no avatar atau error load) */}
            <span 
              className={`text-sm font-bold text-white ${avatarUrl ? '' : 'flex'}`} 
              style={{ display: avatarUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
            >
              {initials}
            </span>
          </div>
          
          {/* User info text - hanya muncul jika expanded */}
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate" style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                {user?.full_name ?? 'User'}
              </p>
              <p className="text-xs truncate"
                style={{ color: theme === 'dark' ? 'rgba(176,210,255,0.45)' : 'rgba(100,116,139,0.7)', fontSize: '10px' }}>
                {user?.email ?? ''}
              </p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const showBadge = item.hasNotifBadge && displayBadge

            return (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.to)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `pw-nav-item flex items-center rounded-xl text-sm font-bold relative overflow-hidden px-2 py-2.5 transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white'
                          : 'text-slate-500 hover:text-slate-900'
                    } ${collapsed ? 'justify-center' : 'justify-start'}`
                  }
                  style={({ isActive }) => ({
                    gap: collapsed ? 0 : '10px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(24,95,165,0.9), rgba(6,182,212,0.8))'
                      : 'transparent',
                    ...(isActive && { boxShadow: '0 0 18px rgba(6,182,212,0.15), inset 0 0 0 1px rgba(255,255,255,0.06)' }),
                    ...(!isActive && {
                      ':hover': {
                        background: theme === 'dark' ? 'rgba(55,138,221,0.1)' : '#f1f5f9',
                      }
                    })
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span style={S.activeBar} />}

                      <div className="relative shrink-0">
                        {item.icon}
                        {collapsed && showBadge && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"
                            style={{ border: `2px solid ${theme === 'dark' ? '#242C3B' : '#fff'}` }} />
                        )}
                      </div>

                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {showBadge && (
                            <span
                              className="text-white rounded-full flex items-center justify-center font-bold shrink-0"
                              style={{ ...S.badge, fontSize: '9px', minWidth: '18px', height: '18px', padding: '0 5px' }}
                            >
                              {displayBadge}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Tooltip saat collapsed */}
                {collapsed && hoveredItem === item.to && (
                  <div style={S.tooltip}>
                    {item.label}
                    {showBadge && ` (${displayBadge})`}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-2 py-3 flex flex-col gap-1"
          style={{ borderTop: `1px solid ${theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0'}` }}>

          {/* Theme Toggle */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('theme')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={toggleTheme}
              className="pw-nav-item w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                padding: '9px 10px', gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: theme === 'dark' ? 'rgba(176,210,255,0.65)' : '#64748b',
                border: '1px solid transparent', background: 'transparent', cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {!collapsed && <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>}
            </button>
            {collapsed && hoveredItem === 'theme' && (
              <div style={{ ...S.tooltip, color: '#f0f6ff' }}>
                {theme === 'dark' ? 'Terang' : 'Gelap'}
              </div>
            )}
          </div>

          {/* Logout */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={handleLogout}
              className="pw-logout w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200"
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
            {collapsed && hoveredItem === 'logout' && (
              <div style={{ ...S.tooltip, color: '#fc6363' }}>Keluar</div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}