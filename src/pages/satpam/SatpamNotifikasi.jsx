// src/pages/satpam/SatpamNotifikasi.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../store/AuthContext";
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notifications";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { Bell, AlertTriangle, CheckCircle, Activity, MapPin, Clock, Sparkles, ChevronRight, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const parsedDate = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateStr)
    ? new Date(dateStr.trim() + 'Z')
    : new Date(dateStr);
  const diff = Math.floor((Date.now() - parsedDate) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// ── NOTIF CONFIG (Warna lebih soft, text kuning untuk "Menunggu") ──
const notifConfig = {
  new_report: {
    label: "Laporan Baru",
    desc: "Laporan masuk di zona Anda",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/60 dark:bg-amber-500/10",
    border: "border-amber-200/60 dark:border-amber-500/20",
    gradient: "from-amber-500/10 to-transparent",
    pulse: "bg-amber-500",
  },
  assigned: {
    label: "Tugas Diberikan",
    desc: "Anda ditugaskan menangani laporan",
    icon: ShieldCheck,
    color: "text-blue-600 dark:text-[#37B6E9]",
    bg: "bg-blue-100/60 dark:bg-[#37B6E9]/10",
    border: "border-blue-200/60 dark:border-[#37B6E9]/20",
    gradient: "from-[#37B6E9]/10 to-transparent",
    pulse: "bg-[#37B6E9]",
  },
  in_progress: {
    label: "Sedang Diproses",
    desc: "Anda sedang menangani laporan ini",
    icon: Activity,
    color: "text-blue-600 dark:text-[#37B6E9]",
    bg: "bg-blue-100/60 dark:bg-[#37B6E9]/10",
    border: "border-blue-200/60 dark:border-[#37B6E9]/20",
    gradient: "from-[#37B6E9]/10 to-transparent",
    pulse: "bg-[#37B6E9]",
  },
  resolved: {
    label: "Selesai Ditangani",
    desc: "Laporan telah Anda selesaikan",
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/60 dark:bg-emerald-500/10",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    gradient: "from-emerald-500/10 to-transparent",
    pulse: "bg-emerald-500",
  },
  default: {
    label: "Notifikasi",
    desc: "Update dari sistem",
    icon: Bell,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100/60 dark:bg-slate-700/30",
    border: "border-slate-200/60 dark:border-slate-600/30",
    gradient: "from-slate-500/10 to-transparent",
    pulse: "bg-slate-400",
  },
};

// ── GLASS CARD ──
function GlassCard({ children, className, hover = true, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[20px] overflow-hidden transition-all duration-300",
        hover && "hover:shadow-2xl cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ── NOTIF CARD ──
function NotificationCard({ notif, onClick }) {
  const config = notifConfig[notif.type] || notifConfig.default;
  const Icon = config.icon;
  const isUnread = !notif.is_read;

  return (
    <GlassCard hover={true} onClick={onClick} className={cn("group relative", isUnread && "ring-2 ring-[#37B6E9]/30 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1f2e]")}>
      {isUnread && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-3 h-3 bg-[#37B6E9] rounded-full border-2 border-white dark:border-[#242C3B] shadow-lg z-10" />
      )}
      <div className="p-4 flex items-start gap-4">
        <motion.div whileHover={{ scale: 1.05 }} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border", config.bg, config.color, config.border)}>
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-black uppercase tracking-widest", config.color)}>{config.label}</span>
              {notif.reports?.plate_number && (
                <span className="bg-slate-900 dark:bg-[#1a1f2e] text-white font-mono text-[10px] px-2 py-0.5 rounded-lg tracking-wider">
                  {notif.reports.plate_number}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#37B6E9] transition-colors shrink-0" />
          </div>
          <p className={cn("text-sm font-medium leading-snug mb-2 line-clamp-2", isUnread ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")}>
            {notif.message || config.desc}
          </p>
          <div className="flex items-center gap-3 text-xs">
            {notif.reports?.zones?.name && (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <MapPin size={12} /> {notif.reports.zones.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Clock size={12} /> {timeAgo(notif.created_at)}
            </span>
          </div>
        </div>
      </div>
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-r", config.gradient)} />
    </GlassCard>
  );
}

// ── MAIN COMPONENT ──
export default function SatpamNotifikasi() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) { console.error("Fetch notif error:", err); } 
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("satpam-notif-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotifications, user?.id]);

  // ✅ NAVIGASI KE DETAIL (BUKAN POPUP)
  const handleOpenNotif = async (notif) => {
    if (notif.id && !notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    }
    // Navigasi ke SatpamReportDetail
    if (notif.related_report_id) {
      navigate(`/satpam/report-detail/${notif.related_report_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const sortedNotifs = useMemo(() => [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [notifications]);

  return (
    <SatpamLayout>
      <div className="w-full min-w-0 space-y-6 pb-10">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
              <span className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
                <Bell className="w-6 h-6 text-[#37B6E9]" />
              </span>
              Notifikasi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Update tugas dan laporan di zona Anda
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#37B6E9] hover:bg-[#2a9cc9] text-white text-xs font-bold rounded-xl transition shadow-lg shadow-[#37B6E9]/25"
            >
              <Sparkles size={14} /> Tandai Semua Dibaca
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">{unreadCount}</span>
            </motion.button>
          )}
        </motion.div>

        {/* Stats Banner */}
        {unreadCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-r from-[#37B6E9]/10 to-[#4B4CED]/10 dark:from-[#37B6E9]/20 dark:to-[#4B4CED]/20 border border-[#37B6E9]/30 dark:border-[#37B6E9]/40 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-0 w-3 h-3 bg-[#37B6E9] rounded-full animate-ping opacity-75" />
                <span className="relative w-3 h-3 bg-[#4B4CED] rounded-full" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  <span className="text-[#37B6E9]">{unreadCount}</span> update menunggu tindakan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tap notifikasi untuk lihat detail</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <GlassCard key={i} hover={false} className="h-24 animate-pulse" />)}
          </div>
        ) : sortedNotifs.length === 0 ? (
          <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#222834] dark:to-[#242C3B] rounded-3xl flex items-center justify-center mb-5">
              <Bell className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-black text-lg mb-1">Semua sudah update! 🎉</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">Tidak ada notifikasi baru. Zona Anda terkendali.</p>
          </GlassCard>
        ) : (
          <motion.div className="flex flex-col gap-3 w-full min-w-0" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
            {sortedNotifs.map((notif, idx) => (
              <motion.div key={notif.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: idx * 0.02 }}>
                <NotificationCard notif={notif} onClick={() => handleOpenNotif(notif)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </SatpamLayout>
  );
}