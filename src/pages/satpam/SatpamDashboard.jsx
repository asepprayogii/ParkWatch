import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { updateReportStatusWithNotification } from "../../services/reports";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, X, AlertCircle, Activity, CheckCircle, 
  AlertTriangle, Calendar, MessageSquare, ShieldCheck, 
  Upload, Camera, Loader2 
} from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// ── UTILS ──
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

// ── UI COMPONENTS ──
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
function SatpamReportModal({ 
  report, 
  onClose, 
  onUpdateStatus, 
  evidencePhoto, 
  setEvidencePhoto, 
  evidenceNote, 
  setEvidenceNote, 
  onEvidenceSubmit, 
  isHandling, 
  isUploading 
}) {
  if (!report) return null;
  const status = statusConfig[report.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const isOwn = report.users?.id === report.users?.id; // placeholder, always true for satpam view context

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
                <img src={report.photo_url} alt="Bukti laporan" className="w-full aspect-video object-cover" />
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

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#4B4CED]/5 to-[#37B6E9]/5 dark:from-[#4B4CED]/10 dark:to-[#37B6E9]/10 border border-[#4B4CED]/20">
              <div className="flex items-center gap-3">
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
              </div>
              <ShieldCheck className="w-6 h-6 text-[#4B4CED]/60" />
            </div>

            {/* Evidence Form (Only for in_progress) */}
            {report.status === "in_progress" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e2532] border border-slate-200 dark:border-[#353F54]">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#37B6E9]" />
                  Bukti Penanganan
                </h4>
                <div>
                  <label className="block w-full h-32 border-2 border-dashed border-slate-300 dark:border-[#353F54] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setEvidencePhoto(e.target.files?.[0] ?? null)}
                    />
                    {evidencePhoto ? (
                      <div className="relative w-full h-full">
                        <img src={URL.createObjectURL(evidencePhoto)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setEvidencePhoto(null); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Tap untuk ambil/upload foto</span>
                      </>
                    )}
                  </label>
                </div>
                <textarea
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1e2532] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none text-sm"
                  placeholder="Catatan penanganan (opsional)..."
                />
              </div>
            )}

            <div className="text-center pt-2 border-t border-slate-100 dark:border-[#353F54]">
              <p className="text-xs text-slate-400">
                Dilaporkan pada {formatDate(report.created_at)}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#222834] border-t border-slate-200 dark:border-[#353F54] flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {report.status === "pending" && (
                <button
                  onClick={() => onUpdateStatus(report.id, "in_progress")}
                  disabled={isHandling}
                  className="flex-1 py-3 rounded-xl bg-[#37B6E9] hover:bg-[#2da5d8] text-white font-bold text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isHandling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity size={16} />}
                  Tangani Sekarang
                </button>
              )}
              {report.status === "in_progress" && (
                <button
                  onClick={onEvidenceSubmit}
                  disabled={isUploading}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                  Selesaikan Laporan
                </button>
              )}
              {report.status !== "resolved" && (
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-200 dark:bg-[#353F54] hover:bg-slate-300 dark:hover:bg-[#44506B] text-slate-700 dark:text-slate-200 font-bold text-sm transition"
                >
                  Batal
                </button>
              )}
              {report.status === "resolved" && (
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-[#1a1f2e] text-white font-bold text-sm hover:bg-slate-800 dark:hover:bg-[#151a27] transition shadow-lg"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── MAIN COMPONENT ──
export default function SatpamDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [zoneName, setZoneName] = useState("");
  const [loading, setLoading] = useState(true);
  const [handlingId, setHandlingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [evidenceNote, setEvidenceNote] = useState("");

  // Fix scrollbar when modal is open
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

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: rosterData, error: rosterError } = await supabase
        .from("roster")
        .select("zone_id, is_active, shift")
        .eq("satpam_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (rosterError) console.error("Roster query error:", rosterError);

      const activeRoster = Array.isArray(rosterData) && rosterData.length > 0 ? rosterData[0] : null;
      
      if (activeRoster?.zone_id) {
        setActiveZone(activeRoster.zone_id);
        const { data: zoneData } = await supabase
          .from("zones")
          .select("name")
          .eq("id", activeRoster.zone_id)
          .single();
        
        if (zoneData?.name) setZoneName(zoneData.name);

        const { data: reportsData, error: reportsError } = await supabase
          .from("reports")
          .select(`*, users (full_name, phone), zones (name)`)
          .eq("zone_id", activeRoster.zone_id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false });

        if (reportsError) console.error("Reports query error:", reportsError);
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } else {
        setActiveZone(null);
        setZoneName("");
        setReports([]);
      }
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user?.id || !activeZone) return;
    const channel = supabase
      .channel(`satpam-reports-${activeZone}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports", filter: `zone_id=eq.${activeZone}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, activeZone, user?.id]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setHandlingId(reportId);
    try {
      await updateReportStatusWithNotification(reportId, newStatus);
      fetchData();
    } catch (err) {
      console.error("handleUpdateStatus error:", err);
      alert("Gagal update status: " + err.message);
    } finally {
      setHandlingId(null);
    }
  };

  const handleEvidenceSubmit = async () => {
    if (!selectedReport) return;
    setUploading(true);
    try {
      let photoUrl = null;
      if (evidencePhoto) {
        const ext = evidencePhoto.name.split(".").pop();
        const fileName = `evidence/${selectedReport.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("reports").upload(fileName, evidencePhoto);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("reports").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const updateData = {
        status: "resolved",
        ...(evidenceNote && { resolution_note: evidenceNote }),
        ...(photoUrl && { evidence_photo_url: photoUrl }),
      };

      const { error: updateError } = await supabase.from("reports").update(updateData).eq("id", selectedReport.id);
      if (updateError) throw updateError;

      if (selectedReport.users?.phone) {
        supabase.functions.invoke("send-wa-fonnte", {
          body: { phone: selectedReport.users.phone, message: `✅ *Laporan Selesai*\n\nHalo ${selectedReport.users?.full_name || "User"}!\nLaporan Anda telah **selesai ditangani**.\n\nTerima kasih!` }
        }).catch((err) => console.error("WA Error:", err));
      }

      setSelectedReport(null);
      setEvidencePhoto(null);
      setEvidenceNote("");
      fetchData();
    } catch (err) {
      console.error("Evidence submit error:", err);
      alert("Gagal mengirim bukti: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SatpamLayout title="Dashboard Satpam">
      {/* w-full min-w-0 ensures no empty gaps when sidebar toggles */}
      <div className="w-full min-w-0 space-y-8 pb-10">
        {/* 🟢 Info Zona Aktif */}
        {activeZone ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false} className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                <div>
                  <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Sedang Bertugas</p>
                  <p className="text-lg font-black text-green-900 dark:text-green-100">{zoneName || "Zona Aktif"}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false} className="p-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-200">Belum Ada Penugasan</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-1">Hubungi admin untuk di-assign ke zona</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* 📋 Daftar Laporan */}
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-5">
            Laporan di Zona Kamu {reports.length > 0 && <span className="text-[#37B6E9]">({reports.length})</span>}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <GlassCard key={i} hover={false} className="aspect-video animate-pulse" />)}
            </div>
          ) : !activeZone ? (
            <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-bold">Menunggu penugasan zona...</p>
            </GlassCard>
          ) : reports.length === 0 ? (
            <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-bold">Zona aman. Tidak ada laporan aktif.</p>
            </GlassCard>
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
              {reports.map((report) => {
                const status = statusConfig[report.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <GlassCard 
                    key={report.id} 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedReport(report)}
                  >
                    {report.photo_url && (
                      <div className="relative aspect-video overflow-hidden">
                        <img src={report.photo_url} alt="laporan" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-slate-900 dark:bg-[#1a1f2e] text-white px-3 py-1.5 rounded-xl shadow-sm">
                          <span className="font-mono font-black tracking-widest text-sm">{report.plate_number ?? "?????"}</span>
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
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{report.zones?.name || zoneName || "Zona"}</span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{report.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#353F54]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">{sensorName(report.users?.full_name)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                          <Clock size={12} />
                          {timeAgo(report.created_at)}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* 🔍 Modal Detail & Penanganan */}
      <AnimatePresence>
        {selectedReport && (
          <SatpamReportModal
            report={selectedReport}
            onClose={() => { setSelectedReport(null); setEvidencePhoto(null); setEvidenceNote(""); }}
            onUpdateStatus={handleUpdateStatus}
            evidencePhoto={evidencePhoto}
            setEvidencePhoto={setEvidencePhoto}
            evidenceNote={evidenceNote}
            setEvidenceNote={setEvidenceNote}
            onEvidenceSubmit={handleEvidenceSubmit}
            isHandling={handlingId === selectedReport.id}
            isUploading={uploading}
          />
        )}
      </AnimatePresence>
    </SatpamLayout>
  );
}