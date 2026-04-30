import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../components/layout/UserLayout'

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' },
}

// Batas waktu edit: 15 menit
const EDIT_TIME_LIMIT = 15 * 60 * 1000

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} dtk lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

function canEdit(createdAt) {
  return Date.now() - new Date(createdAt).getTime() < EDIT_TIME_LIMIT
}

function timeLeftToEdit(createdAt) {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const remaining = EDIT_TIME_LIMIT - elapsed
  if (remaining <= 0) return null
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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

  // Realtime
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
    <UserLayout title="Riwayat Laporan">
      <div className="py-3">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-600' },
            { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Selesai', value: stats.resolved, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu' },
            { key: 'in_progress', label: 'Diproses' },
            { key: 'resolved', label: 'Selesai' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition
                ${filterStatus === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-500'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Belum ada laporan</p>
            <p className="text-slate-400 text-sm mt-1">Laporan yang kamu buat akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              const editable = canEdit(report.created_at) && report.status === 'pending'
              const timeLeft = timeLeftToEdit(report.created_at)

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
                        <span className="text-xs text-slate-500">{report.zones?.name ?? '-'}</span>
                      </div>
                      {report.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{report.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(report.created_at)}</p>
                    </div>
                  </div>

                  {/* Action buttons — hanya tampil kalau status pending & dalam 15 menit */}
                  {editable && (
                    <div className="px-4 pb-3 border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-orange-500 font-medium">
                          Bisa diedit {timeLeft}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(report)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(report)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Edit Laporan</h3>
            <p className="text-xs text-orange-500 mb-4 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sisa waktu edit: {timeLeftToEdit(editingReport.created_at)}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nomor Plat</label>
                <input type="text" value={editForm.plate_number}
                  onChange={e => setEditForm({ ...editForm, plate_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-mono tracking-wider uppercase"
                  placeholder="contoh: B 1234 ABC" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Keterangan</label>
                <textarea value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none text-sm"
                  placeholder="Tambah keterangan..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50">
                  {editLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setEditingReport(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Hapus Laporan?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Laporan plat <span className="font-mono font-bold text-slate-700">{deleteConfirm.plate_number}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Hapus
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </UserLayout>
  )
}