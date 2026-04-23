import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'

export default function AdminSatpam() {
  const { user } = useAuth()
  const [satpamList, setSatpamList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    password: '', admin_password: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const { data: satpam } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'satpam')
        .order('full_name')
      setSatpamList(satpam ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('satpam-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleOpenAdd = () => {
    setEditData(null)
    setForm({ full_name: '', email: '', phone: '', password: '', admin_password: '' })
    setError('')
    setShowForm(true)
  }

  const handleOpenEdit = (satpam) => {
    setEditData(satpam)
    setForm({ full_name: satpam.full_name, email: satpam.email, phone: satpam.phone ?? '', password: '', admin_password: '' })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Nama wajib diisi'); return }
    if (!editData && !form.email.trim()) { setError('Email wajib diisi'); return }
    if (!editData && form.password.length < 6) { setError('Password satpam minimal 6 karakter'); return }
    if (!editData && !form.admin_password) { setError('Password admin wajib diisi untuk konfirmasi'); return }

    setSaving(true)
    setError('')

    try {
      if (editData) {
        // Edit — tidak perlu re-auth
        const { error } = await supabase
          .from('users')
          .update({ full_name: form.full_name, phone: form.phone })
          .eq('id', editData.id)
        if (error) throw error
      } else {
        // Simpan email admin
        const adminEmail = user.email

        // Buat akun satpam (session berganti ke satpam)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (signUpError) throw signUpError

        // Insert profil satpam
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: form.email,
            full_name: form.full_name,
            phone: form.phone,
            role: 'satpam',
          })
        if (insertError) throw insertError

        // Login balik ke admin otomatis
        const { error: reLoginError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: form.admin_password,
        })
        if (reLoginError) throw new Error('Satpam berhasil dibuat, tapi gagal login balik: ' + reLoginError.message)
      }

      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data satpam')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (satpam) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !satpam.is_active })
        .eq('id', satpam.id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout title="Kelola Satpam">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{satpamList.length} satpam terdaftar</p>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Satpam
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
        </div>
      ) : satpamList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada satpam</p>
          <p className="text-slate-400 text-sm mt-1">Tambah akun satpam terlebih dahulu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {satpamList.map(satpam => (
            <div key={satpam.id} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {satpam.avatar_url ? (
                    <img src={satpam.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-blue-600">
                      {satpam.full_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{satpam.full_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${satpam.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {satpam.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{satpam.email}</p>
                  {satpam.phone && <p className="text-xs text-slate-400">{satpam.phone}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEdit(satpam)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToggleActive(satpam)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition
                    ${satpam.is_active
                      ? 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500'
                      : 'bg-slate-100 hover:bg-green-50 text-slate-500 hover:text-green-600'
                    }`}
                >
                  {satpam.is_active ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-screen overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg mb-5">
              {editData ? 'Edit Data Satpam' : 'Tambah Satpam Baru'}
            </h3>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
                <input type="text" value={form.full_name}
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setError('') }}
                  placeholder="Nama lengkap satpam"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
              </div>

              {!editData && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email <span className="text-red-400">*</span></label>
                    <input type="email" value={form.email}
                      onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }}
                      placeholder="email@parkwatch.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Password Satpam <span className="text-red-400">*</span></label>
                    <input type="password" value={form.password}
                      onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">No. WhatsApp</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
              </div>

              {!editData && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-700 font-medium mb-2">Konfirmasi identitas Admin</p>
                  <input type="password" value={form.admin_password}
                    onChange={e => { setForm({ ...form, admin_password: e.target.value }); setError('') }}
                    placeholder="Masukkan password admin kamu"
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm bg-white" />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50">
                  {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Satpam'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}