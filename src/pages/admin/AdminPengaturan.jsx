import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../store/authContext'
import { supabase } from '../../lib/supabase'
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

export default function AdminPengaturan() {
  const { user, setUser } = useAuth()
  const avatarRef = useRef()

  // Profil Admin
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Info Aplikasi
  const [appForm, setAppForm] = useState({
    app_name: localStorage.getItem('pw_app_name') ?? 'ParkWatch',
    app_location: localStorage.getItem('pw_app_location') ?? '',
    app_description: localStorage.getItem('pw_app_description') ?? '',
  })
  const [appSuccess, setAppSuccess] = useState(false)

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setProfileError('Ukuran foto maksimal 2MB'); return }
    setAvatarLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const { data, error: updateError } = await supabase
        .from('users').update({ avatar_url: publicUrl }).eq('id', user.id).select().single()
      if (updateError) throw updateError
      setUser(data)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  // Handle save profil
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ full_name: profileForm.full_name, phone: profileForm.phone })
        .eq('id', user.id)
        .select().single()
      if (error) throw error
      setUser(data)
      setProfileSuccess('Profil berhasil diperbarui')
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle ganti password
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Password baru tidak cocok'); return
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password minimal 6 karakter'); return
    }
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password })
      if (error) throw error
      setPasswordSuccess('Password berhasil diubah')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle save info aplikasi
  const handleSaveApp = (e) => {
    e.preventDefault()
    localStorage.setItem('pw_app_name', appForm.app_name)
    localStorage.setItem('pw_app_location', appForm.app_location)
    localStorage.setItem('pw_app_description', appForm.app_description)
    setAppSuccess(true)
    setTimeout(() => setAppSuccess(false), 2000)
  }

  return (
    <AdminLayout title="Pengaturan">
      <PageTransition>
        <div className="max-w-2xl space-y-5">

          {/* ── Profil Admin ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 transition-colors">Profil Admin</h3>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-slate-700 transition-colors">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white dark:border-slate-700">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {(user?.full_name?.charAt(0) || 'A').toUpperCase()}
                    </span>
                  )}
                </div>
                <button onClick={() => avatarRef.current.click()} disabled={avatarLoading}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform">
                  {avatarLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 transition-colors">{user?.full_name}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 transition-colors">{user?.email}</p>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">Admin</span>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-sm text-green-600 dark:text-green-400 transition-colors">{profileSuccess}</div>
            )}
            {profileError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 transition-colors">{profileError}</div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Nama Lengkap</label>
                <input type="text" value={profileForm.full_name}
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">No. WhatsApp</label>
                <input type="tel" value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <button type="submit" disabled={profileLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 text-sm disabled:opacity-50">
                {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </form>
          </div>

          {/* ── Ganti Password ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 transition-colors">Ganti Password</h3>

            {passwordSuccess && (
              <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-sm text-green-600 dark:text-green-400 transition-colors">{passwordSuccess}</div>
            )}
            {passwordError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 transition-colors">{passwordError}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Password Baru</label>
                <input type="password" value={passwordForm.new_password}
                  onChange={e => { setPasswordForm({ ...passwordForm, new_password: e.target.value }); setPasswordError('') }}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Konfirmasi Password Baru</label>
                <input type="password" value={passwordForm.confirm_password}
                  onChange={e => { setPasswordForm({ ...passwordForm, confirm_password: e.target.value }); setPasswordError('') }}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <button type="submit" disabled={passwordLoading}
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition shadow-lg text-sm disabled:opacity-50">
                {passwordLoading ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </form>
          </div>

          {/* ── Informasi Aplikasi ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1 transition-colors">Informasi Aplikasi</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 transition-colors">Ditampilkan di halaman login dan beranda</p>

            {appSuccess && (
              <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-sm text-green-600 dark:text-green-400 transition-colors">
                Informasi aplikasi berhasil disimpan
              </div>
            )}

            <form onSubmit={handleSaveApp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Nama Aplikasi / Tempat</label>
                <input type="text" value={appForm.app_name}
                  onChange={e => setAppForm({ ...appForm, app_name: e.target.value })}
                  placeholder="contoh: ParkWatch Kampus ABC"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Lokasi</label>
                <input type="text" value={appForm.app_location}
                  onChange={e => setAppForm({ ...appForm, app_location: e.target.value })}
                  placeholder="contoh: Universitas XYZ, Bandung"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">Deskripsi Singkat</label>
                <textarea value={appForm.app_description}
                  onChange={e => setAppForm({ ...appForm, app_description: e.target.value })}
                  placeholder="contoh: Platform pelaporan parkir liar berbasis komunitas"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none bg-white dark:bg-slate-900 text-sm" />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 text-sm">
                Simpan Informasi
              </button>
            </form>
          </div>

        </div>
      </PageTransition>
    </AdminLayout>
  )
}