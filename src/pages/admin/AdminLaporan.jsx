import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/layout/AdminLayout";
import { sendNotificationToUser } from "../../services/notifications";

const statusConfig = {
  pending: { label: "Menunggu", color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  in_progress: { label: "Diproses", color: "bg-blue-50 text-blue-600 border-blue-200" },
  resolved: { label: "Selesai", color: "bg-green-50 text-green-600 border-green-200" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function AdminLaporan() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      let query = supabase.from("reports").select("*, users(full_name), zones(name)").order("created_at", { ascending: false });

      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterZone !== "all") query = query.eq("zone_id", filterZone);

      const { data } = await query;
      setReports(data ?? []);
    } catch (err) {
      console.error(err);
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
  }, [fetchReports]);

  useEffect(() => {
    const channel = supabase.channel("admin-laporan").on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchReports).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(reportId);
    try {
      const { error } = await supabase.from("reports").update({ status: newStatus }).eq("id", reportId);
      if (error) throw error;

      const report = reports.find((r) => r.id === reportId);
      if (report?.user_id) {
        await sendNotificationToUser({
          userId: report.user_id,
          reportId,
          plateNumber: report.plate_number,
          status: newStatus,
        });
      }
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout title="Semua Laporan">
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="in_progress">Diproses</option>
          <option value="resolved">Selesai</option>
        </select>

        <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">Semua Zona</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-500 self-center">{reports.length} laporan</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">Tidak ada laporan</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const status = statusConfig[report.status] ?? statusConfig.pending;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex gap-3 p-4">
                  {report.photo_url && <img src={report.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer" onClick={() => setSelectedReport(report)} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg tracking-widest">{report.plate_number ?? "?????"}</div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-xs text-slate-500">{report.zones?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{report.users?.full_name}</span>
                      <span className="text-xs text-slate-400">{timeAgo(report.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {report.status !== "resolved" && (
                  <div className="px-4 pb-3 flex gap-2">
                    {report.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(report.id, "in_progress")}
                        disabled={updating === report.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-50"
                      >
                        {updating === report.id ? "Memproses..." : "Tandai Diproses"}
                      </button>
                    )}
                    {report.status === "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(report.id, "resolved")}
                        disabled={updating === report.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-50"
                      >
                        {updating === report.id ? "Memproses..." : "Tandai Selesai"}
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(report.id, "resolved")}
                      disabled={updating === report.id}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      Selesaikan
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Foto */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70" onClick={() => setSelectedReport(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {selectedReport.photo_url && <img src={selectedReport.photo_url} alt="" className="w-full max-h-80 object-cover" />}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-slate-900 text-white font-mono text-sm px-3 py-1.5 rounded-lg tracking-widest">{selectedReport.plate_number ?? "?????"}</div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusConfig[selectedReport.status]?.color}`}>{statusConfig[selectedReport.status]?.label}</span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{selectedReport.zones?.name}</p>
              {selectedReport.description && <p className="text-xs text-slate-500">{selectedReport.description}</p>}
              <button onClick={() => setSelectedReport(null)} className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
