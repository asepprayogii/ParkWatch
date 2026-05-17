import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import UserLayout from '../../components/layout/UserLayout'
import { motion } from 'framer-motion'
import { 
  Bell, CheckCircle, Activity, AlertTriangle, 
  MapPin, Clock, Eye
} from 'lucide-react'

const getStatusIcon = (message) => {
  const msg = message.toLowerCase()
  if (msg.includes('sedang') || msg.includes('proses')) {
    return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  }
  if (msg.includes('selesai') || msg.includes('resolved')) {
    return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
  }
  return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
}

function timeAgo(dateStr) {
  if (!dateStr) return "-"
  const parsedDate = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateStr)
    ? new Date(dateStr.trim() + 'Z')
    : new Date(dateStr);
  const diff = Math.floor((Date.now() - parsedDate) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function UserNotifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(user.id)
      setNotifications(data)
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }, [user.id])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    const channel = supabase
      .channel('user-notif-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchNotifications, user.id])

  const handleOpenReport = async (reportId, notifId) => {
    await markAsRead(notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    navigate(`/user/report-detail/${reportId}`)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <UserLayout>
      <div className="py-3 space-y-4">
        {unreadCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-300 font-bold">
                <span className="font-black">{unreadCount}</span> pesan belum dibaca
              </span>
            </div>
            <button 
              onClick={handleMarkAllAsRead} 
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Tandai semua dibaca
            </button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] h-24 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54]"
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#2a3142] rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">Belum ada notifikasi</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Update status laporan akan muncul di sini</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(notif => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleOpenReport(notif.related_report_id, notif.id)}
                className={`w-full text-left rounded-2xl border px-4 py-4 transition-all hover:shadow-md ${
                  notif.is_read 
                    ? 'bg-white dark:bg-[#242C3B] border-slate-200 dark:border-[#353F54] opacity-80' 
                    : 'bg-blue-50/40 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.is_read ? 'bg-slate-100 dark:bg-[#2a3142]' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getStatusIcon(notif.message)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`text-xs font-bold ${
                        notif.is_read ? 'text-slate-400 dark:text-slate-500' : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {notif.is_read ? 'Update Status' : 'Status Diperbarui'}
                      </p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                      {notif.message}
                    </p>
                    {notif.reports?.plate_number && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-900 dark:bg-[#1a1f2e] text-white font-mono text-xs px-2 py-1 rounded-md tracking-wider font-bold">
                          {notif.reports.plate_number}
                        </span>
                        {notif.reports?.zones?.name && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {notif.reports.zones.name}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  )
}