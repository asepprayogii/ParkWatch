import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { logout } from '../../services/auth'
import { supabase } from '../../lib/supabase'
import { getUserPoints, levels } from '../../services/points'
import LevelIcon from '../../components/ui/LevelIcon'
import UserLayout from '../../components/layout/UserLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Check, X, Edit3, Phone, Mail, User, LogOut,
  Award, Star, TrendingUp, FileText, CheckCircle, Zap
} from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// GlassCard component (sama seperti SatpamProfil)
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

// SectionTitle component (sama seperti SatpamProfil)
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
      setTimeout(() => {
        setEditing(false)
        setSuccess(false)
      }, 1500)
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
  const resolvedCount = pointsData?.resolvedReports || 0

  return (
    <UserLayout title="Profil Saya">
      <div className="py-4 space-y-8">
        
        {/* Header Profile */}
        <GlassCard className="p-8 relative overflow-hidden group">
          <div className={cn(
            "absolute -right-20 -top-20 w-80 h-80 opacity-10 blur-3xl transition-all duration-500 group-hover:scale-110",
            level?.color?.includes('from-') ? 'bg-gradient-to-br ' + level.color : 'bg-gradient-to-br from-[#4B4CED] to-[#37B6E9]'
          )} />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#4B4CED] to-[#37B6E9] flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white dark:border-[#222834]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-white">
                    {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
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
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {user?.full_name}
              </h2>
              <p className="text-slate-500 dark:text-[#37B6E9] font-bold mb-4 opacity-80">
                {user?.email}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {level && !pointsLoading && (
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black text-white shadow-lg",
                    level.color?.includes('from-') ? 'bg-gradient-to-r ' + level.color : 'bg-gradient-to-r from-[#4B4CED] to-[#37B6E9]'
                  )}>
                    <LevelIcon name={level.icon} className="w-4 h-4" />
                    {level.label.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
                <FileText className="w-5 h-5 text-[#37B6E9]" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Total Laporan</h3>
            </div>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              {pointsLoading ? '-' : pointsData?.totalReports || 0}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Selesai</h3>
            </div>
            <p className="text-4xl font-black text-emerald-500 tracking-tighter">
              {pointsLoading ? '-' : resolvedCount}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Total Poin</h3>
            </div>
            <p className="text-4xl font-black text-amber-500 tracking-tighter">
              {pointsLoading ? '-' : pointsData?.totalPoints || 0}
            </p>
          </GlassCard>
        </div>

        {/* Level Progress */}
        {!pointsLoading && pointsData && level && (
          <GlassCard className="p-8">
            <SectionTitle icon={Award}>Level & Progress</SectionTitle>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600 dark:text-slate-400">{level.label}</span>
                {level.nextLevel && (
                  <span className="text-[#37B6E9]">{level.nextLevel.label} ({level.nextLevel.min} poin)</span>
                )}
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-[#353F54] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progress}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    level.color?.includes('from-') ? 'bg-gradient-to-r ' + level.color : 'bg-gradient-to-r from-[#4B4CED] to-[#37B6E9]'
                  )}
                />
              </div>
              {level.nextLevel && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {level.nextLevel.min - pointsData.totalPoints} poin lagi untuk naik ke level {level.nextLevel.label}
                </p>
              )}
            </div>

            {/* Level Tiers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {levels.map((lvl) => {
                const isCurrent = level.label === lvl.label
                const isUnlocked = pointsData.totalPoints >= lvl.min
                return (
                  <div 
                    key={lvl.label} 
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all",
                      isCurrent 
                        ? "bg-gradient-to-br " + (lvl.color || 'from-[#4B4CED] to-[#37B6E9]') + " border-transparent text-white"
                        : isUnlocked
                          ? "bg-slate-50 dark:bg-[#222834] border-slate-200 dark:border-[#353F54]"
                          : "bg-slate-50 dark:bg-[#222834] border-slate-200 dark:border-[#353F54] opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                      isCurrent ? "bg-white/20" : "bg-gradient-to-br " + (lvl.color || 'from-[#4B4CED] to-[#37B6E9]')
                    )}>
                      <LevelIcon name={lvl.icon} className="w-5 h-5 text-white" />
                    </div>
                    <p className={cn(
                      "text-xs font-black mb-0.5",
                      isCurrent ? "text-white" : "text-slate-900 dark:text-white"
                    )}>
                      {lvl.label}
                    </p>
                    <p className={cn(
                      "text-[10px] font-bold",
                      isCurrent ? "text-white/80" : "text-slate-400"
                    )}>
                      {lvl.min}+ poin
                    </p>
                    {isCurrent && (
                      <div className="mt-2 px-2 py-0.5 bg-white/20 text-white text-[8px] font-black rounded-md inline-block">
                        ANDA
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* Personal Info */}
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
                    key="edit" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onSubmit={handleSave} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text" 
                          name="full_name" 
                          value={form.full_name} 
                          onChange={handleChange} 
                          required
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-[#353F54] border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-white focus:border-[#37B6E9] focus:outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          No. WhatsApp
                        </label>
                        <input
                          type="tel" 
                          name="phone" 
                          value={form.phone} 
                          onChange={handleChange}
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

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                        <X size={16} /> {error}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        type="submit" 
                        disabled={loading} 
                        className="flex-1 bg-[#37B6E9] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#37B6E9]/20 disabled:opacity-50"
                      >
                        {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditing(false)} 
                        className="flex-1 bg-slate-100 dark:bg-[#353F54] text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl"
                      >
                        BATAL
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="view" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                        <p className="font-extrabold text-slate-900 dark:text-white">{user?.email}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          <GlassCard className="p-8">
            <SectionTitle icon={Zap}>Cara Dapat Poin</SectionTitle>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                      <FileText size={14} />
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Buat laporan</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">+5</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
                      <CheckCircle size={14} />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Laporan selesai</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+10</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all font-black text-xs tracking-widest uppercase"
            >
              <LogOut size={16} /> KELUAR SISTEM
            </button>
          </GlassCard>
        </div>
      </div>
    </UserLayout>
  )
}