import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom" // <--- PENTING: Import ini
import { useAuth } from "../../store/AuthContext"
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notifications"
import { supabase } from "../../lib/supabase"
import SatpamLayout from "../../components/layout/SatpamLayout"

// Helper icon
const getSatpamIcon = (type) => {
  if (type === 'new_report') {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function SatpamNotifikasi() {
  const { user } = useAuth()
  const navigate = useNavigate() // <--- PENTING: Hook untuk navigasi
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(user.id)
      setNotifications(data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user.id])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Realtime listener
  useEffect(() => {
    const channel = supabase.channel("satpam-notif-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchNotifications, user.id])

  // ✅ FUNGSI BARU: Baca lalu arahkan ke detail
  const handleOpenReport = async (reportId, notifId) => {
    await markAsRead(notifId)
    // Update tampilan lokal agar langsung jadi abu-abu
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    // Pindah ke halaman detail
    navigate(`/satpam/report-detail/${reportId}`)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <SatpamLayout title="Notifikasi Tugas">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <span className="text-sm text-green-800 font-medium">
            <span className="font-bold">{unreadCount}</span> tugas baru menunggu
          </span>
          <button onClick={handleMarkAllAsRead} className="text-xs text-green-600 font-semibold hover:underline">
            Tandai semua dibaca
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(notif => (
            <button
              key={notif.id}
              // ✅ PERUBAHAN: Panggil handleOpenReport, bukan handleMarkAsRead
              onClick={() => handleOpenReport(notif.related_report_id, notif.id)}
              className={`w-full text-left bg-white rounded-2xl border px-4 py-3 transition-all hover:shadow-md
                ${notif.is_read ? "border-slate-200 opacity-80" : "border-green-200 bg-green-50/40"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-100' : 'bg-green-100'}`}>
                  {getSatpamIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${notif.is_read ? 'text-slate-400' : 'text-green-700'}`}>
                      {notif.type === 'new_report' ? 'Laporan Masuk' : 'Update Tugas'}
                    </p>
                    {!notif.is_read && <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{notif.message}</p>
                  {notif.reports?.plate_number && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5">
                      <span className="bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded-md tracking-wider">{notif.reports.plate_number}</span>
                      {notif.reports?.zones?.name && <span className="text-xs text-slate-400">{notif.reports.zones.name}</span>}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </SatpamLayout>
  )
}