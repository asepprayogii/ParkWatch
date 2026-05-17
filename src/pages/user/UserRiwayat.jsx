import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../components/layout/UserLayout'

const statusConfig = {
  pending: { 
    label: 'Menunggu', 
    color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' 
  },
  in_progress: { 
    label: 'Diproses', 
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
  },
  resolved: { 
    label: 'Selesai', 
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' 
  },
}

// Batas waktu edit: 15 menit
const EDIT_TIME_LIMIT = 15 * 60 * 1000

function timeAgo(dateStr) {
  if (!dateStr) return "-"
  const parsedDate = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateStr)
    ? new Date(dateStr.trim() + 'Z')
    : new Date(dateStr);
  const diff = Math.floor((Date.now() - parsedDate) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

function canEdit(createdAt) {
  if (!createdAt) return false;
  const parsedDate = typeof createdAt === 'string' && !createdAt.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(createdAt)
    ? new Date(createdAt.trim() + 'Z')
    : new Date(createdAt);
  return Date.now() - parsedDate.getTime() < EDIT_TIME_LIMIT
}

function timeLeftToEdit(createdAt) {
  if (!createdAt) return null;
  const parsedDate = typeof createdAt === 'string' && !createdAt.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(createdAt)
    ? new Date(createdAt.trim() + 'Z')
    : new Date(createdAt);
  const elapsed = Date.now() - parsedDate.getTime()
  const remaining = EDIT_TIME_LIMIT - elapsed
  if (remaining <= 0) return null
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ✅ Inline SVG Components (tanpa lucide-react)
const MapPinIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ClockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const EditIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EyeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const AlertIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

export default function UserRiwayat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingReport, setEditingReport] = useState(null)
  const [editForm, setEditForm] = useState({ plate_number: '', description: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [tick, setTick] = useState(0)

  // Timer untuk update countdown edit
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-close edit/delete modal saat countdown habis
  useEffect(() => {
    if (editingReport && !canEdit(editingReport.created_at)) {
      setEditingReport(null)
    }
    if (deleteConfirm && !canEdit(deleteConfirm.created_at)) {
      setDeleteConfirm(null)
    }
  }, [tick, editingReport, deleteConfirm])

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select('*, zones(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') query = query.eq('status', filterStatus)

      const { data } = await query
      setReports(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [user.id, filterStatus])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('user-riwayat')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reports',
        filter: `user_id=eq.${user.id}`
      }, fetchReports)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user.id])

  // ✅ Navigasi ke UserReportDetail
  const handleViewDetail = (reportId) => {
    navigate(`/user/report-detail/${reportId}`)
  }

  const handleOpenEdit = (report) => {
    setEditingReport(report)
    setEditForm({
      plate_number: report.plate_number ?? '',
      description: report.description ?? '',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingReport) return
    setEditLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          plate_number: editForm.plate_number.toUpperCase(),
          description: editForm.description,
        })
        .eq('id', editingReport.id)
        .eq('user_id', user.id)
      if (error) throw error
      setEditingReport(null)
      fetchReports()
    } catch (err) {
      console.error(err)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id)
      if (error) throw error
      setDeleteConfirm(null)
      fetchReports()
    } catch (err) {
      console.error(err)
    }
  }

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  return (
    <UserLayout>
      <div className="py-3 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Selesai', value: stats.resolved, color: 'text-green-600 dark:text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] p-3 text-center shadow-sm">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu' },
            { key: 'in_progress', label: 'Diproses' },
            { key: 'resolved', label: 'Selesai' },
          ].map(f => (
            <button 
              key={f.key} 
              onClick={() => setFilterStatus(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filterStatus === f.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2a3142]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#2a3142] rounded-2xl flex items-center justify-center mb-4">
              <AlertIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">Belum ada laporan</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center">Laporan yang kamu buat akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              const editable = canEdit(report.created_at) && report.status === 'pending'
              const timeLeft = timeLeftToEdit(report.created_at)

              return (
                <div 
                  key={report.id} 
                  className="bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div 
                    onClick={() => handleViewDetail(report.id)}
                    className="flex gap-3 p-4 cursor-pointer"
                  >
                    {report.photo_url ? (
                      <img src={report.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-[#2a3142] flex items-center justify-center shrink-0">
                        <AlertIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="bg-slate-900 dark:bg-[#1a1f2e] text-white font-mono text-xs px-3 py-1.5 rounded-lg tracking-wider font-bold">
                          {report.plate_number ?? '?????'}
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <MapPinIcon className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{report.zones?.name ?? '-'}</span>
                      </div>
                      {report.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{report.description}</p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(report.created_at)}</p>
                    </div>
                  </div>

                  {/* Action buttons - hanya tampil kalau status pending & dalam 15 menit */}
                  {editable && (
                    <div className="px-4 pb-3 border-t border-slate-100 dark:border-[#353F54] pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs text-orange-500 dark:text-orange-400 font-bold">
                          Bisa diedit {timeLeft}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(report) }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report) }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 text-xs font-bold rounded-xl transition"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View Detail Button (always show for non-editable) */}
                  {!editable && (
                    <div className="px-4 pb-3 border-t border-slate-100 dark:border-[#353F54] pt-3">
                      <button 
                        onClick={() => handleViewDetail(report.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#2a3142] hover:bg-slate-100 dark:hover:bg-[#353F54] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        Lihat Detail
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#242C3B] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-[#353F54]">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Edit Laporan</h3>
            <p className="text-xs text-orange-500 mb-4 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              Sisa waktu edit: {timeLeftToEdit(editingReport.created_at)}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Nomor Plat</label>
                <input 
                  type="text" 
                  value={editForm.plate_number}
                  onChange={e => setEditForm({ ...editForm, plate_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1a1f2e] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-mono tracking-wider uppercase"
                  placeholder="contoh: B 1234 ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Keterangan</label>
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1a1f2e] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none text-sm"
                  placeholder="Tambah keterangan..."
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={editLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingReport(null)}
                  className="flex-1 bg-slate-100 dark:bg-[#2a3142] hover:bg-slate-200 dark:hover:bg-[#353F54] text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#242C3B] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-[#353F54]">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Hapus Laporan?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Laporan plat <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{deleteConfirm.plate_number}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition text-sm"
              >
                Hapus
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 dark:bg-[#2a3142] hover:bg-slate-200 dark:hover:bg-[#353F54] text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl transition text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}