import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../store/AuthContext'
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import UserLayout from '../../components/layout/UserLayout'

const typeConfig = {
  report_verified: {
    label: 'Laporan Diverifikasi',
    color: 'bg-green-100 text-green-600',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  action_update: {
    label: 'Status Diperbarui',
    color: 'bg-blue-100 text-blue-600',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  new_report: {
    label: 'Laporan Baru',
    color: 'bg-yellow-100 text-yellow-600',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchNotifications, user.id])

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <UserLayout title="Notifikasi">
      <div className="py-3">

        {/* Header */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-blue-600">{unreadCount}</span> belum dibaca
            </span>
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Tandai semua dibaca
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Belum ada notifikasi</p>
            <p className="text-slate-400 text-sm mt-1">Notifikasi akan muncul saat ada update laporan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(notif => {
              const config = typeConfig[notif.type] ?? typeConfig.new_report
              return (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`w-full text-left bg-white rounded-2xl border px-4 py-3 transition
                    ${notif.is_read ? 'border-slate-200' : 'border-blue-200 bg-blue-50/40'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-500">{config.label}</p>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
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
              )
            })}
          </div>
        )}
      </div>
    </UserLayout>
  )
}