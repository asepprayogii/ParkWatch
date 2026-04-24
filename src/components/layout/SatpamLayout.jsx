import { useState, useEffect } from 'react'
import { useAuth } from '../../store/AuthContext'
import { getUnreadCount } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import SatpamSidebar from './SatpamSidebar'
import SatpamBottomNav from './SatpamBottomNav'

export default function SatpamLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(setUnread)

    const channel = supabase
      .channel('satpam-notif-count')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => getUnreadCount(user.id).then(setUnread))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  return (
    <div className="min-h-screen bg-slate-50">
      <SatpamSidebar onCollapse={setCollapsed} />

      {/* Topbar mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-sm">ParkWatch</span>
        </div>

        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-slate-700 text-sm">{title}</h1>

        {/* Badge notifikasi */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          {unread > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontSize: '9px' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            </div>
          )}
        </div>
      </div>

      <main className={`transition-all duration-300 pt-14 pb-20 px-4 md:pt-8 md:pb-8 md:px-6 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="hidden md:block mb-6">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
        {children}
      </main>

      <SatpamBottomNav />
    </div>
  )
}