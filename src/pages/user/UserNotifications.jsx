import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom' // <--- PENTING
import { useAuth } from '../../store/authContext'
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import UserLayout from '../../components/layout/UserLayout'

// Helper icon user
const getStatusIcon = (message) => {
  const msg = message.toLowerCase()
  if (msg.includes('sedang') || msg.includes('proses')) {
    return <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
  if (msg.includes('selesai') || msg.includes('resolved')) {
    return <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
  return <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function UserNotifications() {
  const { user } = useAuth()
  const navigate = useNavigate() // <--- PENTING
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(user.id)
      setNotifications(data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user.id])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  
  useEffect(() => {
    const channel = supabase.channel('user-notif-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchNotifications, user.id])

  // ✅ FUNGSI BARU: Baca lalu arahkan ke detail
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
    <UserLayout title="Notifikasi Saya">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm text-blue-800 font-medium">
            <span className="font-bold">{unreadCount}</span> pesan belum dibaca
          </span>
          <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 font-semibold hover:underline">
            Tandai semua dibaca
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada notifikasi</p>
          <p className="text-slate-400 text-sm mt-1">Update status laporan akan muncul di sini</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(notif => (
            <button
              key={notif.id}
              // ✅ PERUBAHAN: Panggil handleOpenReport
              onClick={() => handleOpenReport(notif.related_report_id, notif.id)}
              className={`w-full text-left bg-white rounded-2xl border px-4 py-3 transition-all hover:shadow-md
                ${notif.is_read ? 'border-slate-200 opacity-80' : 'border-blue-200 bg-blue-50/40'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                  {getStatusIcon(notif.message)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${notif.is_read ? 'text-slate-400' : 'text-blue-700'}`}>
                      {notif.is_read ? 'Update Status' : 'Status Diperbarui'}
                    </p>
                    {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{notif.message}</p>
                  {notif.reports?.plate_number && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5">
                      <span className="bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded-md tracking-wider">
                        {notif.reports.plate_number}
                      </span>
                      {notif.reports?.zones?.name && (
                        <span className="text-xs text-slate-400">{notif.reports.zones.name}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </UserLayout>
  )
}