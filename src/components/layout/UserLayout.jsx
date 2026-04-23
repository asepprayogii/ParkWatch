import { useState } from 'react'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function UserLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — desktop only */}
      <Sidebar onCollapse={setCollapsed} />

      {/* Topbar — mobile only */}
      <div className="md:hidden">
        <Topbar title={title} />
      </div>

      {/* Main Content — margin kiri menyesuaikan sidebar */}
      <main className={`
        pt-14 pb-20 px-4
        md:pt-8 md:pb-8 md:px-8
        transition-all duration-300
        ${collapsed ? 'md:ml-16' : 'md:ml-56'}
      `}>
        <div className="hidden md:block mb-6">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
        {children}
      </main>

      {/* Bottom Nav — mobile only */}
      <BottomNav />
    </div>
  )
}