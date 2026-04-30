import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
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
]

export default function SatpamSidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(setUnread)
    const channel = supabase
      .channel('satpam-sidebar-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
      <div className={`flex items-center h-14 border-b border-slate-200 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-none">ParkWatch</p>
              <p className="text-slate-400 text-xs">Satpam</p>
            </div>
          </div>
        )}
        <button onClick={handleToggle} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-green-600">{user?.full_name?.charAt(0).toUpperCase() ?? "S"}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.full_name ?? "Satpam"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : ""}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-xl transition text-sm font-medium relative
              ${collapsed ? "justify-center" : ""}
              ${isActive ? "bg-green-50 text-green-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`
            }
          >
            {/* Icon + badge */}
            <div className="relative shrink-0">
              {item.icon}
              {item.hasNotifBadge && unread > 0 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold" style={{ fontSize: '7px' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="flex-1">{item.label}</span>
            )}
            {/* Badge angka di kanan saat tidak collapsed */}
            {!collapsed && item.hasNotifBadge && unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-slate-100">
        <button onClick={handleLogout} title={collapsed ? "Keluar" : ""}
          className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition ${collapsed ? "justify-center" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}