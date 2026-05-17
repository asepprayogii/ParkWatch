// src/pages/satpam/SatpamReportDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../store/AuthContext";
import SatpamLayout from "../../components/layout/SatpamLayout";
import {
  ArrowLeft, MapPin, Calendar, Clock, X, ZoomIn, CheckCircle,
  Activity, AlertTriangle, ShieldCheck, MessageSquare, Camera,
  User, FileText, ExternalLink
} from "lucide-react";
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

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const parsedDate = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateStr)
    ? new Date(dateStr.trim() + 'Z')
    : new Date(dateStr);
  return parsedDate.toLocaleString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const parsedDate = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateStr)
    ? new Date(dateStr.trim() + 'Z')
    : new Date(dateStr);
  return parsedDate.toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/60 dark:bg-amber-500/10",
    border: "border-amber-200/60 dark:border-amber-500/20",
    dot: "bg-amber-500",
    icon: AlertTriangle,
    gradient: "from-amber-500/10 to-transparent",
  },
  in_progress: {
    label: "Diproses",
    color: "text-blue-600 dark:text-[#37B6E9]",
    bg: "bg-blue-100/60 dark:bg-[#37B6E9]/10",
    border: "border-blue-200/60 dark:border-[#37B6E9]/20",
    dot: "bg-[#37B6E9]",
    icon: Activity,
    gradient: "from-[#37B6E9]/10 to-transparent",
  },
  resolved: {
    label: "Selesai",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/60 dark:bg-emerald-500/10",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: CheckCircle,
    gradient: "from-emerald-500/10 to-transparent",
  },
};

// ── GLASS CARD ──
function GlassCard({ children, className, hover = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[24px] overflow-hidden",
        hover && "hover:shadow-2xl cursor-pointer transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ── ZOOM MODAL ──
function ZoomModal({ src, alt, onClose }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        src={src} alt={alt} className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </motion.div>,
    document.body
  );
}

// ── MAIN COMPONENT ──
export default function SatpamReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoomPhoto, setZoomPhoto] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("reports")
          .select(`
            *,
            users (full_name, phone),
            zones (name)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Laporan tidak ditemukan");
        setReport(data);
      } catch (err) {
        console.error("Fetch report error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();

    // Realtime update
    const channel = supabase
      .channel(`satpam-detail-${id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${id}`
      }, (payload) => setReport((prev) => ({ ...prev, ...payload.new })))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) {
    return (
      <SatpamLayout>
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-28 animate-pulse" />
          ))}
        </div>
      </SatpamLayout>
    );
  }

  if (error || !report) {
    return (
      <SatpamLayout>
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">{error || "Laporan tidak ditemukan"}</p>
          <button onClick={() => navigate(-1)} className="text-[#37B6E9] text-sm font-bold hover:underline">
            ← Kembali
          </button>
        </GlassCard>
      </SatpamLayout>
    );
  }

  const status = statusConfig[report.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const isResolved = report.status === "resolved";
  const isInProgress = report.status === "in_progress";

  // ── TIMELINE DINAMIS ──
  const timeline = [
    {
      label: "Laporan Dikirim",
      time: formatDateTime(report.created_at),
      active: true,
      color: "bg-[#37B6E9]",
      description: "Laporan masuk ke sistem"
    },
    {
      label: "Sedang Diproses",
      time: isInProgress 
        ? formatDateTime(report.updated_at) 
        : isResolved 
          ? "Diproses sebelumnya" 
          : null,
      active: isInProgress || isResolved,
      color: "bg-amber-500",
      description: isInProgress 
        ? "Satpam mulai menangani" 
        : isResolved 
          ? "Telah melalui tahap ini" 
          : "Menunggu penanganan satpam"
    },
    {
      label: "Diselesaikan",
      time: isResolved ? formatDateTime(report.updated_at) : null,
      active: isResolved,
      color: "bg-emerald-500",
      description: isResolved 
        ? "Laporan telah ditangani" 
        : "Akan diproses setelah tahap sebelumnya"
    },
  ];

  return (
    <SatpamLayout>
      <div className="w-full min-w-0 space-y-6 pb-10">
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-[#37B6E9] transition"
        >
          <ArrowLeft size={16} />
          Kembali
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <GlassCard className="overflow-visible">
            {/* Header */}
            <div className={cn("relative p-6 pb-4 bg-gradient-to-r", status.gradient)}>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg",
                status.bg, status.color, status.border, "border"
              )}>
                <StatusIcon size={14} strokeWidth={2.5} />
                <span className={cn("w-2 h-2 rounded-full animate-pulse", status.dot)} />
                {status.label}
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center bg-slate-900 dark:bg-[#1a1f2e] text-white px-4 py-2.5 rounded-xl shadow-lg">
                  <span className="font-mono font-black tracking-widest text-lg">
                    {report.plate_number ?? "?????"}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Original Photo */}
              {report.photo_url && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Camera size={14} /> Foto Laporan
                  </p>
                  <div className="relative group rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-[#353F54] shadow-lg">
                    <img src={report.photo_url} alt="Bukti laporan" className="w-full aspect-video md:aspect-[4/3] md:max-h-[380px] object-cover" />
                    <button
                      onClick={() => setZoomPhoto("original")}
                      className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 hover:scale-105"
                    >
                      <ZoomIn size={14} /> Zoom
                    </button>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                  <div className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
                    <MapPin className="w-5 h-5 text-[#37B6E9]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zona</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{report.zones?.name ?? "Tidak diketahui"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                  <div className="p-2 bg-[#4B4CED]/10 dark:bg-[#4B4CED]/20 rounded-xl">
                    <Calendar className="w-5 h-5 text-[#4B4CED]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{timeAgo(report.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {report.description && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-[#37B6E9]" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.description}</p>
                </div>
              )}

              {/* Reporter */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#4B4CED]/5 to-[#37B6E9]/5 dark:from-[#4B4CED]/10 dark:to-[#37B6E9]/10 border border-[#4B4CED]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelapor</p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {report.users?.full_name ? report.users.full_name.split(' ').map(p => p[0].toUpperCase() + '***').join(' ') : "Anonim"}
                    </p>
                  </div>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#4B4CED]/60" />
              </div>

              {/* ✅ EVIDENCE SECTION (Hanya jika resolved) */}
              {isResolved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-[#242C3B] border border-emerald-200/60 dark:border-emerald-500/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      ✅ Laporan Telah Diselesaikan
                    </p>
                  </div>

                  {report.updated_at && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Diselesaikan pada <span className="font-bold">{formatDateTime(report.updated_at)}</span>
                      </span>
                    </div>
                  )}

                  {report.resolution_note && (
                    <div className="mb-4 p-3 rounded-xl bg-white dark:bg-[#1e2532] border border-slate-200 dark:border-[#353F54]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan Penanganan</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{report.resolution_note}</p>
                    </div>
                  )}

                  {report.evidence_photo_url && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Camera size={14} /> Bukti Penanganan oleh Satpam
                      </p>
                      <div className="relative group rounded-2xl overflow-hidden border-4 border-emerald-100 dark:border-emerald-900/30 shadow-lg">
                        <img 
                          src={report.evidence_photo_url} 
                          alt="Bukti penanganan" 
                          className="w-full aspect-video md:aspect-[4/3] md:max-h-[380px] object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => setZoomPhoto("evidence")}
                          className="absolute bottom-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-700 hover:scale-105"
                        >
                          <ZoomIn size={14} /> Zoom Bukti
                        </button>
                      </div>
                      <a
                        href={report.evidence_photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <ExternalLink size={12} /> Buka di tab baru
                      </a>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 🔄 TIMELINE STATUS - FIXED DYNAMIC */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Riwayat Status</p>
                <div className="relative border-l-2 border-slate-200 dark:border-[#353F54] ml-2 space-y-6">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className={cn(
                        "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#242C3B] transition-all duration-300",
                        step.active ? step.color : "bg-slate-300 dark:bg-[#353F54]"
                      )} />
                      <div className={cn("transition-all duration-300", step.active ? "opacity-100" : "opacity-50")}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{step.label}</p>
                          {step.active && idx < timeline.findIndex(s => !s.active) && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        {step.time ? (
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{step.time}</p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">{step.description}</p>
                        )}
                        {!step.active && step.description && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-slate-100 dark:border-[#353F54]">
                <p className="text-xs text-slate-400">ID Laporan: <span className="font-mono">#{id?.slice(0, 8)}</span></p>
                <p className="text-xs text-slate-400 mt-1">Dilaporkan pada {formatDate(report.created_at)}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomPhoto && (
          <ZoomModal
            src={zoomPhoto === "original" ? report.photo_url : report.evidence_photo_url}
            alt={zoomPhoto === "original" ? "Foto laporan" : "Bukti penanganan"}
            onClose={() => setZoomPhoto(null)}
          />
        )}
      </AnimatePresence>
    </SatpamLayout>
  );
}