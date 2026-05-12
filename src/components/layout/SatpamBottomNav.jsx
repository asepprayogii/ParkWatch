import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { useTheme } from "../../store/ThemeContext"; // ✅ Import useTheme
import { getUnreadCount } from "../../services/notifications";
import { supabase } from "../../lib/supabase";
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  {
    to: "/satpam/dashboard",
    label: "Laporan",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: "/satpam/notifikasi",
    label: "Notif",
    hasNotifBadge: true,
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: "/satpam/jadwal",
    label: "Jadwal",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/satpam/riwayat",
    label: "Riwayat",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/satpam/profil",
    label: "Profil",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function SatpamBottomNav() {
  const { user } = useAuth();
  const { theme } = useTheme(); // ✅ Ambil theme
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnread);
    const channel = supabase
      .channel('satpam-bottom-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // ✅ Theme-aware styles
  const themeStyles = {
    bg: theme === "dark" ? "bg-[#242C3B]" : "bg-white",
    border: theme === "dark" ? "border-[#353F54]" : "border-slate-200",
    textInactive: theme === "dark" ? "text-slate-400" : "text-slate-500",
    textActive: theme === "dark" ? "text-green-400" : "text-green-600",
    hoverText: theme === "dark" ? "hover:text-slate-300" : "hover:text-slate-600",
    badgeBorder: theme === "dark" ? "border-[#242C3B]" : "border-white",
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t md:hidden transition-colors duration-300 ${themeStyles.bg} ${themeStyles.border}`}>
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition relative flex-1 min-w-0",
                isActive 
                  ? cn(themeStyles.textActive, "bg-green-500/10") 
                  : cn(themeStyles.textInactive, themeStyles.hoverText)
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {item.icon(isActive)}
                  {item.hasNotifBadge && unread > 0 && (
                    <div className={`absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 ${themeStyles.badgeBorder}`}>
                      <span className="text-white font-bold" style={{ fontSize: '8px' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight text-center truncate w-full">{item.label}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-green-600'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}