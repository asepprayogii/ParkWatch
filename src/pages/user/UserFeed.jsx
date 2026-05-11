import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../../store/AuthContext'
import { getReports } from '../../services/reports'
import { supabase } from '../../lib/supabase'
import { getUserPoints } from '../../services/points'
import LevelIcon from '../../components/ui/LevelIcon'
import UserLayout from '../../components/layout/UserLayout'
import ReportDetailModal from '../../components/ui/ReportDetailModal'
import ImageLightbox from '../../components/ui/ImageLightbox'

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

function ReportCard({ report, onClick, onPhotoClick }) {
  const status = statusConfig[report.status] ?? statusConfig.pending

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(report)}>
      {report.photo_url && (
        <div className="relative">
          <img src={report.photo_url} alt="laporan" className="w-full aspect-video object-cover" />
          <button
            onClick={(e) => { e.stopPropagation(); onPhotoClick(report.photo_url) }}
            className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-black/80 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Zoom
          </button>
        </div>
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
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [userPoints, setUserPoints] = useState(null)

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

  // Fetch user points
  useEffect(() => {
    if (user?.id) {
      getUserPoints(user.id).then(setUserPoints)
    }
  }, [user?.id])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReports])

  // Search filter
  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports
    const q = search.toLowerCase()
    return reports.filter(r =>
      r.plate_number?.toLowerCase().includes(q) ||
      r.zones?.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.users?.full_name?.toLowerCase().includes(q)
    )
  }, [reports, search])

  const appName = localStorage.getItem('pw_app_name') || 'ParkWatch'
  const appDesc = localStorage.getItem('pw_app_description') || 'Laporkan parkir liar di lingkungan kita'

  return (
    <UserLayout title="Laporan Parkir">

      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 md:-mx-0 px-4 py-4 mb-4 md:rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">{appName}</p>
            <p className="text-blue-100 text-xs mt-0.5">{appDesc}</p>
          </div>
          {userPoints && (
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><LevelIcon name={userPoints.level.icon} className="w-4 h-4 text-white" /></div>
              <div className="text-right">
                <p className="text-white text-xs font-bold">{userPoints.totalPoints} poin</p>
                <p className="text-blue-200 text-[10px]">{userPoints.level.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari plat nomor, zona, atau deskripsi..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results count if searching */}
      {search && (
        <p className="text-xs text-slate-400 mb-3">{filteredReports.length} laporan ditemukan</p>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 aspect-[4/3] md:aspect-video animate-pulse" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-semibold text-sm">
            {search ? 'Tidak ada hasil' : 'Belum ada laporan'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? `Tidak ditemukan laporan untuk "${search}"` : 'Tap tombol + untuk laporkan parkir liar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={setSelectedReport}
              onPhotoClick={setLightboxPhoto}
            />
          ))}
        </div>
      )}

      {/* Detail Modal - PERBAIKAN TAMPILAN */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Photo Lightbox - PERBAIKAN TAMPILAN */}
      {lightboxPhoto && (
        <ImageLightbox
          src={lightboxPhoto}
          alt="Foto laporan"
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </UserLayout>
  )
}