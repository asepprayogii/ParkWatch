import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../store/ThemeContext";
import { logout } from "../../services/auth";

const navItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: "/admin/laporan",
    label: "Semua Laporan",
    showBadge: true,
    badgeType: "pending",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: "/admin/zona",
    label: "Kelola Zona",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: "/admin/satpam",
    label: "Kelola Satpam",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: "/admin/roster",
    label: "Jadwal & Roster",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const formatBadge = (num) => (num > 99 ? "99+" : num > 0 ? num : null);

export default function AdminSidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin-sidebar-collapsed') ?? 'false') } catch { return false }
  });
  const [hovered, setHovered] = useState(null);
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0 });
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
    onCollapse?.(collapsed);
  }, [collapsed, onCollapse]);

  useEffect(() => {
    const fetch = async () => {
      const { count } = await supabase
        .from("reports").select("id", { count: "exact", head: true }).eq("status", "pending");
      setBadgeCounts({ pending: count ?? 0 });
    };
    fetch();
    const ch = supabase.channel("admin-sb-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const sidebarBg   = isDark ? '#242C3B' : '#ffffff';
  const borderColor = isDark ? 'rgba(55,138,221,0.15)' : '#E2E8F0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted   = isDark ? 'rgba(176,210,255,0.5)' : 'rgba(100,116,139,0.7)';
  const navDefault  = isDark ? '#94a3b8' : '#64748b';

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 14px rgba(239,68,68,0.75); }
        }
        .adm-nav { transition: all 0.18s cubic-bezier(.4,0,.2,1); }
        .adm-nav:hover { transform: translateX(2px); }
        .adm-toggle:hover { background: rgba(55,138,221,0.18) !important; }
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
                <p className="leading-none mt-0.5" style={{ color: textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Admin Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="adm-toggle w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all"
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
            const badge = item.showBadge ? formatBadge(badgeCounts[item.badgeType] ?? 0) : null;
            return (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setHovered(item.to)}
                onMouseLeave={() => setHovered(null)}
              >
                <NavLink
                  to={item.to}
                  className="adm-nav flex items-center rounded-xl text-sm font-bold relative overflow-hidden px-2 py-2.5"
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
                        {collapsed && badge && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"
                            style={{ border: `2px solid ${sidebarBg}` }} />
                        )}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge && (
                            <span className="text-white rounded-full font-bold shrink-0 flex items-center justify-center"
                              style={{
                                fontSize: 9, minWidth: 18, height: 18, padding: '0 5px',
                                background: 'linear-gradient(135deg,#ef4444,#f97316)',
                                boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                                animation: 'pw-badge-pulse 2s ease-in-out infinite',
                              }}>
                              {badge}
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
                    {item.label}{badge && ` (${badge})`}
                  </div>
                )}
              </div>
            );
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
              onClick={async () => { await logout(); navigate('/login') }}
              className="adm-nav w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200"
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
  );
}