import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";

const navItems = [
  {
    to: "/admin/dashboard",
    label: "Home",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: "/admin/roster",
    label: "Roster",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/admin/pengaturan",
    label: "Setting",
    showBadge: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminBottomNav() {
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const formatBadge = (num) => (num > 99 ? "99+" : num > 0 ? num : null);

  return (
    <>
      <style>{`
        @keyframes pw-badge-pulse {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 12px rgba(239,68,68,0.7); }
        }
        
        /* ✅ Fix untuk mobile viewport */
        .bottom-nav-fixed {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 9999 !important;
          transform: translateZ(0); /* Hardware acceleration */
          -webkit-transform: translateZ(0);
          will-change: auto;
        }
        
        /* ✅ Safe area untuk iPhone notch */
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        /* ✅ Prevent body scroll issues */
        body {
          overscroll-behavior-y: none;
        }
      `}</style>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="bottom-nav-fixed md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const badgeValue = item.showBadge && item.badgeType ? badgeCounts[item.badgeType] : 0;
            const displayBadge = formatBadge(badgeValue);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
                    isActive ? "text-blue-400" : "text-slate-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {item.icon}
                      {displayBadge && (
                        <span 
                          className="absolute -top-1 -right-1 min-w-[18px] h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-slate-900" 
                          style={{ animation: "pw-badge-pulse 2s ease-in-out infinite" }}
                        >
                          {displayBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-400 hover:text-red-400 transition-all" 
            title="Keluar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] mt-0.5 font-medium">Keluar</span>
          </button>
        </div>
      </nav>
    </>
  );
}