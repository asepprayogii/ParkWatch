import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../store/ThemeContext";
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

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

const S = {
  sidebar: (collapsed, theme) => ({
    width: collapsed ? "64px" : "224px",
    background: theme === "dark" ? "#242C3B" : "#FFFFFF",
    borderRight: `1px solid ${theme === "dark" ? "#353F54" : "#E2E8F0"}`,
    transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }),
  shineTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.35), transparent)",
  },
  avatarRing: {
    background: "linear-gradient(135deg, #185FA5, #22D3EE)",
    boxShadow: "0 0 10px rgba(34,211,238,0.2)",
  },
  activeBar: {
    position: "absolute", left: 0, top: "20%", bottom: "20%", width: "3px",
    background: "linear-gradient(180deg, #22D3EE, #185FA5)",
    borderRadius: "0 3px 3px 0",
  },
  badge: {
    background: "linear-gradient(135deg, #ef4444, #f97316)",
    boxShadow: "0 0 8px rgba(239,68,68,0.4)",
    animation: "pw-badge-pulse 2s ease-in-out infinite",
  },
  tooltip: {
    position: "absolute", left: "56px", top: "50%", transform: "translateY(-50%)",
    background: "rgba(2,18,42,0.95)", border: "1px solid rgba(55,138,221,0.2)",
    backdropFilter: "blur(10px)", color: "#f0f6ff",
    fontSize: "12px", fontWeight: 500, padding: "5px 10px",
    borderRadius: "8px", whiteSpace: "nowrap", zIndex: 100,
    pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
};

export default function AdminSidebar({ onCollapse }) {
  // ✅ Load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // ✅ Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
    onCollapse?.(collapsed);
  }, [collapsed, onCollapse]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: pendingCount } = await supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        setBadgeCounts({ pending: pendingCount ?? 0 });
      } catch (err) {
        console.error("Error fetching badge counts:", err);
      }
    };
    fetchCounts();
    const channel = supabase
      .channel("admin-sidebar-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchCounts)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.full_name?.charAt(0) || "A").toUpperCase();
  const formatBadge = (num) => (num > 99 ? "99+" : num > 0 ? num : null);

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 14px rgba(239,68,68,0.75); }
        }
        .pw-nav-item { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .pw-nav-item:hover { transform: translateX(2px); }
        .pw-toggle:hover { background: rgba(55,138,221,0.2) !important; }
        .pw-logout:hover { background: rgba(252,99,99,0.08) !important; border-color: rgba(252,99,99,0.2) !important; color: #fc6363 !important; }
      `}</style>

      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50 overflow-hidden" style={S.sidebar(collapsed, theme)}>
        <div style={S.shineTop} />

        {/* Logo + Toggle - SELALU MUNCUL */}
        <div className="flex items-center h-14 px-3 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0', justifyContent: 'center' }}>
          
          {/* ✅ Logo ParkWatch - HANYA MUNCUL SAAT EXPANDED */}
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src="/logo.png" alt="ParkWatch" className="w-8 h-8 object-contain shrink-0" />
              <div className="overflow-hidden">
                <p className={cn("font-bold text-sm leading-none tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>ParkWatch</p>
                <p className="text-xs leading-none mt-0.5" style={{ color: theme === 'dark' ? "rgba(176,210,255,0.5)" : "rgba(100,116,139,0.7)", letterSpacing: "0.4px", textTransform: "uppercase", fontSize: "9px" }}>Admin Panel</p>
              </div>
            </div>
          )}

          {/* ✅ Toggle Button - SELALU MUNCUL (di kanan) */}
          <button
            onClick={handleToggle}
            className="pw-toggle w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200 ml-auto"
            style={{
              background: "rgba(55,138,221,0.08)", border: "1px solid rgba(55,138,221,0.18)",
              color: "rgba(176,210,255,0.5)", cursor: "pointer",
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {collapsed 
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="px-3 py-3 flex items-center border-b" style={{ borderColor: theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0', gap: collapsed ? 0 : "10px", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={S.avatarRing}>
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{user?.full_name ?? "Admin"}</p>
              <p className="text-xs truncate" style={{ color: theme === 'dark' ? "rgba(176,210,255,0.45)" : "rgba(100,116,139,0.7)", fontSize: "10px" }}>{user?.email ?? ""}</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const badgeValue = item.showBadge && item.badgeType ? badgeCounts[item.badgeType] : 0;
            const displayBadge = formatBadge(badgeValue);
            return (
              <div key={item.to} className="relative" style={{ position: "relative" }} onMouseEnter={() => setHoveredItem(item.to)} onMouseLeave={() => setHoveredItem(null)}>
                <NavLink
                  to={item.to}
                  title={collapsed ? item.label : ""}
                  className={({ isActive }) =>
                    `pw-nav-item flex items-center rounded-xl text-sm font-bold relative overflow-hidden px-2 py-2.5 transition-all duration-200 ${
                      isActive ? "bg-park-indigo text-white shadow-lg" : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-park-border/50 hover:text-slate-900 dark:hover:text-white"
                    } ${collapsed ? "justify-center" : "justify-start"}`
                  }
                  style={({ isActive }) => ({
                    gap: collapsed ? 0 : "10px",
                    ...(isActive && { boxShadow: "0 0 18px rgba(6,182,212,0.1), inset 0 0 0 1px rgba(255,255,255,0.04)" }),
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span style={S.activeBar} />}
                      <div className="relative shrink-0">
                        {item.icon}
                        {collapsed && displayBadge && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {displayBadge && <span className="text-white rounded-full flex items-center justify-center font-bold shrink-0" style={{ ...S.badge, fontSize: "9px", minWidth: "18px", height: "18px", padding: "0 5px" }}>{displayBadge}</span>}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
                {collapsed && hoveredItem === item.to && <div style={S.tooltip}>{item.label}{displayBadge && ` (${displayBadge})`}</div>}
              </div>
            );
          })}
        </nav>

        {/* Theme & Logout */}
        <div className="px-2 py-3 flex flex-col gap-1 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(55,138,221,0.15)' : '#E2E8F0' }}>
          <div className="relative" onMouseEnter={() => setHoveredItem("theme")} onMouseLeave={() => setHoveredItem(null)}>
            <button onClick={toggleTheme} className="pw-nav-item w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200" style={{ padding: "9px 10px", gap: collapsed ? 0 : "10px", justifyContent: collapsed ? "center" : "flex-start", color: "rgba(176,210,255,0.65)", border: "1px solid transparent", background: "transparent", cursor: "pointer" }}>
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
            {collapsed && hoveredItem === "theme" && <div style={{ ...S.tooltip, color: "#f0f6ff" }}>{theme === 'dark' ? 'Terang' : 'Gelap'}</div>}
          </div>
          <div className="relative" onMouseEnter={() => setHoveredItem("logout")} onMouseLeave={() => setHoveredItem(null)}>
            <button onClick={handleLogout} className="pw-logout w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200" style={{ padding: "9px 10px", gap: collapsed ? 0 : "10px", justifyContent: collapsed ? "center" : "flex-start", color: "rgba(252,99,99,0.65)", border: "1px solid transparent", background: "transparent", cursor: "pointer" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span>Keluar</span>}
            </button>
            {collapsed && hoveredItem === "logout" && <div style={{ ...S.tooltip, color: "#fc6363" }}>Keluar</div>}
          </div>
        </div>
      </aside>
    </>
  );
}