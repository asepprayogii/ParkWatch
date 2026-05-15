import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext'

export default function AdminTopbar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const initials = (user?.full_name?.charAt(0) || 'A').toUpperCase()
  const isDark = theme === 'dark'
  const bg = isDark ? '#242C3B' : '#ffffff'
  const border = isDark ? '#353F54' : '#E2E8F0'
  const textMain = isDark ? '#ffffff' : '#0f172a'
  const textMuted = isDark ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)'


  return (
    <>
      <style>{`
        .pw-adm-topbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          height: 56px;
          background: ${bg};
          border-bottom: 1px solid ${border};
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center;
        }
        .pw-adm-topbar::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent);
        }
        .pw-icon-btn {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .pw-icon-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; }
      `}</style>

      <div className="pw-adm-topbar px-4 justify-between">

        {/* ══ MOBILE: Logo kiri ══ */}
        <div className="flex md:hidden items-center gap-2">
          <img src="/logo.webp" alt="logo" className="w-7 h-7 object-contain" />
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: textMain, letterSpacing: '-0.3px' }}>ParkWatch</p>
            <p className="leading-none mt-0.5" style={{ color: textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Admin</p>
          </div>
        </div>



        {/* ══ DESKTOP: Spacer kiri (sidebar menempati kiri) ══ */}
        <div className="hidden md:block" />

        {/* ══ KANAN: Actions (mobile & desktop) ══ */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button className="pw-icon-btn" onClick={toggleTheme} title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
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
            {/* Info user */}
            <div className="text-right leading-none">
              <p className="text-xs font-bold" style={{ color: textMain }}>{user?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] mt-0.5 font-medium capitalize" style={{ color: textMuted }}>{user?.role ?? 'admin'}</p>
            </div>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none"
              style={{
                background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
                boxShadow: '0 0 10px rgba(34,211,238,0.25)',
              }}
            >
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}