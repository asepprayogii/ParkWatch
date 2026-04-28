import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', dot: 'bg-yellow-400' },
  in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' },
  resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-400' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReportDetailModal({ report, onClose }) {
  const [showLightbox, setShowLightbox] = useState(false)

  if (!report) return null

  const status = statusConfig[report.status] ?? statusConfig.pending

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl md:rounded-2xl overflow-y-auto shadow-2xl animate-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Header image */}
          {report.photo_url && (
            <div className="relative">
              <img
                src={report.photo_url}
                alt="Foto laporan"
                className="w-full h-56 md:h-64 object-cover cursor-pointer"
                onClick={() => setShowLightbox(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                onClick={() => setShowLightbox(true)}
                className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Perbesar
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            {/* Close handle (mobile) */}
            <div className="flex justify-center mb-3 md:hidden">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Plat + Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl">
                <span className="font-mono font-bold tracking-widest text-base">
                  {report.plate_number ?? '?????'}
                </span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Info grid */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Zona</p>
                  <p className="text-sm font-medium text-slate-700">{report.zones?.name ?? 'Tidak diketahui'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Dilaporkan oleh</p>
                  <p className="text-sm font-medium text-slate-700">{report.users?.full_name ?? 'Anonim'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Waktu</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(report.created_at)}</p>
                  <p className="text-xs text-slate-400">{timeAgo(report.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            {report.description && (
              <div className="mb-4 p-3.5 bg-slate-50 rounded-xl">
                <p className="text-xs font-semibold text-slate-500 mb-1">Keterangan</p>
                <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-3">Status Timeline</p>
              <div className="flex items-center gap-0">
                {['pending', 'in_progress', 'resolved'].map((s, idx) => {
                  const isActive = ['pending', 'in_progress', 'resolved'].indexOf(report.status) >= idx
                  const conf = statusConfig[s]
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? conf.dot : 'bg-slate-200'}`} />
                      {idx < 2 && (
                        <div className={`flex-1 h-0.5 ${isActive && ['pending', 'in_progress', 'resolved'].indexOf(report.status) > idx ? 'bg-green-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">Dilaporkan</span>
                <span className="text-xs text-slate-400">Diproses</span>
                <span className="text-xs text-slate-400">Selesai</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {showLightbox && (
        <ImageLightbox
          src={report.photo_url}
          alt={`Foto laporan ${report.plate_number}`}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  )
}
