import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { sendNotificationToUser } from "../../services/notifications";
import ReportDetailModal from "../../components/ui/ReportDetailModal";

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

export default function SatpamDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [todayRoster, setTodayRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Evidence upload
  const [evidenceModal, setEvidenceModal] = useState(null);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      // Cari roster aktif milik satpam ini (TANPA filter hari)
      const { data: roster, error: rosterError } = await supabase
        .from("roster")
        .select("*, zones(id, name)")
        .eq("satpam_id", user.id)
        .eq("is_active", true)
        .limit(1) // Ambil 1 saja (asumsi satpam cuma pegang 1 zona aktif)

      if (rosterError) throw rosterError
      
      // Simpan data roster aktif (bisa null jika belum di-assign)
      const activeRoster = roster?.[0] || null
      setTodayRoster(activeRoster)

      // Jika ada zona aktif, fetch laporannya
      if (activeRoster?.zone_id) {
        const { data: reportsData, error: reportsError } = await supabase
          .from("reports")
          .select("*, user_id, users(full_name), zones(name)")
          .eq("zone_id", activeRoster.zone_id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
        
        if (reportsError) throw reportsError
        setReports(reportsData ?? [])
      } else {
        setReports([])
      }
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("satpam-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(reportId);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);
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
      fetchData();
    } catch (err) {
      console.error("handleUpdateStatus error:", err);
    } finally {
      setUpdating(null);
    }
  };

  // Open evidence modal for "Tandai Selesai"
  const openEvidenceModal = (report) => {
    setEvidenceModal(report);
    setEvidencePhoto(null);
    setEvidenceNote('');
  };

  const handleEvidenceSubmit = async () => {
    if (!evidenceModal) return;
    setEvidenceUploading(true);
    try {
      let photoUrl = null;

      // Upload photo if selected
      if (evidencePhoto) {
        const ext = evidencePhoto.name.split('.').pop();
        const fileName = `evidence/${evidenceModal.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase
          .storage
          .from('reports')
          .upload(fileName, evidencePhoto);
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase
          .storage
          .from('reports')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      // Update report status
      const updateData = { status: 'resolved' };
      if (evidenceNote) updateData.resolution_note = evidenceNote;
      if (photoUrl) updateData.evidence_photo_url = photoUrl;

      const { error } = await supabase
        .from("reports")
        .update(updateData)
        .eq("id", evidenceModal.id);
      if (error) throw error;

      // Send notification
      if (evidenceModal.user_id) {
        await sendNotificationToUser({
          userId: evidenceModal.user_id,
          reportId: evidenceModal.id,
          plateNumber: evidenceModal.plate_number,
          status: 'resolved',
        });
      }

      setEvidenceModal(null);
      fetchData();
    } catch (err) {
      console.error("Evidence submit error:", err);
      alert('Gagal mengirim bukti: ' + err.message);
    } finally {
      setEvidenceUploading(false);
    }
  };

  return (
    <SatpamLayout>
      <div className="space-y-4">
        {/* Info Zona Aktif */}
        {todayRoster ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-800">
                Sedang Bertugas
              </span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {todayRoster.zones?.name}
            </p>
            {todayRoster.start_date && (
              <p className="text-xs text-green-600 mt-1">
                Sejak {new Date(todayRoster.start_date).toLocaleDateString('id-ID')}
                {todayRoster.end_date 
                  ? ` s/d ${new Date(todayRoster.end_date).toLocaleDateString('id-ID')}` 
                  : ' (belum ditentukan)'}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-sm">Belum Ada Penugasan</p>
                <p className="text-xs mt-0.5">Hubungi admin untuk di-assign ke zona</p>
              </div>
            </div>
          </div>
        )}

        {/* Laporan */}
        <div>
          <h2 className="font-semibold text-slate-700 text-sm mb-3">
            Laporan di Zona Kamu {reports.length > 0 && <span className="text-blue-600">({reports.length})</span>}
          </h2>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : !todayRoster ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Belum ada jadwal</p>
              <p className="text-slate-400 text-sm mt-1">Hubungi admin untuk penjadwalan</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Zona aman</p>
              <p className="text-slate-400 text-sm mt-1">Tidak ada laporan aktif di zona kamu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => {
                const status = statusConfig[report.status] ?? statusConfig.pending;
                return (
                  <div key={report.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {report.photo_url && (
                      <img
                        src={report.photo_url}
                        alt="laporan"
                        className="w-full aspect-video object-cover cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      />
                    )}
                    <div className="p-4">
                      {/* Plat + Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg cursor-pointer" onClick={() => setSelectedReport(report)}>
                          <span className="font-mono font-bold tracking-widest text-sm">{report.plate_number ?? "?????"}</span>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                      </div>

                      {/* Zona & Waktu */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="text-xs text-slate-500">{report.zones?.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{timeAgo(report.created_at)}</span>
                      </div>

                      {report.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.description}</p>}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        {report.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, "in_progress")}
                            disabled={updating === report.id}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            {updating === report.id ? "Memproses..." : "Tangani Sekarang"}
                          </button>
                        )}
                        {report.status === "in_progress" && (
                          <button
                            onClick={() => openEvidenceModal(report)}
                            disabled={updating === report.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Selesaikan + Bukti
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Evidence Upload Modal */}
      {evidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50" onClick={() => setEvidenceModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Selesaikan Laporan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Plat <span className="font-mono font-bold text-slate-700">{evidenceModal.plate_number}</span> — Upload foto bukti penanganan
            </p>

            {/* Photo upload */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => setEvidencePhoto(e.target.files?.[0] ?? null)}
              />
              {evidencePhoto ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(evidencePhoto)}
                    alt="Bukti"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => { setEvidencePhoto(null); if(fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50/50 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-slate-500">Ambil foto bukti (opsional)</span>
                </button>
              )}
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">Catatan Penanganan</label>
              <textarea
                value={evidenceNote}
                onChange={e => setEvidenceNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none text-sm"
                placeholder="Contoh: Kendaraan sudah dipindahkan"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleEvidenceSubmit}
                disabled={evidenceUploading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
              >
                {evidenceUploading ? 'Mengirim...' : 'Selesaikan'}
              </button>
              <button
                onClick={() => setEvidenceModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </SatpamLayout>
  );
}