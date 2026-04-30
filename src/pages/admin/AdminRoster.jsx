import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const shifts = ['pagi', 'sore', 'malam']
const shiftColors = {
  pagi: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sore: 'bg-orange-50 text-orange-700 border-orange-200',
  malam: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function AdminRoster() {
  const [roster, setRoster] = useState([])
  const [satpamList, setSatpamList] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ satpam_id: '', zone_id: '', shift: 'pagi' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterShift, setFilterShift] = useState('semua')

  const fetchData = async () => {
    try {
      const { data: rosterData, error: rosterError } = await supabase
        .from('roster')
        .select(`
          id,
          satpam_id,
          zone_id,
          shift,
          is_active,
          users:satpam_id (id, full_name),
          zones:zone_id (id, name)
        `)
        .order('is_active', { ascending: false })
        .order('shift')

      if (rosterError) throw rosterError

      const { data: satpam, error: satpamError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'satpam')
        .eq('is_active', true)
        .order('full_name')

      if (satpamError) throw satpamError

      const { data: zonesData, error: zonesError } = await supabase
        .from('zones')
        .select('id, name')
        .order('name')

      if (zonesError) throw zonesError

      setRoster(rosterData ?? [])
      setSatpamList(satpam ?? [])
      setZones(zonesData ?? [])
      setError('')
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenAdd = () => {
    setEditData(null)
    setForm({ satpam_id: '', zone_id: '', shift: 'pagi' })
    setError('')
    setShowForm(true)
  }

  const handleOpenEdit = (item) => {
    setEditData(item)
    setForm({
      satpam_id: item.satpam_id,
      zone_id: item.zone_id,
      shift: item.shift ?? 'pagi',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.satpam_id) { setError('Pilih satpam'); return }
    if (!form.zone_id) { setError('Pilih zona'); return }
    setSaving(true)
    setError('')

    try {
      const payload = {
        satpam_id: form.satpam_id,
        zone_id: form.zone_id,
        shift: form.shift,
        is_active: true,
      }

      if (editData) {
        const { error } = await supabase
          .from('roster')
          .update(payload)
          .eq('id', editData.id)
        if (error) throw error
      } else {
        const { data: existing, error: checkError } = await supabase
          .from('roster')
          .select('id')
          .eq('satpam_id', form.satpam_id)
          .eq('is_active', true)
          .maybeSingle()

        if (checkError) throw checkError

        if (existing?.id) {
          await supabase
            .from('roster')
            .update({ is_active: false })
            .eq('id', existing.id)
        }

        const { error: insertError } = await supabase
          .from('roster')
          .insert(payload)
        if (insertError) throw insertError
      }

      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Gagal menyimpan')
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

  const handleToggleActive = async (item) => {
    try {
      if (!item.is_active) {
        await supabase
          .from('roster')
          .update({ is_active: false })
          .eq('satpam_id', item.satpam_id)
          .eq('is_active', true)
      }
      await supabase
        .from('roster')
        .update({ is_active: !item.is_active })
        .eq('id', item.id)
      await fetchData()
    } catch (err) {
      setError('Gagal mengubah status: ' + err.message)
    }
  }

  const filteredRoster = filterShift === 'semua'
    ? roster
    : roster.filter(r => r.shift === filterShift)

  // Group by zona
  const rosterByZone = filteredRoster.reduce((acc, item) => {
    const zoneId = item.zone_id
    const zoneName = item.zones?.name ?? 'Zona Tidak Diketahui'
    if (!acc[zoneId]) acc[zoneId] = { id: zoneId, name: zoneName, items: [] }
    acc[zoneId].items.push(item)
    return acc
  }, {})

  const sortedZones = Object.values(rosterByZone).sort((a, b) =>
    a.name.localeCompare(b.name, 'id')
  )

  const activeCount = roster.filter(r => r.is_active).length

  return (
    <AdminLayout title="Penugasan Satpam">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: roster.length, color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Aktif', value: activeCount, color: 'text-green-600 dark:text-green-400' },
          { label: 'Nonaktif', value: roster.length - activeCount, color: 'text-slate-400 dark:text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 text-center transition-colors">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter + Tambah */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['semua', ...shifts].map(s => (
            <button key={s} onClick={() => setFilterShift(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-300
                ${filterShift === s
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* List grouped by zona */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />)}
        </div>
      ) : sortedZones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-300 font-medium">Belum ada penugasan</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Tambah penugasan satpam terlebih dahulu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedZones.map(zone => (
            <div key={zone.id}>
              {/* Zone Header */}
              <div className="flex items-center gap-2 mb-3 px-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{zone.name}</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">({zone.items.length} satpam)</span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                {zone.items.map(item => (
                  <div key={item.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden transition-all duration-300
                      ${item.is_active ? 'border-green-200 dark:border-green-800/50' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors
                          ${item.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {item.users?.full_name?.charAt(0).toUpperCase() ?? 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors">{item.users?.full_name ?? 'Satpam'}</p>
                            {item.is_active && (
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-green-500 text-white rounded-md shadow-sm">AKTIF</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize mt-1 inline-block transition-colors ${shiftColors[item.shift]} dark:bg-opacity-10 dark:border-opacity-30`}>
                            {item.shift}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleToggleActive(item)}
                          title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                            ${item.is_active
                              ? 'bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400'}`}>
                          {item.is_active ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button onClick={() => handleOpenEdit(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-all"
          onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-transparent dark:border-slate-700 transition-all"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-5 transition-colors">
              {editData ? 'Edit Penugasan' : 'Tambah Penugasan'}
            </h3>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 transition-colors">{error}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Satpam <span className="text-red-400">*</span></label>
                <select value={form.satpam_id}
                  onChange={e => { setForm({ ...form, satpam_id: e.target.value }); setError('') }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" required>
                  <option value="">Pilih satpam...</option>
                  {satpamList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Zona <span className="text-red-400">*</span></label>
                <select value={form.zone_id}
                  onChange={e => { setForm({ ...form, zone_id: e.target.value }); setError('') }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-slate-900 text-sm" required>
                  <option value="">Pilih zona...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm({ ...form, shift: s })}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                        ${form.shift === s
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

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

    </AdminLayout>
  )
}