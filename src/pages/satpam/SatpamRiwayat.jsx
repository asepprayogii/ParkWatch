import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function SatpamRiwayat() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, resolved: 0 })

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        // Ambil roster satpam ini untuk dapat zona-zonanya
        const { data: rosterData } = await supabase
          .from('roster')
          .select('zone_id')
          .eq('satpam_id', user.id)

        const zoneIds = [...new Set(rosterData?.map(r => r.zone_id) ?? [])]

        if (zoneIds.length === 0) {
          setReports([])
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('reports')
          .select('*, users(full_name), zones(name)')
          .in('zone_id', zoneIds)
          .order('created_at', { ascending: false })

        setReports(data ?? [])
        setStats({
          total: data?.length ?? 0,
          resolved: data?.filter(r => r.status === 'resolved').length ?? 0,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRiwayat()
  }, [user.id])

  const statusConfig = {
    pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' },
  }

  return (
    <SatpamLayout title="Riwayat Laporan">
      <div className="py-3">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Laporan</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-slate-500 mt-0.5">Diselesaikan</p>
          </div>
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
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              return (
                <div key={report.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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