import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";

const navItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    badgeKey: null,
  },
  {
    to: "/admin/laporan",
    label: "Semua Laporan",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badgeKey: 'laporanBaru',
  },
  {
    to: "/admin/zona",
    label: "Kelola Zona",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    badgeKey: null,
  },
  {
    to: "/admin/satpam",
    label: "Kelola Satpam",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    badgeKey: null,
  },
  {
    to: "/admin/roster",
    label: "Jadwal & Roster",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    badgeKey: null,
  },
  {
    to: "/admin/pengaturan",
    label: "Pengaturan",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    badgeKey: null,
  },
];

// ─── Inline styles (tidak bisa di-express via Tailwind murni) ─────────────────
const S = {
  sidebar: (collapsed) => ({
    width: collapsed ? '64px' : '224px',
    background: 'rgba(2, 18, 42, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(55, 138, 221, 0.18)',
    transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }),
  shineTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.35), transparent)',
  },
  logoIcon: {
    background: 'linear-gradient(135deg, #185FA5, #06B6D4)',
    boxShadow: '0 0 16px rgba(6,182,212,0.3)',
    borderRadius: '9px',
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarRing: {
    background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
    boxShadow: '0 0 10px rgba(34,211,238,0.2)',
  },
  navActive: {
    background: 'linear-gradient(135deg, rgba(24,95,165,0.65), rgba(6,182,212,0.28))',
    border: '1px solid rgba(34,211,238,0.28)',
    boxShadow: '0 0 18px rgba(6,182,212,0.1), inset 0 0 0 1px rgba(255,255,255,0.04)',
    color: '#fff',
  },
  navInactive: {
    border: '1px solid transparent',
    color: 'rgba(176,210,255,0.5)',
  },
  activeBar: {
    position: 'absolute', left: 0, top: '20%', bottom: '20%',
    width: '3px',
    background: 'linear-gradient(180deg, #22D3EE, #185FA5)',
    borderRadius: '0 3px 3px 0',
  },
  badge: {
    background: 'linear-gradient(135deg, #185FA5, #06B6D4)',
    boxShadow: '0 0 8px rgba(6,182,212,0.4)',
    animation: 'pw-badge-pulse 2s ease-in-out infinite',
  },
  divider: {
    borderColor: 'rgba(55,138,221,0.15)',
  },
  tooltip: {
    position: 'absolute',
    left: '56px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(2,18,42,0.95)',
    border: '1px solid rgba(55,138,221,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#f0f6ff',
    fontSize: '12px',
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    zIndex: 100,
    pointerEvents: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
}

export default function AdminSidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [laporanBaru, setLaporanBaru] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch initial badge counts
    const fetchBadges = async () => {
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      setLaporanBaru(count ?? 0);
    };

    fetchBadges();

    // Subscribe to changes
    const channel = supabase
      .channel('admin-sidebar-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchBadges)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.full_name?.charAt(0) || "A").toUpperCase();

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(6,182,212,0.4); }
          50%      { box-shadow: 0 0 14px rgba(6,182,212,0.75); }
        }
        .pw-nav-item { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .pw-nav-item:hover { transform: translateX(2px); }
        .pw-toggle:hover { background: rgba(55,138,221,0.2) !important; }
        .pw-logout:hover { background: rgba(252,99,99,0.08) !important; border-color: rgba(252,99,99,0.2) !important; color: #fc6363 !important; }
      `}</style>

      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50 overflow-hidden"
        style={S.sidebar(collapsed)}
      >
        {/* Shiny top edge */}
        <div style={S.shineTop} />

        {/* ── Logo + Toggle ── */}
        <div
          className="flex items-center h-14 px-3"
          style={{
            borderBottom: '1px solid rgba(55,138,221,0.15)',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div style={S.logoIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-white text-sm leading-none tracking-tight">ParkWatch</p>
                <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(176,210,255,0.5)', letterSpacing: '0.4px', textTransform: 'uppercase', fontSize: '9px' }}>Admin Panel</p>
              </div>
            </div>
          )}

          <button
            onClick={handleToggle}
            className="pw-toggle w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200"
            style={{
              background: 'rgba(55,138,221,0.08)',
              border: '1px solid rgba(55,138,221,0.18)',
              color: 'rgba(176,210,255,0.5)',
              cursor: 'pointer',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>

        {/* ── User Info ── */}
        <div
          className="px-3 py-3 flex items-center overflow-hidden"
          style={{
            borderBottom: '1px solid rgba(55,138,221,0.15)',
            gap: collapsed ? 0 : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={S.avatarRing}
          >
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name ?? "Admin"}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(176,210,255,0.45)', fontSize: '10px' }}>{user?.email ?? ""}</p>
            </div>
          )}
        </div>

        {/* ── Nav Items ── */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <div key={item.to} className="relative" style={{ position: 'relative' }}>
              <NavLink
                to={item.to}
                title={collapsed ? item.label : ""}
                className="pw-nav-item flex items-center rounded-xl text-sm font-medium relative overflow-hidden"
                style={({ isActive }) => ({
                  padding: '9px 10px',
                  gap: collapsed ? 0 : '10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  ...(isActive ? S.navActive : S.navInactive),
                  textDecoration: 'none',
                })}
                onMouseEnter={() => setHoveredItem(item.to)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {({ isActive }) => {
                  const badgeValue = item.badgeKey === 'laporanBaru' ? laporanBaru : 0;
                  return (
                    <>
                      {/* Active left bar */}
                      {isActive && <span style={S.activeBar} />}

                      {item.icon}

                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {/* Badge */}
                      {!collapsed && badgeValue > 0 && (
                        <span
                          className="ml-auto text-white rounded-full flex items-center justify-center"
                          style={{
                            ...S.badge,
                            fontSize: '9px',
                            fontWeight: 700,
                            minWidth: '18px',
                            height: '18px',
                            padding: '0 5px',
                          }}
                        >
                          {badgeValue}
                        </span>
                      )}

                      {/* Collapsed badge dot */}
                      {collapsed && badgeValue > 0 && (
                        <span
                          className="absolute top-1 right-1 w-2 h-2 rounded-full"
                          style={{ background: '#22D3EE', boxShadow: '0 0 6px #22D3EE' }}
                        />
                      )}

                      {/* Hover background glow (inactive only) */}
                      {!isActive && (
                        <span
                          className="absolute inset-0 rounded-xl transition-opacity duration-200 pointer-events-none"
                          style={{
                            background: 'rgba(55,138,221,0.07)',
                            opacity: hoveredItem === item.to ? 1 : 0,
                          }}
                        />
                      )}
                    </>
                  );
                }}
              </NavLink>

              {/* Tooltip — only when collapsed */}
              {collapsed && hoveredItem === item.to && (
                <div style={S.tooltip}>
                  {item.label}
                  {item.badge ? ` (${item.badge})` : ''}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(55,138,221,0.15)' }}>
          {/* Logout tooltip wrapper */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={handleLogout}
              className="pw-logout w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                padding: '9px 10px',
                gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'rgba(252,99,99,0.65)',
                border: '1px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
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
  );
}
