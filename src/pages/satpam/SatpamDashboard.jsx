// src/pages/satpam/SatpamDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import { updateReportStatusWithNotification } from "../../services/reports";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { MapPin, Clock, X, AlertTriangle, Activity, CheckCircle, Camera, FileText, Send, ShieldCheck } from "lucide-react";
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
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

// ── GLASS CARD (Sama seperti UserFeed)
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

// ── REPORT DETAIL MODAL (Konsep persis UserFeed)
function ReportDetailModal({ report, onClose }) {
  if (!report) return null;
  const status = statusConfig[report.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 pb-8 px-4 bg-black/70 backdrop-blur-md overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-2xl my-auto" onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#242C3B] rounded-[28px] shadow-2xl border border-slate-200 dark:border-[#353F54] overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className={cn("relative p-6 pb-4 bg-gradient-to-r flex-shrink-0", status.gradient)}>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#1a1f2e]/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition shadow-lg z-10">
              <X size={18} strokeWidth={2.5} />
            </button>
            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg", status.bg, status.text)}>
              <StatusIcon size={14} strokeWidth={2.5} />
              <span className={cn("w-2 h-2 rounded-full animate-pulse", status.dot)} />
              {status.label}
            </div>
            <div className="mt-4">
              <div className="inline-flex items-center bg-slate-900 dark:bg-[#1a1f2e] text-white px-4 py-2 rounded-xl shadow-lg">
                <span className="font-mono font-black tracking-widest text-lg">{report.plate_number ?? "?????"}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 overscroll-contain">
            {report.photo_url && (
              <div className="relative group rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-[#353F54] shadow-lg">
                <img src={report.photo_url} alt="Bukti laporan" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl"><MapPin className="w-5 h-5 text-[#37B6E9]" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zona</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{report.zones?.name ?? "Tidak diketahui"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="p-2 bg-[#4B4CED]/10 dark:bg-[#4B4CED]/20 rounded-xl"><Clock className="w-5 h-5 text-[#4B4CED]" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{timeAgo(report.created_at)}</p>
                </div>
              </div>
            </div>
            {report.description && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#37B6E9]" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.description}</p>
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
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider">{sensorName(report.users?.full_name)}</p>
                </div>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#4B4CED]/60" />
            </div>
            <div className="text-center pt-2 border-t border-slate-100 dark:border-[#353F54]">
              <p className="text-xs text-slate-400">Dilaporkan pada {formatDate(report.created_at)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#222834] border-t border-slate-200 dark:border-[#353F54] flex-shrink-0">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-900 dark:bg-[#1a1f2e] text-white font-bold text-sm hover:bg-slate-800 dark:hover:bg-[#151a27] transition shadow-lg">Tutup</button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── MAIN COMPONENT
export default function SatpamDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [zoneName, setZoneName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Evidence modal state
  const [evidenceModal, setEvidenceModal] = useState(null);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  // ✅ FETCH DATA
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: rosterData } = await supabase
        .from("roster")
        .select("zone_id, is_active, shift")
        .eq("satpam_id", user.id)
        .eq("is_active", true)
        .limit(1);

      const activeRoster = Array.isArray(rosterData) && rosterData.length > 0 ? rosterData[0] : null;

      if (activeRoster?.zone_id) {
        setActiveZone(activeRoster.zone_id);
        const { data: zoneData } = await supabase.from("zones").select("name").eq("id", activeRoster.zone_id).single();
        if (zoneData?.name) setZoneName(zoneData.name);

        const { data: reportsData } = await supabase
          .from("reports")
          .select(`*, users (full_name, phone), zones (name)`)
          .eq("zone_id", activeRoster.zone_id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false });

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

  // ✅ REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!user?.id || !activeZone) return;
    const channel = supabase
      .channel(`satpam-reports-${activeZone}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports", filter: `zone_id=eq.${activeZone}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, activeZone, user?.id]);

  // ✅ UPDATE STATUS
  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(reportId);
    try {
      await updateReportStatusWithNotification(reportId, newStatus);
      fetchData();
    } catch (err) {
      console.error("handleUpdateStatus error:", err);
      alert("Gagal update status: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const openEvidenceModal = (report) => {
    setEvidenceModal(report);
    setEvidencePhoto(null);
    setEvidenceNote("");
  };

  // ✅ SUBMIT EVIDENCE
  const handleEvidenceSubmit = async () => {
    if (!evidenceModal) return;
    setEvidenceUploading(true);
    try {
      let photoUrl = null;
      if (evidencePhoto) {
        const ext = evidencePhoto.name.split(".").pop();
        const fileName = `evidence/${evidenceModal.id}_${Date.now()}.${ext}`;
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

      const { error: updateError } = await supabase.from("reports").update(updateData).eq("id", evidenceModal.id);
      if (updateError) throw updateError;

      if (evidenceModal.users?.phone) {
        supabase.functions.invoke("send-wa-fonnte", {
          body: {
            phone: evidenceModal.users.phone,
            message: `✅ *Laporan Selesai*\n\nHalo ${evidenceModal.users?.full_name || "User"}!\nLaporan Anda telah **selesai ditangani**.\n\nTerima kasih!`,
          },
        }).catch((err) => console.error("WA Error:", err));
      }

      setEvidenceModal(null);
      fetchData();
    } catch (err) {
      console.error("Evidence submit error:", err);
      alert("Gagal mengirim bukti: " + err.message);
    } finally {
      setEvidenceUploading(false);
    }
  };

  return (
    <SatpamLayout title="Dashboard Satpam">
      {/* Container full width, no empty space when sidebar toggles */}
      <div className="w-full min-w-0 space-y-6 pb-10 px-2 md:px-4 lg:px-6">
        
        {/* 🟢 Info Zona Aktif */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeZone ? (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/30"></span>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Sedang Bertugas</p>
                  <p className="text-xl font-black text-green-900 dark:text-green-100">{zoneName || "Zona Aktif"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-amber-800 dark:text-amber-200 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">Belum Ada Penugasan</p>
                <p className="text-xs mt-1 opacity-80">Hubungi admin untuk di-assign ke zona</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 📋 Daftar Laporan */}
        <div>
          <h2 className="font-black text-slate-800 dark:text-white text-lg mb-4 tracking-tight">
            Laporan di Zona Kamu <span className="text-[#37B6E9]">({reports.length})</span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} hover={false} className="aspect-video animate-pulse" />
              ))}
            </div>
          ) : !activeZone ? (
            <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Menunggu penugasan zona...</p>
            </GlassCard>
          ) : reports.length === 0 ? (
            <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Zona aman 🎉</p>
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
                  <GlassCard key={report.id} className="flex flex-col h-full">
                    {report.photo_url && (
                      <div className="relative aspect-video overflow-hidden">
                        <img src={report.photo_url} alt="laporan" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                        <div className={cn("absolute top-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg", status.bg, status.text)}>
                          <StatusIcon size={12} />
                          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
                          {status.label}
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      {!report.photo_url && (
                        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-3", status.bg, status.text)}>
                          <StatusIcon size={12} />
                          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                          {status.label}
                        </div>
                      )}
                      
                      <div className="bg-slate-900 dark:bg-[#1a1f2e] text-white px-3 py-2 rounded-xl w-fit mb-3 shadow-sm">
                        <span className="font-mono font-black tracking-widest text-sm">{report.plate_number ?? "?????"}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-[#37B6E9]" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{report.zones?.name || zoneName || "Zona"}</span>
                      </div>

                      {report.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed flex-1">{report.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100 dark:border-[#353F54]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{timeAgo(report.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 mt-3">
                        {report.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, "in_progress")}
                            disabled={updating === report.id}
                            className="flex-1 bg-[#4B4CED] hover:bg-[#3a3dc9] text-white text-xs font-bold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === report.id ? "Memproses..." : "Tangani Sekarang"}
                          </button>
                        )}
                        {report.status === "in_progress" && (
                          <button
                            onClick={() => openEvidenceModal(report)}
                            disabled={updating === report.id}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Camera size={14} /> Selesaikan + Bukti
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-2.5 bg-slate-100 dark:bg-[#353F54] hover:bg-slate-200 dark:hover:bg-[#44506B] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* 🔍 Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
        )}
      </AnimatePresence>

      {/* 📸 Evidence Upload Modal (Konsep UserFeed) */}
      <AnimatePresence>
        {evidenceModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 pb-8 px-4 bg-black/70 backdrop-blur-md overflow-y-auto overscroll-contain"
            onClick={() => setEvidenceModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md my-auto" onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-[#242C3B] rounded-[28px] shadow-2xl border border-slate-200 dark:border-[#353F54] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="relative p-5 pb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 flex-shrink-0 border-b border-slate-200 dark:border-[#353F54]">
                  <button onClick={() => setEvidenceModal(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#1a1f2e]/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition shadow-lg z-10">
                    <X size={18} strokeWidth={2.5} />
                  </button>
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">Selesaikan Laporan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plat: {evidenceModal.plate_number}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 overscroll-contain">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Foto Bukti <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input type="file" accept="image/*" capture="environment" className="hidden" id="evidence-photo" onChange={(e) => setEvidencePhoto(e.target.files?.[0] ?? null)} />
                    {evidencePhoto ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#353F54]">
                        <img src={URL.createObjectURL(evidencePhoto)} alt="Bukti" className="w-full h-48 object-cover" />
                        <button onClick={() => setEvidencePhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="evidence-photo" className="block w-full h-32 border-2 border-dashed border-slate-300 dark:border-[#353F54] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition cursor-pointer">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Ambil / Upload foto</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Catatan Penanganan</label>
                    <textarea
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#353F54] bg-slate-50 dark:bg-[#1e2532] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#37B6E9] transition resize-none text-sm"
                      placeholder="Contoh: Kendaraan sudah dipindahkan ke area parkir resmi..."
                    />
                  </div>
                </div>

                <div className="px-5 py-4 bg-slate-50 dark:bg-[#222834] border-t border-slate-200 dark:border-[#353F54] flex-shrink-0 flex gap-3">
                  <button onClick={() => setEvidenceModal(null)} className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-[#353F54] text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-[#44506B] transition">Batal</button>
                  <button onClick={handleEvidenceSubmit} disabled={evidenceUploading} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {evidenceUploading ? "Mengirim..." : <><Send size={16} /> Selesaikan</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SatpamLayout>
  );
}