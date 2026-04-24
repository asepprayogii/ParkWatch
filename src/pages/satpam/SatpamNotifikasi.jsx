import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../store/AuthContext";
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notifications";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function SatpamNotifikasi() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel("satpam-notif")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        fetchNotifications,
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotifications, user.id]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SatpamLayout title="Notifikasi">
      <div className="py-3">
        {unreadCount > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-green-600">{unreadCount}</span> belum dibaca
            </span>
            <button onClick={handleMarkAllAsRead} className="text-xs text-green-600 font-semibold hover:underline">
              Tandai semua dibaca
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Belum ada notifikasi</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`w-full text-left bg-white rounded-2xl border px-4 py-3 transition
                  ${notif.is_read ? "border-slate-200" : "border-green-200 bg-green-50/40"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${notif.type === "new_report" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-500">{notif.type === "new_report" ? "Laporan Baru" : "Update Status"}</p>
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
      </div>
    </SatpamLayout>
  );
}
