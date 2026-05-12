import { useEffect, useState } from 'react'
import { useAuth } from '../../store/authContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' },
}

export default function SatpamRiwayat() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [stats, setStats] = useState({ total: 0, in_progress: 0, resolved: 0 })

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        // Ambil zona yang sedang/pernah dijaga satpam ini
        const { data: rosterData } = await supabase
          .from('roster')
          .select('zone_id')
          .eq('satpam_id', user.id)
          .eq('is_active', true)

        if (!rosterData || rosterData.length === 0) {
          setReports([])
          setLoading(false)
          return
        }

        // Deduplikasi zone_id
        const zoneIds = [...new Set(rosterData.map(r => r.zone_id))]

        let query = supabase
          .from('reports')
          .select('*, users(full_name), zones(name)')
          .in('zone_id', zoneIds)
          .order('created_at', { ascending: false })

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus)
        }

        const { data } = await query
        const filtered = data ?? []

        setReports(filtered)
        setStats({
          total: filtered.length,
          in_progress: filtered.filter(r => r.status === 'in_progress').length,
          resolved: filtered.filter(r => r.status === 'resolved').length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRiwayat()
  }, [user.id, filterStatus])

  return (
    <SatpamLayout>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-600' },
            { label: 'Diproses', value: stats.in_progress, color: 'text-orange-600' },
            { label: 'Selesai', value: stats.resolved, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Status */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'in_progress', label: 'Diproses' },
            { key: 'resolved', label: 'Selesai' },
            { key: 'pending', label: 'Menunggu' },
          ].map(f => (
            <button 
              key={f.key} 
              onClick={() => setFilterStatus(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition
                ${filterStatus === f.key
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Belum ada riwayat</p>
            <p className="text-slate-400 text-sm mt-1">Laporan di zona kamu akan muncul di sini</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              return (
                <div 
                  key={report.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex gap-3 p-4">
                    {report.photo_url && (
                      <img src={report.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="bg-slate-900 text-white font-mono text-xs px-2 py-1 rounded-lg tracking-wider">
                          {report.plate_number ?? '?????'}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
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
                      {report.status === 'resolved' && report.evidence_photo_url && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Ada bukti foto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Detail Laporan */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Foto Laporan */}
            {selectedReport.photo_url && (
              <div className="relative bg-slate-100">
                <img
                  src={selectedReport.photo_url}
                  alt="Laporan"
                  className="w-full max-h-80 object-cover"
                />
                <button
                  onClick={() => setSelectedReport(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="bg-slate-800 text-white font-mono text-lg px-4 py-2 rounded-xl tracking-widest">
                  {selectedReport.plate_number ?? '?????'}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusConfig[selectedReport.status]?.color}`}>
                  {statusConfig[selectedReport.status]?.label}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Lokasi</p>
                    <p className="text-sm font-medium text-slate-700">{selectedReport.zones?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Waktu Laporan</p>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(selectedReport.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {selectedReport.description && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">Deskripsi</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedReport.description}</p>
                    </div>
                  </div>
                )}

                {/* Info Penyelesaian (jika resolved) */}
                {selectedReport.status === 'resolved' && (
                  <>
                    <hr className="border-slate-100 my-3" />
                    
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-green-800 mb-2">✅ Laporan Diselesaikan</p>
                      
                      {selectedReport.updated_at && (
                        <div className="flex items-start gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-green-600">Waktu Penyelesaian</p>
                            <p className="text-sm font-medium text-green-900">
                              {new Date(selectedReport.updated_at).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReport.resolution_note && (
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-green-600">Catatan</p>
                            <p className="text-sm text-green-900">{selectedReport.resolution_note}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bukti Foto */}
                    {selectedReport.evidence_photo_url && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">📸 Bukti Penanganan</p>
                        <div className="relative rounded-xl overflow-hidden border border-slate-200">
                          <img
                            src={selectedReport.evidence_photo_url}
                            alt="Bukti"
                            className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(selectedReport.evidence_photo_url, '_blank')}
                          />
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                            Klik untuk perbesar
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pelapor */}
              {selectedReport.users?.full_name && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Dilaporkan oleh</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedReport.users.full_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SatpamLayout>
  )
}