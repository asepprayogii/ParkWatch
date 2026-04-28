import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import { useLocation } from 'react-router-dom'

function PageTransition({ children }) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [location.pathname])
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.4,0,.2,1)' }}>
      {children}
    </div>
  )
}

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

  const fetchData = async () => {
    try {
      const { data: rosterData } = await supabase
        .from('roster')
        .select('*, users(id, full_name), zones(id, name)')
        .order('is_active', { ascending: false })

      const { data: satpam } = await supabase.from('users').select('id, full_name').eq('role', 'satpam').eq('is_active', true).order('full_name')
      const { data: zonesData } = await supabase.from('zones').select('id, name').order('name')

      setRoster(rosterData ?? [])
      setSatpamList(satpam ?? [])
      setZones(zonesData ?? [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
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
    setForm({ satpam_id: item.satpam_id, zone_id: item.zone_id, shift: item.shift || 'pagi' })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.satpam_id) return setError('Pilih satpam')
    if (!form.zone_id) return setError('Pilih zona')
    setSaving(true); setError('')

    try {
      const payload = { satpam_id: form.satpam_id, zone_id: form.zone_id, shift: form.shift, is_active: true }

      if (editData) {
        const { error } = await supabase.from('roster').update(payload).eq('id', editData.id)
        if (error) throw error
      } else {
        // Nonaktifkan jadwal lain satpam ini agar tidak dobel
        await supabase.from('roster').update({ is_active: false }).eq('satpam_id', form.satpam_id).eq('is_active', true)
        const { error } = await supabase.from('roster').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      fetchData()
    } catch (err) { setError(err.message || 'Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus penugasan ini?')) return
    await supabase.from('roster').delete().eq('id', id)
    fetchData()
  }

  const handleToggleActive = async (item) => {
    if (!item.is_active) await supabase.from('roster').update({ is_active: false }).eq('satpam_id', item.satpam_id).eq('is_active', true)
    await supabase.from('roster').update({ is_active: !item.is_active }).eq('id', item.id)
    fetchData()
  }

  return (
    <AdminLayout title="Penugasan Satpam">
      <PageTransition>
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-sm text-slate-500">{roster.filter(r => r.is_active).length} aktif</span>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Tambah Penugasan
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-slate-200" />)}</div>
        ) : roster.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Belum ada penugasan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {roster.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden ${item.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {(item.users?.full_name?.charAt(0) || 'A').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">{item.users?.full_name}</p>
                        {item.is_active && <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500 text-white rounded-full">AKTIF</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${shiftColors[item.shift]}`}>{item.shift}</span>
                        <span className="text-xs text-slate-500">• {item.zones?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleActive(item)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">{item.is_active ? '🚫' : '✅'}</button>
                    <button onClick={() => handleOpenEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400">✏️</button>
                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-slate-800 text-lg mb-4">{editData ? 'Edit Penugasan' : 'Tambah Penugasan'}</h3>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Satpam <span className="text-red-400">*</span></label>
                  <select value={form.satpam_id} onChange={e => setForm({...form, satpam_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm" required>
                    <option value="">Pilih satpam...</option>
                    {satpamList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Zona <span className="text-red-400">*</span></label>
                  <select value={form.zone_id} onChange={e => setForm({...form, zone_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm" required>
                    <option value="">Pilih zona...</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Shift</label>
                  <div className="grid grid-cols-3 gap-2">
                    {shifts.map(s => (
                      <button key={s} type="button" onClick={() => setForm({...form, shift: s})}
                        className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition ${form.shift === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50">
                    {saving ? 'Menyimpan...' : editData ? 'Simpan' : 'Tambah'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  )
}