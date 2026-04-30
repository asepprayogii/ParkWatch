import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { logout } from '../../services/auth'
import { supabase } from '../../lib/supabase'
import { getUserPoints, levels } from '../../services/points'
import LevelIcon from '../../components/ui/LevelIcon'
import UserLayout from '../../components/layout/UserLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function UserProfile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const avatarRef = useRef()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Points system
  const [pointsData, setPointsData] = useState(null)
  const [pointsLoading, setPointsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      getUserPoints(user.id).then(data => {
        setPointsData(data)
        setPointsLoading(false)
      })
    }
  }, [user?.id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB')
      return
    }
    setAvatarLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { data, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()
      if (updateError) throw updateError
      setUser(data)
    } catch (err) {
      setError(err.message || 'Gagal upload foto')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('id', user.id)
        .select()
        .single()
      if (updateError) throw updateError
      setUser(data)
      setSuccess(true)
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const level = pointsData?.level

  return (
    <UserLayout title="Profil Saya">
      <div className="py-3 max-w-md mx-auto">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => avatarRef.current.click()}
              disabled={avatarLoading}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow border-2 border-white"
            >
              {avatarLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">{user?.full_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-3 py-1 rounded-full">
              Pelapor
            </span>
            {level && !pointsLoading && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${level.color} text-white flex items-center gap-1`}>
                <LevelIcon name={level.icon} className="w-3.5 h-3.5" /> {level.label}
              </span>
            )}
          </div>
        </div>

        {/* ── Points & Level Card ── */}
        {!pointsLoading && pointsData && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 mb-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Poin</p>
                <p className="text-3xl font-extrabold">{pointsData.totalPoints}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><LevelIcon name={level.icon} className="w-6 h-6" /></div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{level.label}</p>
              </div>
            </div>

            {/* Progress bar */}
            {level.nextLevel && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>{level.label}</span>
                  <span className="flex items-center gap-1"><LevelIcon name={level.nextLevel.icon} className="w-3 h-3" /> {level.nextLevel.label} ({level.nextLevel.min} poin)</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${level.color} rounded-full transition-all duration-700`}
                    style={{ width: `${level.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{level.nextLevel.min - pointsData.totalPoints} poin lagi ke level berikutnya</p>
              </div>
            )}

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
              <div className="text-center">
                <p className="text-lg font-bold">{pointsData.totalReports}</p>
                <p className="text-xs text-slate-400">Laporan</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{pointsData.resolvedReports}</p>
                <p className="text-xs text-slate-400">Selesai</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">+{pointsData.breakdown.fromResolved}</p>
                <p className="text-xs text-slate-400">Bonus</p>
              </div>
            </div>
          </div>
        )}

        {pointsLoading && (
          <div className="bg-slate-900 rounded-2xl p-5 mb-4 animate-pulse h-48" />
        )}

        {/* Level Tiers Info */}
        {!pointsLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">Level & Badges</h3>
            <div className="space-y-2">
              {levels.map((lvl) => {
                const isCurrent = level?.label === lvl.label
                return (
                  <div key={lvl.label} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${isCurrent ? 'bg-blue-50 border border-blue-200' : 'opacity-60'}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${lvl.color} flex items-center justify-center shrink-0`}><LevelIcon name={lvl.icon} className="w-4 h-4 text-white" /></div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-blue-700' : 'text-slate-600'}`}>{lvl.label}</p>
                      <p className="text-xs text-slate-400">{lvl.min}+ poin</p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Kamu</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Informasi Akun</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              Profil berhasil diperbarui
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Nama Lengkap" name="full_name" value={form.full_name} onChange={handleChange} required />
              <Input label="No. WhatsApp" name="phone" type="tel" value={form.phone} onChange={handleChange} />
              <div className="flex gap-2 pt-1">
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button type="button" variant="secondary" fullWidth onClick={() => { setEditing(false); setError('') }}>
                  Batal
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Nama', value: user?.full_name },
                { label: 'Email', value: user?.email },
                { label: 'WhatsApp', value: user?.phone ?? '-' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                  <span className="text-sm text-slate-700 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cara Mendapat Poin */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Cara Mendapat Poin</h3>
          <div className="space-y-2">
            {[
              { icon: 'document', text: 'Buat laporan baru', poin: '+5 poin', iconColor: 'text-blue-500 bg-blue-100' },
              { icon: 'check_circle', text: 'Laporan diselesaikan satpam', poin: '+10 bonus', iconColor: 'text-green-500 bg-green-100' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg ${item.iconColor} flex items-center justify-center shrink-0`}><LevelIcon name={item.icon} className="w-4 h-4" /></div>
                <span className="text-sm text-slate-600 flex-1">{item.text}</span>
                <span className="text-xs font-bold text-green-600">{item.poin}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition font-semibold text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar dari Akun
        </button>
      </div>
    </UserLayout>
  )
}