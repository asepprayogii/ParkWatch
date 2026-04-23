import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

export default function AdminZona() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*, roster(count)')
        .order('name')
      if (error) throw error
      setZones(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()

    const channel = supabase
      .channel('zones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, fetchZones)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleOpenAdd = () => {
    setEditData(null)
    setForm({ name: '', description: '' })
    setError('')
    setShowForm(true)
  }

  const handleOpenEdit = (zone) => {
    setEditData(zone)
    setForm({ name: zone.name, description: zone.description ?? '' })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama zona wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (editData) {
        const { error } = await supabase
          .from('zones')
          .update({ name: form.name.trim(), description: form.description.trim() })
          .eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('zones')
          .insert({ name: form.name.trim(), description: form.description.trim() })
        if (error) throw error
      }
      setShowForm(false)
      fetchZones()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan zona')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('zones').delete().eq('id', id)
      if (error) throw error
      setDeleteConfirm(null)
      fetchZones()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout title="Kelola Zona">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{zones.length} zona terdaftar</p>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Zona
        </button>
      </div>

      {/* List Zona */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada zona</p>
          <p className="text-slate-400 text-sm mt-1">Tambah zona parkir terlebih dahulu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{zone.name}</p>
                  {zone.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{zone.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEdit(zone)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(zone)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-5">
              {editData ? 'Edit Zona' : 'Tambah Zona'}
            </h3>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nama Zona <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setError('') }}
                  placeholder="contoh: Parkiran Gedung A"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="contoh: Area parkir di depan gedung A lantai 1"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Zona'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Hapus Zona?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Zona <span className="font-semibold text-slate-700">"{deleteConfirm.name}"</span> akan dihapus permanen. Laporan yang terkait zona ini tidak akan terhapus.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Hapus
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}