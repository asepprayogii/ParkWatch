import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminBottomNav from './AdminBottomNav'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen relative" style={{ background: '#0a1628', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Animated mesh background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(6,182,212,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 85% 80%, rgba(24,95,165,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(55,138,221,0.03) 0%, transparent 70%)
          `
        }}
      />

      {/* Sidebar — desktop only */}
      <AdminSidebar onCollapse={setCollapsed} />

      {/* Topbar — mobile only */}
      <div className="md:hidden">
        <AdminTopbar title={title} />
      </div>

      {/* Main Content */}
      <main
        className="relative z-10 transition-all duration-300 ease-in-out pt-14 pb-20 px-4 md:pt-8 md:pb-8 md:px-6"
        style={{ marginLeft: 0 }}
      >
        {/* Desktop margin handled by inline style for precision */}
        <style>{`
          @media (min-width: 768px) {
            .admin-main { margin-left: ${collapsed ? '64px' : '224px'}; }
          }
        `}</style>
        <div className="admin-main transition-all duration-300">
          {/* Desktop page title */}
          <div className="hidden md:block mb-6">
            <h1
              className="text-xl font-bold"
              style={{ color: '#f0f6ff', letterSpacing: '-0.5px' }}
            >
              {title}
            </h1>
            <div
              className="mt-1 h-0.5 w-12 rounded-full"
              style={{ background: 'linear-gradient(90deg, #185FA5, #22D3EE)' }}
            />
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
