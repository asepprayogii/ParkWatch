import { useState } from 'react'
import SatpamSidebar from './SatpamSidebar'
import SatpamBottomNav from './SatpamBottomNav'
import SatpamTopbar from './SatpamTopbar'

export default function SatpamLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('satpam-sidebar-collapsed') ?? 'false') } catch { return false }
  })

  const sidebarW = collapsed ? 64 : 224

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#222834] transition-colors duration-300 text-slate-900 dark:text-slate-100"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Topbar — selalu ada (z-50), sidebar akan menimpa bagian kirinya (z-60) ── */}
      <SatpamTopbar />

      {/* ── Sidebar — desktop only (z-60 menimpa topbar di area kiri) ── */}
      <SatpamSidebar onCollapse={setCollapsed} />

      {/* ── Main Content ── */}
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          paddingTop: 56,    // tinggi topbar
          paddingBottom: 80, // ruang bottomnav mobile
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <style>{`
          .satpam-content-wrap {
            padding-top: 16px;  /* mobile: sama dengan padding kiri/kanan */
            transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
          }
          /* Desktop: geser konten ke kanan sesuai lebar sidebar */
          @media (min-width: 768px) {
            .satpam-content-wrap {
              margin-left: ${sidebarW}px;
              padding-top: 24px;  /* desktop: sama dengan padding kiri */
              padding-bottom: 24px;
              padding-left: 24px;
              padding-right: 24px;
            }
          }
        `}</style>

        <div className="satpam-content-wrap">
          {children}
        </div>
      </main>

      {/* ── Bottom Nav — mobile only ── */}
      <div className="md:hidden">
        <SatpamBottomNav />
      </div>
    </div>
  )
}