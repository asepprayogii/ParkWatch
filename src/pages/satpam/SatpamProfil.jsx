import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'
import { 
  ShieldCheck, Shield, Medal, Award, Camera, Check, X, 
  Edit3, Phone, Mail, User, LogOut, MapPin, Target, Activity, Star, Info, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { logout as authLogout } from '../../services/auth'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Same GlassCard as Admin
function GlassCard({ children, className, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[24px] overflow-hidden transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// Same SectionTitle as Admin
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
        <Icon className="w-5 h-5 text-[#37B6E9]" />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {children}
      </h3>
    </div>
  )
}

const satpamLevels = [
  { label: 'Kadet ParkWatch', min: 0, icon: Shield, colorClass: 'bg-slate-400', gradientClass: 'bg-slate-400' },
  { label: 'Petugas Pratama', min: 5, icon: ShieldCheck, colorClass: 'bg-[#37B6E9]', gradientClass: 'bg-[#37B6E9]' },
  { label: 'Petugas Madya', min: 20, icon: Medal, colorClass: 'bg-emerald-500', gradientClass: 'bg-emerald-500' },
  { label: 'Petugas Utama', min: 50, icon: Award, colorClass: 'bg-amber-500', gradientClass: 'bg-amber-500' },
  { label: 'Komandan Regu', min: 100, icon: Zap, colorClass: 'bg-[#4B4CED]', gradientClass: 'bg-[#4B4CED]' },
]

export default function SatpamProfil() {
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

  const [stats, setStats] = useState({ resolvedCount: 0, activeZone: null })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      try {
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster')
          .select('zone_id, is_active, zones(name)')
          .eq('satpam_id', user.id)
        
        if (rosterError) throw rosterError

        const activeZone = rosterData?.find(r => r.is_active)?.zones?.name || 'Belum Ditugaskan'
        const zoneIds = rosterData?.map(r => r.zone_id) || []

        let resolvedCount = 0
        if (zoneIds.length > 0) {
          const { count, error: countError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .in('zone_id', zoneIds)
            .eq('status', 'resolved')
          
          if (!countError) resolvedCount = count || 0
        }

        setStats({ resolvedCount, activeZone })
      } catch (err) {
        console.error('Failed to fetch satpam stats', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
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
      setTimeout(() => setEditing(false), 1500)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await authLogout()
    navigate('/login')
  }

  const resolvedCount = stats.resolvedCount
  let currentLevel = satpamLevels[0]
  let nextLevel = null

  for (let i = satpamLevels.length - 1; i >= 0; i--) {
    if (resolvedCount >= satpamLevels[i].min) {
      currentLevel = satpamLevels[i]
      nextLevel = i < satpamLevels.length - 1 ? satpamLevels[i + 1] : null
      break
    }
  }

  const progress = nextLevel 
    ? Math.min(100, Math.max(0, ((resolvedCount - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100

  const CurrentIcon = currentLevel.icon

  return (
    <SatpamLayout title="Profil Satpam">
      <div className="py-4 space-y-8">
        
        {/* Header Profile - Identical to Admin Profile Style if any */}
        <GlassCard className="p-8 relative overflow-hidden group">
          <div className={cn("absolute -right-20 -top-20 w-80 h-80 opacity-10 blur-3xl transition-all duration-500 group-hover:scale-110", currentLevel.gradientClass)} />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-[32px] bg-[#353F54] flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white dark:border-[#222834]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-[#37B6E9]">
                    {user?.full_name?.charAt(0).toUpperCase() ?? 'S'}
                  </span>
                )}
              </div>
              <button
                onClick={() => avatarRef.current.click()}
                disabled={avatarLoading}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#37B6E9] text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-[#242C3B] hover:scale-110 transition-transform"
              >
                {avatarLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{user?.full_name}</h2>
              <p className="text-slate-500 dark:text-[#37B6E9] font-bold mb-4 opacity-80">{user?.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {!statsLoading && (
                  <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black text-white shadow-lg", currentLevel.colorClass)}>
                    <CurrentIcon size={14} strokeWidth={3} />
                    {currentLevel.label.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Section - Same grid as Admin Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8">
            <SectionTitle icon={Activity}>Performa Kerja</SectionTitle>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                  {statsLoading ? '...' : resolvedCount}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-[#37B6E9] uppercase tracking-widest">Laporan Selesai</p>
              </div>
              <div className="flex flex-col justify-end pb-1">
                <div className="flex justify-between text-[10px] font-black mb-1.5 text-slate-500 dark:text-slate-400">
                  <span>PROGRES LEVEL</span>
                  <span className="text-[#37B6E9]">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#353F54] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn("h-full rounded-full", currentLevel.colorClass)}
                  />
                </div>
              </div>
            </div>
            {nextLevel && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  Selesaikan {nextLevel.min - resolvedCount} laporan lagi untuk menjadi <span className="underline">{nextLevel.label}</span>.
                </p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-8">
            <SectionTitle icon={MapPin}>Penugasan Aktif</SectionTitle>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[20px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Shield size={32} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {statsLoading ? 'MENGECEK...' : stats.activeZone.toUpperCase()}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  ON DUTY
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Info Personal - Admin Form Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GlassCard className="p-8 h-full">
              <div className="flex items-center justify-between mb-8">
                <SectionTitle icon={User}>Informasi Pribadi</SectionTitle>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-[#37B6E9]/10 hover:bg-[#37B6E9]/20 text-[#37B6E9] text-xs font-black rounded-xl transition-colors"
                  >
                    EDIT PROFIL
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.form 
                    key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleSave} className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <input
                          type="text" name="full_name" value={form.full_name} onChange={handleChange} required
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-[#353F54] border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-white focus:border-[#37B6E9] focus:outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                        <input
                          type="tel" name="phone" value={form.phone} onChange={handleChange}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-[#353F54] border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-white focus:border-[#37B6E9] focus:outline-none transition-all font-bold"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>

                    {success && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold uppercase">
                        <CheckCircle size={16} /> DATA BERHASIL DISIMPAN
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button type="submit" disabled={loading} className="flex-1 bg-[#37B6E9] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#37B6E9]/20 disabled:opacity-50">
                        {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                      </button>
                      <button type="button" onClick={() => setEditing(false)} className="flex-1 bg-slate-100 dark:bg-[#353F54] text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl">
                        BATAL
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 dark:bg-[#222834] rounded-2xl border border-slate-100 dark:border-[#353F54]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                        <p className="font-extrabold text-slate-900 dark:text-white">{user?.full_name}</p>
                      </div>
                      <div className="p-5 bg-slate-50 dark:bg-[#222834] rounded-2xl border border-slate-100 dark:border-[#353F54]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No. WhatsApp</p>
                        <p className="font-extrabold text-slate-900 dark:text-white">{user?.phone || '-'}</p>
                      </div>
                      <div className="p-5 bg-slate-50 dark:bg-[#222834] rounded-2xl border border-slate-100 dark:border-[#353F54] md:col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Satpam</p>
                        <p className="font-extrabold text-slate-900 dark:text-white">{user?.email}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          <GlassCard className="p-8">
            <SectionTitle icon={Info}>Status Sistem</SectionTitle>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">STATUS AKUN</span>
                <span className="text-xs font-black text-emerald-500">AKTIF</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">LEVEL SAAT INI</span>
                <span className="text-xs font-black text-[#37B6E9]">{currentLevel.label.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">JOIN DATE</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{new Date(user?.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }).toUpperCase()}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all font-black text-xs tracking-widest uppercase"
              >
                <LogOut size={16} /> KELUAR SISTEM
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Hierarchy Section */}
        <GlassCard className="p-8">
          <SectionTitle icon={Medal}>Jenjang Karir Satpam</SectionTitle>
          <div className="relative mt-10">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-[#353F54] -translate-y-1/2 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {satpamLevels.map((lvl, idx) => {
                const isCurrent = currentLevel.label === lvl.label
                const isPassed = resolvedCount >= lvl.min
                const LIcon = lvl.icon
                
                return (
                  <div key={lvl.label} className="flex flex-col items-center text-center group">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 shadow-xl",
                      isCurrent ? cn("ring-4 ring-[#37B6E9]/30 scale-110", lvl.colorClass) : 
                      isPassed ? lvl.colorClass : "bg-slate-100 dark:bg-[#353F54] text-slate-400 grayscale"
                    )}>
                      <LIcon size={28} className={isPassed ? "text-white" : "text-slate-400"} strokeWidth={3} />
                    </div>
                    <p className={cn("text-xs font-black tracking-tight mb-1", isCurrent ? "text-[#37B6E9]" : "text-slate-600 dark:text-slate-400")}>
                      {lvl.label.toUpperCase()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lvl.min} LAPORAN</p>
                    {isCurrent && (
                      <div className="mt-2 px-2 py-0.5 bg-[#37B6E9] text-white text-[8px] font-black rounded-md">ANDA</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>

      </div>
    </SatpamLayout>
  )
}
