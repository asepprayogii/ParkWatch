import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminBottomNav from './AdminBottomNav'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#222834] transition-colors duration-300 text-slate-900 dark:text-slate-100"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Sidebar — desktop only */}
      <AdminSidebar onCollapse={setCollapsed} />

      {/* Topbar — mobile only */}
      <div className="md:hidden">
        <AdminTopbar title={title} />
      </div>

      {/* Main Content */}
      <main
        className="transition-all duration-300 ease-in-out pt-14 pb-24 px-4 md:pt-8 md:pb-8 md:px-6"
        style={{ marginLeft: 0 }}
      >
        <style>{`
          @media (min-width: 768px) {
            .admin-main { margin-left: ${collapsed ? '64px' : '224px'}; }
          }
          .admin-main { transition: margin-left 0.3s cubic-bezier(.4,0,.2,1); }
        `}</style>
        <div className="admin-main">
          {/* Desktop page title */}
          <div className="hidden md:flex items-start justify-between mb-6">
            <div>
              <h1
                className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300"
                style={{ letterSpacing: '-0.4px' }}
              >
                {title}
              </h1>
              <div
                className="mt-1.5 h-0.5 w-10 rounded-full"
                style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }}
              />
            </div>
          </div>
          {children}
        </div>
      </main>

      {/* Bottom Nav — mobile only */}
      <div className="md:hidden">
        <AdminBottomNav />
      </div>
    </div>
  )
}
