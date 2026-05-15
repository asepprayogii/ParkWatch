import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, User, Clock, Plus, Edit, Trash2, 
  ShieldCheck, ChevronDown, Search, AlertCircle, 
  CheckCircle2, X, Calendar
} from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const shifts = ['pagi', 'sore', 'malam']

const shiftConfig = {
  pagi: { 
    label: 'Pagi',
    time: '06:00 - 14:00',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100/60 dark:bg-amber-500/10',
    border: 'border-amber-200/60 dark:border-amber-500/20',
    gradient: 'from-amber-500/10 to-transparent'
  },
  sore: { 
    label: 'Sore',
    time: '14:00 - 22:00',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100/60 dark:bg-orange-500/10',
    border: 'border-orange-200/60 dark:border-orange-500/20',
    gradient: 'from-orange-500/10 to-transparent'
  },
  malam: { 
    label: 'Malam',
    time: '22:00 - 06:00',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100/60 dark:bg-indigo-500/10',
    border: 'border-indigo-200/60 dark:border-indigo-500/20',
    gradient: 'from-indigo-500/10 to-transparent'
  },
}

// ── AUTO DETECT ACTIVE SHIFT ──
function getCurrentShift() {
  const now = new Date()
  const hour = now.getHours()
  
  if (hour >= 6 && hour < 14) return 'pagi'
  if (hour >= 14 && hour < 22) return 'sore'
  return 'malam'
}

function isRosterActive(item) {
  const currentShift = getCurrentShift()
  return item.shift === currentShift
}

// ── GLASS CARD ──
function GlassCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] shadow-lg overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ── ROSTER ITEM CARD ──
function RosterItem({ item, onEdit, onDelete }) {
  const config = shiftConfig[item.shift] || shiftConfig.pagi
  const isActive = isRosterActive(item)
  
  return (
    <GlassCard className={cn(
      "transition-all duration-300",
      isActive ? "ring-2 ring-green-500/50 shadow-lg shadow-green-500/10" : "opacity-75 hover:opacity-100"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-lg transition-all",
              isActive 
                ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white scale-110" 
                : "bg-slate-200 dark:bg-[#353F54] text-slate-500 dark:text-slate-400"
            )}>
              {item.users?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                  {item.users?.full_name || 'Satpam'}
                </p>
                {isActive && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Sedang Bertugas
                  </motion.span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                  config.bg, config.color, config.border
                )}>
                  {config.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {config.time}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={12} className="text-[#37B6E9]" />
                <span className="font-medium">{item.zones?.name || 'Zona tidak diketahui'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button 
              onClick={() => onEdit(item)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#353F54] hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-center transition group"
              title="Edit"
            >
              <Edit size={14} className="text-slate-500 group-hover:text-blue-500 transition" />
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#353F54] hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition group"
              title="Hapus"
            >
              <Trash2 size={14} className="text-slate-500 group-hover:text-red-500 transition" />
            </button>
          </div>
        </div>

        {/* Active Indicator Bar */}
        {isActive && (
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }}
            className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 mt-3 rounded-full"
          />
        )}
      </div>
    </GlassCard>
  )
}

// ── MODAL FORM ──
function RosterModal({ isOpen, onClose, rosterData, satpamList, zones, onSave, loading, error }) {
  const [form, setForm] = useState({ satpam_id: '', zone_id: '', shift: 'pagi' })
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (rosterData) {
      setForm({
        satpam_id: rosterData.satpam_id || '',
        zone_id: rosterData.zone_id || '',
        shift: rosterData.shift || 'pagi',
      })
    } else {
      setForm({ satpam_id: '', zone_id: '', shift: 'pagi' })
    }
    setLocalError('')
  }, [rosterData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    
    if (!form.satpam_id) { setLocalError('Pilih satpam terlebih dahulu'); return }
    if (!form.zone_id) { setLocalError('Pilih zona terlebih dahulu'); return }

    try {
      await onSave({ ...form, id: rosterData?.id })
      onClose()
    } catch (err) {
      setLocalError(err.message || 'Gagal menyimpan data')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md" 
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {rosterData ? 'Edit Penugasan' : 'Tambah Penugasan'}
              </h3>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#353F54] hover:bg-slate-200 dark:hover:bg-[#44506B] flex items-center justify-center transition"
              >
                <X size={16} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {(error || localError) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{localError || error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Satpam */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Satpam <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.satpam_id}
                    onChange={(e) => setForm({ ...form, satpam_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-[#353F54] bg-slate-50 dark:bg-[#1e2532] text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#37B6E9] transition appearance-none"
                    required
                  >
                    <option value="">Pilih satpam...</option>
                    {satpamList.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Zona <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.zone_id}
                    onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-[#353F54] bg-slate-50 dark:bg-[#1e2532] text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#37B6E9] transition appearance-none"
                    required
                  >
                    <option value="">Pilih zona...</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map((shift) => {
                    const cfg = shiftConfig[shift]
                    return (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setForm({ ...form, shift })}
                        className={cn(
                          "py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1",
                          form.shift === shift
                            ? cn("border-[#37B6E9]", cfg.bg, cfg.color)
                            : "border-slate-200 dark:border-[#353F54] text-slate-400 hover:border-slate-300 dark:hover:border-[#44506B]"
                        )}
                      >
                        <span className="font-semibold">{shift}</span>
                        <span className="text-[9px] opacity-70">{cfg.time}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#353F54] text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-[#44506B] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#37B6E9] hover:bg-[#2a9cc9] text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : rosterData ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── MAIN COMPONENT ──
export default function AdminRoster() {
  const [roster, setRoster] = useState([])
  const [satpamList, setSatpamList] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // UI State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoster, setEditingRoster] = useState(null)
  const [filterShift, setFilterShift] = useState('semua')
  const [search, setSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [expandedZones, setExpandedZones] = useState({})

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // ── FETCH DATA ──
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: rosterData, error: rErr } = await supabase
        .from('roster')
        .select(`
          id, satpam_id, zone_id, shift,
          users:satpam_id (id, full_name),
          zones:zone_id (id, name)
        `)
        .order('shift')
        .order('id', { ascending: false })

      if (rErr) throw rErr

      const { data: satpam, error: sErr } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'satpam')
        .eq('is_active', true)
        .order('full_name')

      if (sErr) throw sErr

      const { data: zonesData, error: zErr } = await supabase
        .from('zones')
        .select('id, name')
        .order('name')

      if (zErr) throw zErr

      setRoster(rosterData || [])
      setSatpamList(satpam || [])
      setZones(zonesData || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── CRUD OPERATIONS ──
  const handleSave = async (formData) => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        satpam_id: formData.satpam_id,
        zone_id: formData.zone_id,
        shift: formData.shift,
      }

      if (formData.id) {
        const { error } = await supabase.from('roster').update(payload).eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('roster').insert(payload)
        if (error) throw error
      }
      await fetchData()
    } catch (err) {
      console.error('Save error:', err)
      throw new Error(err.message || 'Gagal menyimpan penugasan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus penugasan ini?')) return
    try {
      const { error } = await supabase.from('roster').delete().eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      setError('Gagal menghapus: ' + err.message)
    }
  }

  // ── FILTER & GROUP ──
  const filteredRoster = (() => {
    let result = [...roster]
    if (filterShift !== 'semua') result = result.filter((r) => r.shift === filterShift)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.users?.full_name?.toLowerCase().includes(q) ||
          r.zones?.name?.toLowerCase().includes(q)
      )
    }
    return result
  })()

  const rosterByZone = filteredRoster.reduce((acc, item) => {
    const key = item.zone_id || 'unknown'
    if (!acc[key]) {
      acc[key] = {
        id: key,
        name: item.zones?.name || 'Zona Tidak Diketahui',
        items: [],
      }
    }
    acc[key].items.push(item)
    return acc
  }, {})

  const sortedZones = Object.values(rosterByZone).sort((a, b) =>
    a.name.localeCompare(b.name, 'id')
  )

  const currentShift = getCurrentShift()
  const activeCount = roster.filter(isRosterActive).length

  const toggleZone = (zoneId) => {
    setExpandedZones((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        
        {/* Header dengan Current Shift */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Penugasan Satpam
            </h2>
            <p className="text-slate-600 dark:text-slate-300 font-medium mt-2">
              Kelola jadwal tugas berdasarkan shift
            </p>
          </div>
          
          {/* Current Shift Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-green-700 dark:text-green-300">
              Shift {shiftConfig[currentShift].label}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              ({shiftConfig[currentShift].time})
            </span>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: roster.length, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100/60 dark:bg-[#222834]' },
            { label: 'Sedang Aktif', value: activeCount, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100/60 dark:bg-green-500/10' },
            { label: 'Zona', value: sortedZones.length, color: 'text-[#37B6E9]', bg: 'bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20' },
          ].map((s) => (
            <GlassCard key={s.label} className={cn("p-4 text-center", s.bg)}>
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Search & Filter */}
        <GlassCard className="p-1.5 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#1e2532] rounded-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari satpam atau zona..."
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {['semua', ...shifts].map((s) => (
              <button
                key={s}
                onClick={() => setFilterShift(s)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition",
                  filterShift === s
                    ? "bg-[#37B6E9] text-white shadow-lg shadow-[#37B6E9]/25"
                    : "bg-slate-100 dark:bg-[#222834] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2a3142]"
                )}
              >
                {s === 'semua' ? 'Semua' : shiftConfig[s].label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Terjadi Kesalahan</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => { setEditingRoster(null); setModalOpen(true) }}
          className="w-full py-3 bg-[#37B6E9] hover:bg-[#2a9cc9] text-white font-bold rounded-xl transition shadow-lg shadow-[#37B6E9]/25 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Tambah Penugasan Baru
        </button>

        {/* List by Zone */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-20 animate-pulse" />
            ))}
          </div>
        ) : sortedZones.length === 0 ? (
          <GlassCard className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#222834] rounded-2xl flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-black text-lg mb-1">
              {search ? 'Tidak ditemukan' : 'Belum ada penugasan'}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
              {search ? 'Coba kata kunci lain' : 'Klik tombol Tambah untuk mulai mengatur jadwal satpam'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {sortedZones.map((zone) => {
              const isExpanded = expandedZones[zone.id] !== false
              const zoneActiveCount = zone.items.filter(isRosterActive).length
              
              return (
                <div key={zone.id}>
                  {/* Zone Header */}
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className="w-full flex items-center justify-between p-3 mb-2 bg-slate-50 dark:bg-[#222834] rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a3142] transition"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#37B6E9]" />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{zone.name}</span>
                      <span className="text-xs text-slate-400">({zone.items.length})</span>
                      {zoneActiveCount > 0 && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                          {zoneActiveCount} aktif
                        </span>
                      )}
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={cn("text-slate-400 transition-transform", isExpanded ? 'rotate-180' : '')} 
                    />
                  </button>

                  {/* Zone Items */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-2"
                      >
                        {zone.items.map((item) => (
                          <RosterItem
                            key={item.id}
                            item={item}
                            onEdit={(data) => { setEditingRoster(data); setModalOpen(true) }}
                            onDelete={handleDelete}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <RosterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        rosterData={editingRoster}
        satpamList={satpamList}
        zones={zones}
        onSave={handleSave}
        loading={saving}
        error={error}
      />
    </AdminLayout>
  )
}