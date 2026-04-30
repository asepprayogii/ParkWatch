import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { getUnreadCount } from "../../services/notifications";
import { supabase } from "../../lib/supabase";

const navItems = [
  {
    to: "/user/feed",
    label: "Beranda",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/user/riwayat",
    label: "Riwayat",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/user/upload",
    label: "Lapor",
    isMain: true,
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: "/user/notifications",
    label: "Notifikasi",
    hasNotifBadge: true,
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: "/user/profile",
    label: "Profil",
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnread);

    const channel = supabase
      .channel('user-bottom-notif')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-1 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) =>
          item.isMain ? (
            <NavLink key={item.to} to={item.to} className="flex flex-col items-center -mt-5">
              <div className="w-13 h-13 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200" style={{ width: 52, height: 52 }}>
                {item.icon()}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1">{item.label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition relative
                ${isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {item.icon(isActive)}
                    {item.hasNotifBadge && unread > 0 && (
                      <div className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold" style={{ fontSize: '8px' }}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </div>
  );
}
