import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function SatpamDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [todayRoster, setTodayRoster] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Ambil roster hari ini untuk satpam ini
      const { data: roster } = await supabase
        .from('roster')
        .select('*, zones(id, name)')
        .eq('satpam_id', user.id)
        .eq('date', today)
        .eq('is_active', true)
        .single()

      setTodayRoster(roster ?? null)

      if (roster?.zone_id) {
        // Ambil laporan di zona tugasnya
        const { data: reportsData } = await supabase
          .from('reports')
          .select('*, users(full_name), zones(name)')
          .eq('zone_id', roster.zone_id)
          .neq('status', 'resolved')
          .order('created_at', { ascending: false })

        setReports(reportsData ?? [])
      } else {
        setReports([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('satpam-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(reportId)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)
      if (error) throw error

      // Kirim notifikasi ke pelapor
      const report = reports.find(r => r.id === reportId)
      if (report) {
        await supabase.from('notifications').insert({
          user_id: report.user_id,
          type: 'action_update',
          related_report_id: reportId,
          message: newStatus === 'in_progress'
            ? `Laporan plat ${report.plate_number} sedang ditangani satpam`
            : `Laporan plat ${report.plate_number} telah diselesaikan`,
        })
      }
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <SatpamLayout title="Laporan Masuk">
      <div className="py-3">

        {/* Info Shift Hari Ini */}
        {todayRoster ? (
          <div className="bg-green-600 rounded-2xl p-4 mb-4 text-white">
            <p className="text-green-100 text-xs font-medium mb-1">Shift Hari Ini</p>
            <p className="font-bold text-lg">{todayRoster.zones?.name}</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize">
              Shift {todayRoster.shift}
            </span>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-2xl p-4 mb-4">
            <p className="text-slate-500 text-sm text-center">Tidak ada jadwal hari ini</p>
          </div>
        )}

        {/* Laporan */}
        <h2 className="font-semibold text-slate-700 text-sm mb-3">
          Laporan di Zona Kamu {reports.length > 0 && <span className="text-blue-600">({reports.length})</span>}
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
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
          <div className="flex flex-col gap-3">
            {reports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              return (
                <div key={report.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {report.photo_url && (
                    <img src={report.photo_url} alt="laporan" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    {/* Plat + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                        <span className="font-mono font-bold tracking-widest text-sm">
                          {report.plate_number ?? '?????'}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
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

                    {report.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.description}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                          disabled={updating === report.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          {updating === report.id ? 'Memproses...' : 'Tangani Sekarang'}
                        </button>
                      )}
                      {report.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          disabled={updating === report.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          {updating === report.id ? 'Memproses...' : 'Tandai Selesai'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SatpamLayout>
  )
}