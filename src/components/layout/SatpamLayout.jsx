import { useState, useEffect } from 'react'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../store/ThemeContext' // ✅ Import useTheme
import { getUnreadCount } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import { logout } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import SatpamSidebar from './SatpamSidebar'
import SatpamBottomNav from './SatpamBottomNav'
import PageTransition from '../ui/PageTransition'

export default function SatpamLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme() // ✅ Ambil theme & toggle
  const navigate = useNavigate()
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

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#222834] transition-colors duration-300 text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SatpamSidebar onCollapse={setCollapsed} />
      
      {/* ✅ Topbar Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#242C3B] border-b border-slate-200 dark:border-[#353F54] px-4 h-14 flex items-center justify-between transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ParkWatch" className="w-7 h-7 object-contain shrink-0" />
          <span className="font-bold text-slate-800 dark:text-white text-sm">ParkWatch</span>
        </div>

        {/* ✅ Actions: Theme Toggle + Logout */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#353F54] transition"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            title="Keluar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      <main className={`transition-all duration-300 pt-14 pb-20 px-4 md:pt-8 md:pb-8 md:px-6 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="hidden md:block mb-6">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          </div>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      <SatpamBottomNav />
    </div>
  )
}