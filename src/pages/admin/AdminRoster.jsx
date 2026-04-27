import { useEffect, useState } from 'react'
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
  const [form, setForm] = useState({ satpam_id: '', zone_id: '', shift: 'pagi', date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const fetchData = async () => {
    try {
      const { data: rosterData } = await supabase
        .from('roster')
        .select('*, users(id, full_name, phone), zones(id, name)')
        .eq('date', filterDate)
        .order('shift')

      const { data: satpam } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'satpam')
        .eq('is_active', true)
        .order('full_name')

      const { data: zonesData } = await supabase
        .from('zones')
        .select('*')
        .order('name')

      setRoster(rosterData ?? [])
      setSatpamList(satpam ?? [])
      setZones(zonesData ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterDate])

  const handleOpenAdd = () => {
    setEditData(null)
    setForm({ satpam_id: '', zone_id: '', shift: 'pagi', date: filterDate })
    setError('')
    setShowForm(true)
  }

  const handleOpenEdit = (item) => {
    setEditData(item)
    setForm({
      satpam_id: item.satpam_id,
      zone_id: item.zone_id,
      shift: item.shift,
      date: item.date,
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.satpam_id) { setError('Pilih satpam'); return }
    if (!form.zone_id) { setError('Pilih zona'); return }
    if (!form.date) { setError('Pilih tanggal'); return }

    setSaving(true)
    setError('')
    try {
      if (editData) {
        const { error } = await supabase
          .from('roster')
          .update({ satpam_id: form.satpam_id, zone_id: form.zone_id, shift: form.shift, date: form.date })
          .eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('roster')
          .insert({ satpam_id: form.satpam_id, zone_id: form.zone_id, shift: form.shift, date: form.date })
        if (error) throw error
      }
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan roster')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await supabase.from('roster').delete().eq('id', id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout title="Jadwal & Roster">
      <PageTransition>
        {/* Filter Tanggal + Tambah */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <span className="text-sm text-slate-500">{roster.length} jadwal</span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Jadwal
          </button>
        </div>

        {/* Roster per Shift */}
        {loading ?
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
          </div>
        : roster.length === 0 ?
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Tidak ada jadwal</p>
            <p className="text-slate-400 text-sm mt-1">Belum ada roster untuk tanggal ini</p>
          </div>
        :
          <div className="flex flex-col gap-3">
            {shifts.map(shift => {
              const items = roster.filter(r => r.shift === shift)
              if (items.length === 0) return null
              return (
                <div key={shift} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className={`px-4 py-2 border-b border-slate-100 flex items-center gap-2`}>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${shiftColors[shift]}`}>
                      Shift {shift}
                    </span>
                    <span className="text-xs text-slate-400">{items.length} satpam</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-blue-600">
                              {(item.users?.full_name?.charAt(0) || "A").toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{item.users?.full_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className="text-xs text-slate-400">{item.zones?.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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
                </div>
              )
            })}
          </div>
        }

        {/* Modal Form */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h3 className="font-bold text-slate-800 text-lg mb-5">
                  {editData ? 'Edit Jadwal' : 'Tambah Jadwal'}
                </h3>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Satpam <span className="text-red-400">*</span></label>
                    <select value={form.satpam_id} onChange={e => { setForm({ ...form, satpam_id: e.target.value }); setError('') }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm">
                      <option value="">Pilih satpam...</option>
                      {satpamList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Zona <span className="text-red-400">*</span></label>
                    <select value={form.zone_id} onChange={e => { setForm({ ...form, zone_id: e.target.value }); setError('') }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm">
                      <option value="">Pilih zona...</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Shift</label>
                    <div className="grid grid-cols-3 gap-2">
                      {shifts.map(s => (
                        <button key={s} type="button"
                          onClick={() => setForm({ ...form, shift: s })}
                          className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition
                            ${form.shift === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tanggal <span className="text-red-400">*</span></label>
                    <input type="date" value={form.date}
                      onChange={e => { setForm({ ...form, date: e.target.value }); setError('') }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50">
                      {saving ? 'Menyimpan...' : editData ? 'Simpan' : 'Tambah Jadwal'}
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
      </PageTransition>
    </AdminLayout>
  )
}