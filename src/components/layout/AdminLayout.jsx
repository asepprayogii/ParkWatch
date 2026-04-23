import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminBottomNav from './AdminBottomNav'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar — desktop only */}
      <AdminSidebar onCollapse={setCollapsed} />

      {/* Topbar — mobile only */}
      <div className="md:hidden">
        <AdminTopbar title={title} />
      </div>

      {/* Main Content */}
      <main className={`
        transition-all duration-300
        pt-14 pb-20 px-4
        md:pt-8 md:pb-8 md:px-6
        ${collapsed ? 'md:ml-16' : 'md:ml-56'}
      `}>
        <div className="hidden md:block mb-6">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
        {children}
      </main>

      {/* Bottom Nav — mobile only */}
      <div className="md:hidden">
        <AdminBottomNav />
      </div>
    </div>
  )
}