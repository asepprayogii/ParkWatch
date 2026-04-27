import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logout } from "../../services/auth";
import { supabase } from "../../lib/supabase";

export default function AdminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const [laporanBaru, setLaporanBaru] = useState(0);
  const prevPath = useRef(location.pathname);

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
      .channel('admin-bottom-nav-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchBadges)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const navItems = [
    {
      to: "/admin/dashboard",
      label: "Beranda",
      badge: false,
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: "/admin/laporan",
      label: "Laporan",
      badge: laporanBaru > 0,
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      to: "/admin/zona",
      label: "Zona",
      badge: false,
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      to: "/admin/satpam",
      label: "Satpam",
      badge: false,
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      to: "/admin/roster",
      label: "Jadwal",
      badge: false,
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // Trigger transisi saat route berubah
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  const handleNavClick = (to, e, isActive) => {
    if (isActive) return; // sudah di halaman ini
    e.preventDefault();
    setTransitioning(true);
    setTimeout(() => {
      navigate(to);
      setTransitioning(false);
    }, 220);
  };

  const handleLogout = async () => {
    setTransitioning(true);
    setTimeout(async () => {
      await logout();
      navigate("/login");
    }, 200);
  };

  return (
    <>
      <style>{`
        @keyframes pw-fade-slide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pw-ripple {
          0%   { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pw-badge-glow {
          0%,100% { box-shadow: 0 0 5px rgba(34,211,238,0.6); }
          50%      { box-shadow: 0 0 10px rgba(34,211,238,0.9); }
        }
        .pw-tab {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 1;
          padding: 6px 4px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          text-decoration: none;
          overflow: hidden;
        }
        .pw-tab:active { transform: scale(0.93); }
        .pw-tab-label {
          font-size: 10px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s;
          letter-spacing: 0.1px;
        }
        .pw-tab-active-dot {
          position: absolute;
          bottom: 3px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #22D3EE;
          box-shadow: 0 0 6px #22D3EE;
          animation: pw-badge-glow 2s ease-in-out infinite;
        }
        .pw-page-transition {
          position: fixed;
          inset: 0;
          z-index: 40;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(24,95,165,0.12), rgba(6,182,212,0.06));
          transition: opacity 0.22s ease;
        }
        .pw-bottom-bar {
          background: rgba(2, 18, 42, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(55, 138, 221, 0.18);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pw-bottom-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent);
        }
        .pw-logout-tab {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 1;
          padding: 6px 4px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          background: none;
          border: none;
        }
        .pw-logout-tab:active { transform: scale(0.93); }
      `}</style>

      {/* Page transition overlay */}
      <div
        className="pw-page-transition"
        style={{ opacity: transitioning ? 1 : 0 }}
      />

      <div
        className="pw-bottom-bar fixed bottom-0 left-0 right-0 z-50 px-2"
        style={{ height: '64px' }}
      >
        <div className="flex items-center h-full gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="pw-tab"
              onClick={(e) => {
                const isActive = location.pathname === item.to ||
                  location.pathname.startsWith(item.to + '/');
                handleNavClick(item.to, e, isActive);
              }}
              style={({ isActive }) => ({
                color: isActive ? '#22D3EE' : 'rgba(176,210,255,0.45)',
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Badge dot */}
                  {item.badge && (
                    <span
                      className="absolute top-1.5 right-3.5 w-2 h-2 rounded-full"
                      style={{
                        background: '#22D3EE',
                        boxShadow: '0 0 6px rgba(34,211,238,0.8)',
                        animation: 'pw-badge-glow 2s ease-in-out infinite',
                      }}
                    />
                  )}

                  {/* Active background pill */}
                  {isActive && (
                    <span
                      className="absolute inset-x-1 inset-y-0.5 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(24,95,165,0.35), rgba(6,182,212,0.18))',
                        border: '1px solid rgba(34,211,238,0.2)',
                      }}
                    />
                  )}

                  <span className="relative z-10">{item.icon(isActive)}</span>

                  <span
                    className="pw-tab-label relative z-10"
                    style={{
                      color: isActive ? '#22D3EE' : 'rgba(176,210,255,0.45)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Active bottom dot */}
                  {isActive && <span className="pw-tab-active-dot" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="pw-logout-tab"
            style={{ color: 'rgba(252,99,99,0.6)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span
              className="pw-tab-label"
              style={{ color: 'rgba(252,99,99,0.6)', fontWeight: 500 }}
            >
              Keluar
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
