import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ImageLightbox from './ImageLightbox'
import { motion } from 'framer-motion'

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  resolved: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
}

function timeAgo(dateStr) {
  try {
    if (!dateStr) return '-'
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (isNaN(diff)) return '-'
    if (diff < 60) return `${diff} dtk lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  } catch (e) { return '-' }
}

function formatDate(dateStr) {
  try {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch (e) { return '-' }
}

export default function ReportDetailModal({ report, onClose }) {
  const [showLightbox, setShowLightbox] = useState(false)

  useEffect(() => {
    // Lock background scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  if (!report) return null

  const status = statusConfig[report.status] || statusConfig.pending

  // Modal JSX
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Backdrop - Fixed to Viewport */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] md:rounded-[32px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[50] w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/50 text-white hover:bg-slate-900 transition-all shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-900 shrink-0">
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt="Laporan"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-tighter opacity-20">No Image</div>
          )}
        </div>

        {/* Right: Info Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
            <div>
               <span className={`inline-block text-[10px] uppercase font-black px-3 py-1 rounded-full border ${status.color} mb-3`}>
                 {status.label}
               </span>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">
                 {report.plate_number || '??????'}
               </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zona</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{report.zones?.name || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pelapor</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{report.users?.full_name || '-'}</p>
              </div>
            </div>

            <div className="p-5 bg-slate-900 dark:bg-slate-700 text-white rounded-[24px] shadow-lg shadow-slate-900/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waktu Laporan</p>
              <p className="text-base font-bold">{formatDate(report.created_at)}</p>
              <p className="text-xs text-emerald-400 font-bold mt-1 uppercase italic">{timeAgo(report.created_at)}</p>
            </div>

            {report.description && (
              <div className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-[24px] border-l-4 border-slate-900 dark:border-white">
                <p className="text-sm italic text-slate-600 dark:text-slate-300">"{report.description}"</p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline Laporan</p>
              <div className="relative space-y-6 pl-2">
                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700" />
                {['pending', 'in_progress', 'resolved'].map((s, idx) => {
                   const labels = { pending: 'Laporan Diterima', in_progress: 'Sedang Diproses', resolved: 'Masalah Selesai' };
                   const currentIdx = ['pending', 'in_progress', 'resolved'].indexOf(report.status);
                   const isDone = currentIdx >= idx;
                   return (
                     <div key={s} className={`relative flex items-center gap-6 ${isDone ? 'opacity-100' : 'opacity-20'}`}>
                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 shadow-lg' : 'bg-slate-300'}`}>
                          {isDone && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className="text-xs font-black dark:text-white uppercase tracking-wider">{labels[s]}</p>
                     </div>
                   );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={onClose}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl text-sm uppercase tracking-widest"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      </motion.div>

      {showLightbox && (
        <ImageLightbox
          src={report.photo_url}
          alt="Foto"
          onClose={() => setShowLightbox(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  )

  // Render modal to body via Portal
  return createPortal(modalContent, document.body)
}
