import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../store/AuthContext'
import { getReports } from '../../services/reports'
import { supabase } from '../../lib/supabase'
import UserLayout from '../../components/layout/UserLayout'

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

function ReportCard({ report }) {
  const status = statusConfig[report.status] ?? statusConfig.pending

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {report.photo_url && (
        <img src={report.photo_url} alt="laporan" className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        {/* Plat Nomor */}
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

        {/* Zona */}
        <div className="flex items-center gap-1.5 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">
            {report.zones?.name ?? 'Zona tidak diketahui'}
          </span>
        </div>

        {/* Deskripsi */}
        {report.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">
                {report.users?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="text-xs text-slate-400">{report.users?.full_name ?? 'Anonim'}</span>
          </div>
          <span className="text-xs text-slate-400">{timeAgo(report.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default function UserFeed() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      const data = await getReports()
      setReports(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReports])

  return (
    <UserLayout title="Laporan Parkir">

      {/* Header Info */}
      <div className="bg-blue-600 -mx-4 px-4 py-4 mb-4">
        <p className="text-white text-sm font-medium">ParkWatch</p>
        <p className="text-blue-100 text-xs mt-0.5">
          Laporkan parkir liar di lingkungan kita
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-48 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada laporan</p>
          <p className="text-slate-400 text-sm mt-1">Tap tombol + untuk laporkan parkir liar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </UserLayout>
  )
}