// src/pages/user/UserFeed.jsx
import { useLayoutEffect, useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../store/AuthContext";
import { getReports } from "../../services/reports";
import { supabase } from "../../lib/supabase";
import { getUserPoints } from "../../services/points";
import LevelIcon from "../../components/ui/LevelIcon";
import UserLayout from "../../components/layout/UserLayout";
import ImageLightbox from "../../components/ui/ImageLightbox";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X, ZoomIn, AlertCircle, CheckCircle, Activity, ShieldCheck, AlertTriangle, Calendar, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function sensorName(name) {
  if (!name) return "Anonim";
  const parts = name.trim().split(" ");
  return parts.map((part) => part.charAt(0).toUpperCase() + "*".repeat(Math.max(part.length - 1, 3))).join(" ");
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GlassCard({ children, className, hover = true, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={hover ? { y: -6, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[24px] overflow-hidden transition-all duration-300",
        hover && "hover:shadow-2xl cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: AlertTriangle,
    gradient: "from-amber-500/20 to-transparent",
  },
  in_progress: {
    label: "Diproses",
    bg: "bg-blue-100 dark:bg-[#37B6E9]/20",
    text: "text-blue-700 dark:text-[#37B6E9]",
    dot: "bg-[#37B6E9]",
    icon: Activity,
    gradient: "from-[#37B6E9]/20 to-transparent",
  },
  resolved: {
    label: "Selesai",
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    icon: CheckCircle,
    gradient: "from-emerald-500/20 to-transparent",
  },
};

// ── MODAL ──
function ReportDetailModal({ report, onClose, currentUser }) {
  if (!report) return null;

  const status = statusConfig[report.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const isOwn = report.users?.id === currentUser?.id;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 pb-8 px-4 bg-black/70 backdrop-blur-md overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#242C3B] rounded-[28px] shadow-2xl border border-slate-200 dark:border-[#353F54] overflow-hidden flex flex-col max-h-[85vh]">

          {/* Header */}
          <div className={cn("relative p-6 pb-4 bg-gradient-to-r flex-shrink-0", status.gradient)}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#1a1f2e]/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition shadow-lg z-10"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg", status.bg, status.text)}>
              <StatusIcon size={14} strokeWidth={2.5} />
              <span className={cn("w-2 h-2 rounded-full animate-pulse", status.dot)} />
              {status.label}
            </div>

            <div className="mt-4">
              <div className="inline-flex items-center bg-slate-900 dark:bg-[#1a1f2e] text-white px-4 py-2 rounded-xl shadow-lg">
                <span className="font-mono font-black tracking-widest text-lg">
                  {report.plate_number ?? "?????"}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 overscroll-contain">
            {report.photo_url && (
              <div className="relative group rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-[#353F54] shadow-lg">
                <img src={report.photo_url} alt="Bukti laporan" className="w-full aspect-video md:aspect-[4/3] md:max-h-[340px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
                  <MapPin className="w-5 h-5 text-[#37B6E9]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zona</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {report.zones?.name ?? "Tidak diketahui"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="p-2 bg-[#4B4CED]/10 dark:bg-[#4B4CED]/20 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#4B4CED]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {timeAgo(report.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {report.description && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#37B6E9]" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {report.description}
                </p>
              </div>
            )}

            {/* Pelapor */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#4B4CED]/5 to-[#37B6E9]/5 dark:from-[#4B4CED]/10 dark:to-[#37B6E9]/10 border border-[#4B4CED]/20">
              <div className="flex items-center gap-3">
                {isOwn ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B4CED] to-[#37B6E9] flex items-center justify-center shadow-lg shadow-[#4B4CED]/30">
                      <span className="text-sm font-black text-white">
                        {report.users?.full_name?.charAt(0).toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelapor</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-[#37B6E9]">Kamu</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelapor</p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                        {sensorName(report.users?.full_name)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <ShieldCheck className="w-6 h-6 text-[#4B4CED]/60" />
            </div>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-[#353F54]">
              <p className="text-xs text-slate-400">
                Dilaporkan pada {formatDate(report.created_at)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#222834] border-t border-slate-200 dark:border-[#353F54] flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-[#1a1f2e] text-white font-bold text-sm hover:bg-slate-800 dark:hover:bg-[#151a27] transition shadow-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── REPORT CARD ──
function ReportCard({ report, onClick, onPhotoClick, currentUser }) {
  const status = statusConfig[report.status] ?? statusConfig.pending;
  const isOwn = report.users?.id === currentUser?.id;

  return (
    <GlassCard hover={true} className="cursor-pointer group" onClick={() => onClick(report)}>
      {report.photo_url && (
        <div className="relative aspect-video md:aspect-[4/3] md:max-h-[260px] overflow-hidden">
          <img
            src={report.photo_url}
            alt={`Foto kendaraan dengan plat ${report.plate_number}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button
            onClick={(e) => { e.stopPropagation(); onPhotoClick(report.photo_url); }}
            aria-label="Perbesar foto"
            className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 hover:scale-105 z-10"
          >
            <ZoomIn size={14} strokeWidth={2.5} />
            Zoom
          </button>
          <div className={cn("absolute top-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg", status.bg, status.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
            {status.label}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-slate-900 dark:bg-[#1a1f2e] text-white px-3 py-1.5 rounded-xl shadow-sm">
            <span className="font-mono font-black tracking-widest text-sm">
              {report.plate_number ?? "?????"}
            </span>
          </div>
          {!report.photo_url && (
            <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2", status.bg, status.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
              {status.label}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-[#37B6E9]" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {report.zones?.name ?? "Zona tidak diketahui"}
          </span>
        </div>

        {report.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {report.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#353F54]">
          {/* Pelapor */}
          <div className="flex items-center gap-2.5">
            {isOwn ? (
              <>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4B4CED] to-[#37B6E9] flex items-center justify-center shadow-lg shadow-[#4B4CED]/20">
                  <span className="text-xs font-black text-white">
                    {report.users?.full_name?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-[#37B6E9]">Kamu</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  {sensorName(report.users?.full_name)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            <Clock size={12} />
            {timeAgo(report.created_at)}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── MAIN COMPONENT ──
export default function UserFeed() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [userPoints, setUserPoints] = useState(null);

  useEffect(() => {
    if (!selectedReport) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [selectedReport]);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useLayoutEffect(() => { fetchReports(); }, [fetchReports]);
  useLayoutEffect(() => { if (user?.id) getUserPoints(user.id).then(setUserPoints); }, [user?.id]);
  useLayoutEffect(() => {
    const channel = supabase
      .channel("reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchReports)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) =>
      r.plate_number?.toLowerCase().includes(q) ||
      r.zones?.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.users?.full_name?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const appName = localStorage.getItem("pw_app_name") || "ParkWatch";
  const appDesc = localStorage.getItem("pw_app_description") || "Laporkan parkir liar di lingkungan kita";

  return (
    <UserLayout>
      <div className="w-full min-w-0 space-y-8 pb-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              {appName}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 font-medium mt-2 text-sm md:text-base">
              {appDesc}
            </p>
          </div>
          {userPoints && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-white dark:bg-[#242C3B] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#353F54] shadow-md"
            >
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#37B6E9] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4B4CED]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4B4CED] to-[#37B6E9] flex items-center justify-center shadow-lg shadow-[#4B4CED]/20">
                  <LevelIcon name={userPoints.level.icon} className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white text-xs font-black">{userPoints.totalPoints} poin</p>
                  <p className="text-[#37B6E9] text-[10px] font-bold uppercase tracking-wide">{userPoints.level.label}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard hover={false} className="p-1.5 flex items-center gap-2">
            <div className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
              <Search className="w-4 h-4 text-[#37B6E9]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari plat nomor, zona, atau deskripsi..."
              className="flex-1 bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none py-2"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition rounded-lg hover:bg-slate-100 dark:hover:bg-[#353F54]"
              >
                <X size={16} />
              </button>
            )}
          </GlassCard>
        </motion.div>

        {search && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold text-slate-400 dark:text-[#37B6E9] uppercase tracking-widest"
          >
            {filteredReports.length} laporan ditemukan
          </motion.p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <GlassCard key={i} hover={false} className="aspect-video md:aspect-[4/3] md:max-h-[260px] animate-pulse" />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#222834] dark:to-[#242C3B] rounded-3xl flex items-center justify-center mb-5 shadow-lg">
                {search
                  ? <AlertCircle className="w-10 h-10 text-slate-400" />
                  : <Activity className="w-10 h-10 text-[#37B6E9]" />
                }
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-black text-lg mb-1">
                {search ? "Tidak ada hasil" : "Belum ada laporan"}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
                {search
                  ? `Tidak ditemukan laporan untuk "${search}"`
                  : "Tap tombol + untuk laporkan parkir liar"}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full min-w-0"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
            }}
          >
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={setSelectedReport}
                onPhotoClick={setLightboxPhoto}
                currentUser={user}
              />
            ))}
          </motion.div>
        )}

        {/* Modal & Lightbox */}
        <AnimatePresence>
          {selectedReport && (
            <ReportDetailModal
              report={selectedReport}
              onClose={() => setSelectedReport(null)}
              currentUser={user}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lightboxPhoto && (
            <ImageLightbox
              src={lightboxPhoto}
              alt="Foto laporan"
              onClose={() => setLightboxPhoto(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  );
}