import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'
import { sendNotificationToUser } from '../../services/notifications'

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'Diproses', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'Selesai', color: 'bg-green-100 text-green-700 border-green-200' },
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function SatpamReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [zoomPhoto, setZoomPhoto] = useState(false)

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, user_id, users(full_name), zones(name)')
        .eq('id', id)
        .single()
      if (error) throw error
      if (!data) throw new Error('Laporan tidak ditemukan')
      setReport(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()

    const channel = supabase
      .channel(`satpam-report-detail-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'reports',
        filter: `id=eq.${id}`
      }, (payload) => setReport(prev => ({ ...prev, ...payload.new })))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error

      if (report?.user_id) {
        await sendNotificationToUser({
          userId: report.user_id,
          reportId: report.id,
          plateNumber: report.plate_number,
          status: newStatus,
        })
      }

      await fetchReport()
    } catch (err) {
      console.error(err)
      setError('Gagal update status: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <SatpamLayout title="Detail Laporan">
      <div className="flex flex-col gap-3 py-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
      </div>
    </SatpamLayout>
  )

  if (error) return (
    <SatpamLayout title="Detail Laporan">
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-red-200">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm font-medium hover:underline">Kembali</button>
      </div>
    </SatpamLayout>
  )

  const status = statusConfig[report.status] ?? statusConfig.pending

  return (
    <SatpamLayout title="Detail Laporan">
      {/* Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Foto */}
        {report.photo_url && (
          <div
            className="w-full h-56 bg-slate-100 overflow-hidden cursor-zoom-in"
            onClick={() => setZoomPhoto(true)}
          >
            <img
              src={report.photo_url}
              alt="Bukti Laporan"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-slate-900 text-white font-mono text-sm px-3 py-1.5 rounded-lg tracking-wider">
                {report.plate_number ?? '?????'}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <span className="text-xs text-slate-400">#{report.id?.slice(0, 8)}</span>
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Zona</p>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {report.zones?.name ?? '-'}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Pelapor</p>
              <p className="text-sm font-medium text-slate-700">{report.users?.full_name ?? 'Anonim'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Tanggal Lapor</p>
              <p className="text-sm font-medium text-slate-700">{formatDateTime(report.created_at)}</p>
            </div>
            {report.description && (
              <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Keterangan</p>
                <p className="text-sm text-slate-600 leading-relaxed">{report.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {report.status !== 'resolved' && (
            <div className="flex gap-2 mb-5">
              {report.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {updating ? 'Memproses...' : 'Tangani Sekarang'}
                </button>
              )}
              {report.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {updating ? 'Menyelesaikan...' : 'Tandai Selesai'}
                </button>
              )}
            </div>
          )}

          {report.status === 'resolved' && (
            <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-medium">Laporan ini telah diselesaikan</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-4">Riwayat Status</p>
            <div className="relative border-l-2 border-slate-200 ml-2 space-y-5">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Laporan Dikirim</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(report.created_at)}</p>
                </div>
              </div>

              <div className={`relative pl-6 ${report.status === 'in_progress' || report.status === 'resolved' ? '' : 'opacity-40'}`}>
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white
                  ${report.status === 'in_progress' || report.status === 'resolved' ? 'bg-yellow-500' : 'bg-slate-200'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Mulai Diproses</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {report.status === 'in_progress' || report.status === 'resolved'
                      ? formatDateTime(report.updated_at)
                      : 'Belum diproses'}
                  </p>
                </div>
              </div>

              <div className={`relative pl-6 ${report.status === 'resolved' ? '' : 'opacity-40'}`}>
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white
                  ${report.status === 'resolved' ? 'bg-green-500' : 'bg-slate-200'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Diselesaikan</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {report.status === 'resolved'
                      ? formatDateTime(report.updated_at)
                      : 'Belum selesai'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Photo Modal */}
      {zoomPhoto && report.photo_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(false)}
        >
          <img
            src={report.photo_url}
            alt="Foto laporan"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
            onClick={() => setZoomPhoto(false)}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </SatpamLayout>
  )
}