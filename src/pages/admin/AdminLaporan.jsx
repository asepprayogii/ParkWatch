import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/layout/AdminLayout";

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
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
  },
  in_progress: {
    label: "Diproses",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  resolved: {
    label: "Selesai",
    color: "bg-green-50 text-green-600 border-green-200",
  },
};

// ─────────────────────────────────────────────────────────────
// Helper: Format Waktu "Time Ago"
// ─────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
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

  // ─────────────────────────────────────────────────────────
  // Fetch Reports dengan Filter
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // Fetch Zones & Setup Realtime Subscription (untuk monitoring)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchReports();

    supabase
      .from("zones")
      .select("*")
      .order("name")
      .then(({ data }) => setZones(data ?? []));

    // Realtime subscription: admin bisa lihat update laporan secara live
    const channel = supabase
      .channel("admin-laporan-monitor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        fetchReports
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  // ─────────────────────────────────────────────────────────
  // Fetch User Detail saat modal dibuka
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedReport?.id) {
      const fetchExtraDetails = async () => {
        try {
          setLoadingActions(true);
          // 1. Fetch Reporter info
          const { data: userData, error: userErr } = await supabase
            .from("users")
            .select("full_name, phone, role")
            .eq("id", selectedReport.user_id)
            .single();

          if (!userErr) {
            const { count } = await supabase
              .from("reports")
              .select("id", { count: "exact", head: true })
              .eq("user_id", selectedReport.user_id);
            setUserDetail({ ...userData, report_count: count });
          }

          // 2. Fetch Actions from satpam
          const { data: actionsData, error: actionsErr } = await supabase
            .from("actions")
            .select("*, users:satpam_id(full_name, avatar_url)")
            .eq("report_id", selectedReport.id)
            .order("created_at", { ascending: true });

          if (actionsErr) throw actionsErr;
          setReportActions(actionsData ?? []);

        } catch (err) {
          console.error("Error fetching extra details:", err);
          setUserDetail(null);
          setReportActions([]);
        } finally {
          setLoadingActions(false);
        }
      };
      fetchExtraDetails();
    } else {
      setUserDetail(null);
      setReportActions([]);
    }
  }, [selectedReport]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Monitoring Laporan">
      <PageTransition>
        
        {/* Header: Filter Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status */}
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

            {/* Filter Zona */}
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
            >
              <option value="all">Semua Zona</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            {/* Counter */}
            <span className="text-sm text-slate-500 dark:text-slate-400 px-2 transition-colors">
              {reports.length} laporan
            </span>
          </div>

          {/* Info Role Admin */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors border border-transparent dark:border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Mode: View Only
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-lg transition-colors">Tidak ada laporan</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 transition-colors">
              Belum ada laporan yang masuk dengan filter ini
            </p>
          </div>
        ) : (
          /* Reports List - View Only */
          <div className="flex flex-col gap-3">
            {reports.map((report) => {
              const status = statusConfig[report.status] ?? statusConfig.pending;
              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md dark:hover:shadow-slate-900/50 transition-all duration-300"
                >
                  <div className="flex gap-4 p-4">
                    {/* Foto Thumbnail */}
                    {report.photo_url ? (
                      <img
                        src={report.photo_url}
                        alt="Bukti laporan"
                        className="w-24 h-24 rounded-xl object-cover shrink-0 cursor-pointer hover:opacity-90 transition border border-slate-100 dark:border-slate-700"
                        onClick={() => setSelectedReport(report)}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Info Laporan */}
                    <div className="flex-1 min-w-0">
                      {/* Header: Plate Number + Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="bg-slate-800 dark:bg-slate-950 text-white font-mono text-sm px-3 py-1.5 rounded-lg tracking-wider border border-transparent dark:border-slate-700">
                          {report.plate_number ?? "?????"}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${status.color} dark:bg-opacity-10 dark:border-opacity-30`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Lokasi */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors">
                          {report.zones?.name ?? "Zona tidak diketahui"}
                        </span>
                      </div>

                      {/* Pelapor & Waktu */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{report.users?.full_name ?? "Anonim"}</span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-500">
                          {timeAgo(report.created_at)}
                        </span>
                      </div>

                      {/* Preview Deskripsi (jika ada) */}
                      {report.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 transition-colors">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer: View Detail Button (tanpa action update) */}
                  <div className="px-4 pb-4 pt-0">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Lihat Detail Lengkap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Detail Laporan (View Only) */}
        {selectedReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedReport(null); setUserDetail(null); }}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl border border-transparent dark:border-slate-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Foto Utama (Dinamis: Prioritas Bukti Selesai) */}
              {(selectedReport.evidence_photo_url || selectedReport.photo_url) && (
                <div className="relative bg-slate-100 dark:bg-slate-900 transition-colors">
                  <img
                    src={selectedReport.evidence_photo_url || selectedReport.photo_url}
                    alt="Detail laporan"
                    className="w-full max-h-96 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${
                        statusConfig[selectedReport.status]?.color
                      } dark:bg-opacity-20 dark:border-opacity-40`}
                    >
                      {statusConfig[selectedReport.status]?.label}
                    </span>
                    {selectedReport.evidence_photo_url && (
                      <span className="text-[10px] bg-green-500 text-white px-2 py-1 rounded-lg shadow-lg font-bold uppercase tracking-wider animate-pulse">
                        Bukti Selesai
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5">
                {/* Header: Plate Number */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="bg-slate-800 dark:bg-slate-950 text-white font-mono text-base px-4 py-2 rounded-xl tracking-widest border border-transparent dark:border-slate-700 transition-colors">
                    {selectedReport.plate_number ?? "?????"}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                    ID: #{selectedReport.id?.slice(0, 8)}
                  </div>
                </div>

                {/* Info Utama */}
                <div className="space-y-3 mb-4">
                  {/* Lokasi */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Lokasi</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                        {selectedReport.zones?.name ?? "-"}
                      </p>
                    </div>
                  </div>

                  {/* Waktu */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Waktu Laporan</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                        {new Date(selectedReport.created_at).toLocaleString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  {selectedReport.description && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Deskripsi Pelanggaran</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                          {selectedReport.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resolution Note (from reports table) */}
                  {(selectedReport.evidence_photo_url || selectedReport.resolution_note) && (
                    <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                      <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">Penyelesaian Akhir</p>
                      
                      {selectedReport.resolution_note ? (
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-green-800 dark:text-green-300 italic">
                            "{selectedReport.resolution_note}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-green-600 dark:text-green-400">Laporan telah diselesaikan dengan bukti foto di atas.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Officer Actions Log (from actions table) */}
                {reportActions.length > 0 && (
                  <div className="mt-6 px-1 mb-6">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1">Log Penanganan Petugas</p>
                    <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                      {reportActions.map((action, idx) => (
                        <div key={action.id} className="relative pl-10">
                          {/* Dot */}
                          <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center z-10 transition-colors ${
                            action.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{action.users?.full_name ?? 'Petugas'}</p>
                              <span className="text-[10px] text-slate-400">{timeAgo(action.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 italic">"{action.notes}"</p>
                            
                            {action.photo_evidence_url && (
                              <img 
                                src={action.photo_evidence_url} 
                                alt="Action Evidence" 
                                className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                              />
                            )}
                            
                            <div className="mt-2 flex items-center gap-1">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                action.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {action.status === 'resolved' ? 'Selesai' : 'Diproses'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <hr className="border-slate-100 dark:border-slate-700 my-4 transition-colors" />

                {/* Detail Pelapor */}
                {userDetail && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 transition-colors border border-transparent dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Informasi Pelapor
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500 w-20">Nama</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium transition-colors">
                        {userDetail.full_name ?? "-"}
                      </span>
                    </div>
                    
                    {userDetail.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400 dark:text-slate-500 w-20">Telepon</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium transition-colors">
                          {userDetail.phone}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500 w-20">Role</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium capitalize transition-colors">
                        {userDetail.role ?? "-"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500 w-20">Total Laporan</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold transition-colors">
                        {userDetail.report_count ?? 0} laporan
                      </span>
                    </div>
                  </div>
                )}

                {/* Tombol Tutup */}
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setUserDetail(null);
                  }}
                  className="mt-5 w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-transparent dark:border-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
}