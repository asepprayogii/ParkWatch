import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/authContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { useLocation } from 'react-router-dom'

// Buat komponen helper kecil
function PageTransition({ children }) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  )
}

// Lalu wrap return JSX halaman kamu:
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
      <PageTransition>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">{satpamList.length} satpam terdaftar</p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-500/20"
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
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />)}
          </div>
        ) : satpamList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-300 font-medium">Belum ada satpam</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Tambah akun satpam terlebih dahulu</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {satpamList.map(satpam => (
              <div key={satpam.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between gap-4 transition-all hover:shadow-md dark:hover:shadow-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                    {satpam.avatar_url ? (
                      <img src={satpam.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {(satpam.full_name?.charAt(0) || "A").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm transition-colors">{satpam.full_name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${satpam.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        {satpam.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">{satpam.email}</p>
                    {satpam.phone && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 transition-colors">{satpam.phone}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(satpam)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(satpam)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                      ${satpam.is_active
                        ? 'bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700 transition-all">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-5 transition-colors">
                {editData ? 'Edit Data Satpam' : 'Tambah Satpam Baru'}
              </h3>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 transition-colors">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
                  <input type="text" value={form.full_name}
                    onChange={e => { setForm({ ...form, full_name: e.target.value }); setError('') }}
                    placeholder="Nama lengkap satpam"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
                </div>

                {!editData && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email <span className="text-red-400">*</span></label>
                      <input type="email" value={form.email}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }}
                        placeholder="email@parkwatch.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Password Satpam <span className="text-red-400">*</span></label>
                      <input type="password" value={form.password}
                        onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No. WhatsApp</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
                </div>

                {!editData && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 transition-colors">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-2 uppercase tracking-wider">Konfirmasi Admin</p>
                    <input type="password" value={form.admin_password}
                      onChange={e => { setForm({ ...form, admin_password: e.target.value }); setError('') }}
                      placeholder="Masukkan password admin Anda"
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all bg-white dark:bg-slate-900 text-sm" />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 text-sm disabled:opacity-50">
                    {saving ? 'Menyimpan...' : editData ? 'Simpan' : 'Tambah'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-xl transition text-sm">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  )
}