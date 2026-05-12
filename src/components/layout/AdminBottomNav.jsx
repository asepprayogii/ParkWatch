import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../store/authContext";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../store/ThemeContext";
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ✅ NAV ITEMS - 5 item saja (tanpa logout)
const navItems = [
  {
    to: "/admin/dashboard",
    label: "Home",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/admin/laporan",
    label: "Laporan",
    showBadge: true,
    badgeType: "pending",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: "/admin/zona",
    label: "Zona",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: "/admin/satpam",
    label: "Satpam",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: "/admin/roster",
    label: "Roster",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function AdminBottomNav() {
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0 });
  const { theme } = useTheme();

  // ✅ Fetch badge counts & Realtime subscription
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
      .channel("admin-bottomnav-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchCounts)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const formatBadge = (num) => (num > 99 ? "99+" : num > 0 ? num : null);

  // ✅ Theme-aware styles
  const themeStyles = {
    bg: theme === "dark" ? "bg-slate-900/95" : "bg-white/95",
    border: theme === "dark" ? "border-slate-700/50" : "border-slate-200",
    textInactive: theme === "dark" ? "text-slate-400" : "text-slate-500",
    textActive: "text-blue-500",
    hoverBg: theme === "dark" ? "hover:bg-slate-800/50" : "hover:bg-slate-100",
    hoverText: theme === "dark" ? "hover:text-slate-200" : "hover:text-slate-700",
    badgeBorder: theme === "dark" ? "border-slate-900" : "border-white",
  };

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 12px rgba(239,68,68,0.7); }
        }
        .bottom-nav-fixed {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 9999 !important;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: auto;
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        body {
          overscroll-behavior-y: none;
        }
      `}</style>

      {/* Bottom Navigation - Mobile Only */}
      <nav className={cn("bottom-nav-fixed md:hidden backdrop-blur-lg border-t safe-area-pb", themeStyles.bg, themeStyles.border)}>
        {/* ✅ 5 item muat penuh dengan justify-between */}
        <div className="flex items-center justify-between py-1.5 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const badgeValue = item.showBadge && item.badgeType ? badgeCounts[item.badgeType] : 0;
            const displayBadge = formatBadge(badgeValue);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all relative flex-1 min-w-0",
                    isActive 
                      ? cn(themeStyles.textActive, "bg-blue-500/10") 
                      : cn(themeStyles.textInactive, themeStyles.hoverBg, themeStyles.hoverText)
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {item.icon}
                      {displayBadge && (
                        <span 
                          className={cn(
                            "absolute -top-0.5 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 animate-pulse",
                            themeStyles.badgeBorder
                          )} 
                        >
                          {displayBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] mt-0.5 font-medium text-center leading-tight truncate w-full">{item.label}</span>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}