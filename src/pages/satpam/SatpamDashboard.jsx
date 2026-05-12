import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { updateReportStatusWithNotification } from "../../services/reports";
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

  // ✅ FETCH DATA: Roster + Reports
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // 1. Ambil roster aktif satpam ini
      const { data: rosterData, error: rosterError } = await supabase
        .from("roster")
        .select("zone_id, is_active, shift")
        .eq("satpam_id", user.id)
        .eq("is_active", true)
        .limit(1);

      if (rosterError) {
        console.error("Roster query error:", rosterError);
      }

      const activeRoster = Array.isArray(rosterData) && rosterData.length > 0 
        ? rosterData[0] 
        : null;
      
      if (activeRoster?.zone_id) {
        setActiveZone(activeRoster.zone_id);

        // 2. Ambil nama zona
        const { data: zoneData } = await supabase
          .from("zones")
          .select("name")
          .eq("id", activeRoster.zone_id)
          .single();
        
        if (zoneData?.name) {
          setZoneName(zoneData.name);
        }

        // 3. Fetch reports untuk zona ini
        const { data: reportsData, error: reportsError } = await supabase
          .from("reports")
          .select(`
            *,
            users (full_name, phone),
            zones (name)
          `)
          .eq("zone_id", activeRoster.zone_id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false });

        if (reportsError) {
          console.error("Reports query error:", reportsError);
        }

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

  // ✅ INITIAL FETCH
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!user?.id || !activeZone) return;
    
    const channel = supabase
      .channel(`satpam-reports-${activeZone}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "reports",
          filter: `zone_id=eq.${activeZone}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, activeZone, user?.id]);

  // ✅ UPDATE STATUS + KIRIM WA
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

  // ✅ OPEN MODAL EVIDENCE
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
        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(fileName, evidencePhoto);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("reports")
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const updateData = {
        status: "resolved",
        ...(evidenceNote && { resolution_note: evidenceNote }),
        ...(photoUrl && { evidence_photo_url: photoUrl }),
      };

      const { error: updateError } = await supabase
        .from("reports")
        .update(updateData)
        .eq("id", evidenceModal.id);

      if (updateError) throw updateError;

      if (evidenceModal.users?.phone) {
        supabase.functions
          .invoke("send-wa-fonnte", {
            body: {
              phone: evidenceModal.users.phone,
              message: `✅ *Laporan Selesai*\n\nHalo ${evidenceModal.users?.full_name || "User"}!\nLaporan Anda telah **selesai ditangani**.\n\nTerima kasih!`,
            },
          })
          .catch((err) => console.error("WA Error:", err));
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
      <div className="space-y-4">
        {/* 🟢 Info Zona Aktif */}
        {activeZone ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                Sedang Bertugas
              </span>
            </div>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {zoneName || "Zona Aktif"}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200">
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

        {/* 📋 Daftar Laporan */}
        <div>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">
            Laporan di Zona Kamu {reports.length > 0 && <span className="text-blue-600 dark:text-blue-400">({reports.length})</span>}
          </h2>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] animate-pulse" />
              ))}
            </div>
          ) : !activeZone ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54]">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Menunggu penugasan zona...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54]">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Zona aman</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => {
                const status = statusConfig[report.status] ?? statusConfig.pending;
                return (
                  <div key={report.id} className="bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] overflow-hidden">
                    {report.photo_url && (
                      <img
                        src={report.photo_url}
                        alt="laporan"
                        className="w-full aspect-video object-cover cursor-pointer hover:opacity-90 transition"
                        onClick={() => setSelectedReport(report)}
                      />
                    )}

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-lg cursor-pointer" onClick={() => setSelectedReport(report)}>
                          <span className="font-mono font-bold tracking-widest text-sm">{report.plate_number ?? "?????"}</span>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {report.zones?.name || zoneName || "Zona"}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(report.created_at)}</span>
                      </div>

                      {report.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{report.description}</p>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#353F54]">
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
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            Selesaikan + Bukti
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-2.5 bg-slate-100 dark:bg-[#353F54] hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
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

      {/* 🔍 Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {/* 📸 Evidence Upload Modal - IMPROVED MOBILE */}
      {evidenceModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEvidenceModal(null)}>
          <div 
            className="bg-white dark:bg-[#242C3B] w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl border-t md:border border-slate-200 dark:border-[#353F54] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-[#242C3B] border-b border-slate-200 dark:border-[#353F54] p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Selesaikan Laporan</h3>
              <button onClick={() => setEvidenceModal(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#353F54] hover:bg-slate-200 dark:hover:bg-[#44506B] flex items-center justify-center text-slate-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-slate-50 dark:bg-[#1e2532] rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Plat Nomor</p>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{evidenceModal.plate_number}</p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Foto Bukti Penanganan <span className="text-slate-400">(Opsional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id="evidence-photo"
                  onChange={(e) => setEvidencePhoto(e.target.files?.[0] ?? null)}
                />
                {evidencePhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#353F54]">
                    <img src={URL.createObjectURL(evidencePhoto)} alt="Bukti" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setEvidencePhoto(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label htmlFor="evidence-photo" className="block w-full h-32 border-2 border-dashed border-slate-300 dark:border-[#353F54] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ambil foto bukti</span>
                  </label>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Catatan Penanganan
                </label>
                <textarea
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1e2532] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none text-sm"
                  placeholder="Contoh: Kendaraan sudah dipindahkan ke area parkir resmi..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleEvidenceSubmit}
                  disabled={evidenceUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {evidenceUploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Selesaikan
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEvidenceModal(null)}
                  className="flex-1 bg-slate-100 dark:bg-[#353F54] hover:bg-slate-200 dark:hover:bg-[#44506B] text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-xl transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SatpamLayout>
  );
}