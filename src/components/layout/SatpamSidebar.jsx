import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
import { useTheme } from "../../store/ThemeContext";
import { getUnreadCount } from "../../services/notifications";
import { supabase } from "../../lib/supabase";

const navItems = [
  {
    to: "/satpam/dashboard",
    label: "Laporan Masuk",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: "/satpam/notifikasi",
    label: "Notifikasi",
    hasNotifBadge: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: "/satpam/jadwal",
    label: "Jadwal Saya",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/satpam/riwayat",
    label: "Riwayat",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/satpam/profil",
    label: "Profil Saya",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function SatpamSidebar({ onCollapse }) {
  // ✅ Load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('satpam-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [unread, setUnread] = useState(0);

  // ✅ Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('satpam-sidebar-collapsed', JSON.stringify(collapsed));
    onCollapse?.(collapsed);
  }, [collapsed, onCollapse]);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnread);
    const channel = supabase
      .channel('satpam-sidebar-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    }
  };

  const initials = user?.full_name?.charAt(0)?.toUpperCase() ?? "S";
  const userAvatar = user?.avatar_url || null;

  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-[#242C3B] border-r border-slate-200 dark:border-[#353F54] z-[60] transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      
      {/* Header - Logo + Toggle */}
      <div className={`flex items-center h-14 border-b border-slate-200 dark:border-[#353F54] px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        
        {/* ✅ Logo ParkWatch - HANYA MUNCUL SAAT EXPANDED */}
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.webp" alt="ParkWatch" className="w-7 h-7 object-contain shrink-0" />
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm leading-none">ParkWatch</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">Satpam</p>
            </div>
          </div>
        )}

        {/* ✅ Toggle Button - SELALU MUNCUL (di kanan) */}
        <button
          onClick={handleToggle}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#353F54] text-slate-500 dark:text-slate-400 transition ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <div 
            key={item.to} 
            className="relative" 
            onMouseEnter={() => setHoveredItem(item.to)} 
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavLink
              to={item.to}
              title={collapsed ? item.label : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2.5 rounded-xl transition text-sm font-bold relative
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#353F54] hover:text-slate-900 dark:hover:text-white'}`
              }
              style={({ isActive }) => ({
                ...(isActive && {
                  background: 'linear-gradient(135deg, rgba(24,95,165,0.9), rgba(6,182,212,0.8))',
                  boxShadow: '0 0 18px rgba(6,182,212,0.15)',
                }),
              })}
            >
              <div className="relative shrink-0">
                {item.icon}
                {item.hasNotifBadge && unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#242C3B]">
                    <span className="text-white font-bold" style={{ fontSize: '7px' }}>{unread > 9 ? '9+' : unread}</span>
                  </div>
                )}
              </div>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.hasNotifBadge && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">{unread > 9 ? '9+' : unread}</span>
              )}
            </NavLink>
            {collapsed && hoveredItem === item.to && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-[#1e293b] text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">{item.label}</div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer: Logout Only */}
      <div className="px-2 py-3 border-t border-slate-100 dark:border-[#353F54] flex flex-col gap-1">
        <div className="relative" onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)}>
          <button
            onClick={handleLogout}
            title={collapsed ? "Keluar" : ""}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition ${collapsed ? 'justify-center' : ''}`}
            aria-label="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Keluar</span>}
          </button>
          {collapsed && hoveredItem === 'logout' && (
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-[#1e293b] text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg" style={{ color: '#fc6363' }}>Keluar</div>
          )}
        </div>
      </div>
    </aside>
  );
}