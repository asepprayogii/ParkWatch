import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/layout/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// Helper: Page Transition Animation
// ─────────────────────────────────────────────────────────────
function PageTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition:
          "opacity 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.4,0,.2,1)",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Konfigurasi Status (Read-only untuk Admin)
// ─────────────────────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "Diproses",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Selesai",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

// ─────────────────────────────────────────────────────────────
// Helper: Format Waktu "Time Ago"
// ─────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  try {
    if (!dateStr) return "-";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (isNaN(diff)) return "-";
    if (diff < 60) return `${diff} dtk lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  } catch (e) { return "-"; }
}

// ─────────────────────────────────────────────────────────────
// Main Component: AdminLaporan (View Only)
// ─────────────────────────────────────────────────────────────
export default function AdminLaporan() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [reportActions, setReportActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  // Lock body scroll when modal open
  useEffect(() => {
    if (selectedReport) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedReport]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("reports")
        .select("*, users(full_name, phone, role), zones(name)")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterZone !== "all") query = query.eq("zone_id", filterZone);

      const { data, error } = await query;
      if (error) throw error;
      setReports(data ?? []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterZone]);

  useEffect(() => {
    fetchReports();
    supabase
      .from("zones")
      .select("*")
      .order("name")
      .then(({ data }) => setZones(data ?? []));

    const channel = supabase
      .channel("admin-laporan-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchReports)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  useEffect(() => {
    if (selectedReport?.id) {
      const fetchExtraDetails = async () => {
        try {
          setLoadingActions(true);
          const { data: userData } = await supabase
            .from("users")
            .select("full_name, phone, role")
            .eq("id", selectedReport.user_id)
            .single();

          if (userData) {
            const { count } = await supabase
              .from("reports")
              .select("id", { count: "exact", head: true })
              .eq("user_id", selectedReport.user_id);
            setUserDetail({ ...userData, report_count: count });
          }

          const { data: actionsData } = await supabase
            .from("actions")
            .select("*, users:satpam_id(full_name, avatar_url)")
            .eq("report_id", selectedReport.id)
            .order("created_at", { ascending: true });

          setReportActions(actionsData ?? []);
        } catch (err) {
          console.error("Error extra details:", err);
        } finally {
          setLoadingActions(false);
        }
      };
      fetchExtraDetails();
    }
  }, [selectedReport]);

  // Modal Portal JSX
  const renderModal = () => {
    if (!selectedReport) return null;
    const status = statusConfig[selectedReport.status] ?? statusConfig.pending;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => { setSelectedReport(null); setUserDetail(null); }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
        />

        {/* Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] md:rounded-[32px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 z-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={() => { setSelectedReport(null); setUserDetail(null); }}
            className="absolute top-4 right-4 z-[50] w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/50 text-white hover:bg-slate-900 transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Side: Photo */}
          <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-900 shrink-0">
            {(selectedReport.evidence_photo_url || selectedReport.photo_url) ? (
              <div className="relative h-full">
                <img
                  src={selectedReport.evidence_photo_url || selectedReport.photo_url}
                  alt="Detail"
                  className="w-full h-full object-cover"
                />
                {selectedReport.evidence_photo_url && (
                  <div className="absolute top-16 right-4 bg-green-500 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg animate-pulse">
                    Bukti Selesai
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase tracking-tighter opacity-20">No Image</div>
            )}
          </div>

          {/* Side: Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${status.dot} animate-pulse`} />
                  <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none mb-1">
                  {selectedReport.plate_number ?? '??????'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{selectedReport.id?.slice(0, 8)}</p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{selectedReport.zones?.name || '-'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Penanganan</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{status.label}</p>
                </div>
              </div>

              {/* Time Card */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Waktu Laporan</p>
                  <p className="text-sm font-bold">{new Date(selectedReport.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Deskripsi Laporan</p>
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-l-8 border-slate-900 dark:border-white shadow-inner">
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">"{selectedReport.description}"</p>
                  </div>
                </div>
              )}

              {/* Action Log */}
              {reportActions.length > 0 && (
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Log Penanganan Petugas</p>
                  <div className="relative pl-2 space-y-6">
                    <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-700" />
                    {reportActions.map((action) => (
                      <div key={action.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-4 border-white dark:border-slate-800 z-10 ${action.status === 'resolved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black dark:text-white uppercase tracking-wider">{action.users?.full_name ?? 'Petugas'}</p>
                            <span className="text-[10px] text-slate-400">{timeAgo(action.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 leading-relaxed">"{action.notes}"</p>
                          {action.photo_evidence_url && (
                            <img src={action.photo_evidence_url} className="w-full h-32 object-cover rounded-2xl border border-slate-200 dark:border-slate-700" alt="Evidence" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Detail */}
              {userDetail && (
                <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-3xl border border-blue-100/50 dark:border-blue-500/10 space-y-3">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Informasi Pelapor</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Nama Pelapor</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{userDetail.full_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Nomor Telepon</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{userDetail.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Total Laporan</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">{userDetail.report_count || 0} Laporan</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
              <button
                onClick={() => { setSelectedReport(null); setUserDetail(null); }}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-xs uppercase tracking-[0.3em]"
              >
                Tutup Monitoring
              </button>
            </div>
          </div>
        </motion.div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="mb-6">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Daftar Laporan</h2>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-2">Monitoring seluruh laporan pelanggaran parkir</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="in_progress">Diproses</option>
              <option value="resolved">Selesai</option>
            </select>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
            >
              <option value="all">Semua Zona</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500 dark:text-slate-400 px-2">{reports.length} laporan</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-transparent dark:border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Mode: View Only
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">Tidak ada laporan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => {
              const status = statusConfig[report.status] ?? statusConfig.pending;
              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="flex gap-4 p-4">
                    {report.photo_url ? (
                      <img
                        src={report.photo_url}
                        alt="Bukti"
                        className="w-24 h-24 rounded-xl object-cover shrink-0 cursor-pointer hover:opacity-90 border border-slate-100 dark:border-slate-700"
                        onClick={() => setSelectedReport(report)}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="bg-slate-800 dark:bg-slate-950 text-white font-mono text-sm px-3 py-1.5 rounded-lg tracking-wider border border-transparent dark:border-slate-700">
                          {report.plate_number ?? "?????"}
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{report.zones?.name ?? "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{report.users?.full_name ?? "Anonim"}</span>
                        <span>{timeAgo(report.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 rounded-xl transition border border-slate-200 dark:border-slate-600"
                    >
                      Lihat Detail Laporan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {renderModal()}
      </PageTransition>
    </AdminLayout>
  );
}