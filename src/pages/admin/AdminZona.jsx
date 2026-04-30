import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import { useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet marker icon issue in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// Component to handle map clicks for picking location
function LocationPicker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return position ? <Marker position={position} /> : null
}

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
export default function AdminZona() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', latitude: null, longitude: null, radius: 50 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*, roster(count)')
        .order('name')
      if (error) throw error
      setZones(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()

    const channel = supabase
      .channel('zones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, fetchZones)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const mapCenter = [-7.1297312, 112.7242796]

  const handleOpenAdd = () => {
    setEditData(null)
    setForm({ name: '', description: '', latitude: null, longitude: null, radius: 50 })
    setError('')
    setShowForm(true)
  }

  const handleOpenEdit = (zone) => {
    setEditData(zone)
    setForm({
      name: zone.name,
      description: zone.description ?? '',
      latitude: zone.latitude ?? null,
      longitude: zone.longitude ?? null,
      radius: zone.radius ?? 50
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama zona wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        radius: form.radius || 50
      }
      if (editData) {
        const { error } = await supabase
          .from('zones')
          .update(payload)
          .eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('zones')
          .insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      fetchZones()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan zona')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('zones').delete().eq('id', id)
      if (error) throw error
      setDeleteConfirm(null)
      fetchZones()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout title="Kelola Zona">
      <PageTransition>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors">Daftar Zona Parkir</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
              {zones.length} zona terdaftar dalam sistem
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/40 hover:-translate-y-0.5 w-full md:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Zona Baru
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-700 shadow-sm" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600 shadow-sm transition-colors duration-300">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 shadow-inner relative">
              <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-full animate-ping opacity-20 dark:opacity-30" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-500 dark:text-emerald-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Belum Ada Zona</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center max-w-xs transition-colors">
              Mulai kelola area parkir dengan menambahkan zona pertama Anda.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-6 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 group"
            >
              Tambah Zona Sekarang
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {zones.map(zone => {
              const rosterCount = zone.roster ? (Array.isArray(zone.roster) ? zone.roster[0]?.count || 0 : zone.roster.count || 0) : 0;
              return (
                <div 
                  key={zone.id} 
                  className="group bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden flex flex-col backdrop-blur-sm"
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 ease-out" />
                  
                  <div className="relative z-10 flex items-start justify-between mb-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleOpenEdit(zone)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-slate-400 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="Edit Zona"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(zone)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Hapus Zona"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 flex-grow">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1.5 line-clamp-1 transition-colors">{zone.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] leading-relaxed transition-colors">
                      {zone.description || <span className="italic text-slate-400 dark:text-slate-500">Tidak ada deskripsi</span>}
                    </p>
                  </div>
                  
                  <div className="relative z-10 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between transition-colors">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {rosterCount} Petugas
                    </span>
                    {zone.latitude && zone.longitude ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ditandai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                        </svg>
                        Belum Ditandai
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Form Tambah/Edit */}
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />
            <div 
              className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-transparent dark:border-slate-700 transition-colors max-h-[90vh] overflow-y-auto"
              style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-3 transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-inner transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {editData ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      )}
                    </svg>
                  </div>
                  {editData ? 'Edit Data Zona' : 'Tambah Zona Baru'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-3 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                      Nama Zona <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); setError('') }}
                      placeholder="Masukkan nama zona (contoh: Gedung A)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm shadow-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                      Deskripsi
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Tambahkan detail lokasi atau keterangan..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none text-sm shadow-sm"
                    />
                  </div>

                  {/* Map Picker Section */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                      Lokasi di Peta
                    </label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Klik pada peta untuk menandai lokasi zona parkir</p>
                    <div className="h-[250px] w-full rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 relative z-0">
                      <MapContainer
                        center={form.latitude && form.longitude ? [form.latitude, form.longitude] : mapCenter}
                        zoom={17}
                        scrollWheelZoom={true}
                        className="h-full w-full"
                        style={{ zIndex: 0 }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://osm.org">OSM</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationPicker
                          position={form.latitude && form.longitude ? [form.latitude, form.longitude] : null}
                          onPositionChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                        />
                        {form.latitude && form.longitude && (
                          <Circle
                            center={[form.latitude, form.longitude]}
                            radius={form.radius || 50}
                            pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.2 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                    {form.latitude && form.longitude && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          📍 {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, latitude: null, longitude: null })}
                          className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                        >
                          Hapus Pin
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Radius Slider */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">
                      Radius Area ({form.radius || 50} meter)
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={form.radius || 50}
                      onChange={e => setForm({ ...form, radius: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>20m</span>
                      <span>200m</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        editData ? 'Simpan Perubahan' : 'Tambah Zona'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirm(null)} />
            <div 
              className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-7 shadow-2xl text-center border border-transparent dark:border-slate-700 transition-colors"
              style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 relative transition-colors">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-500/20 rounded-full animate-ping opacity-25" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500 dark:text-red-400 relative z-10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2 transition-colors">Hapus Zona?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 px-2 leading-relaxed transition-colors">
                Anda yakin ingin menghapus zona <span className="font-semibold text-slate-800 dark:text-white transition-colors">"{deleteConfirm.name}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-all text-sm shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/25 transition-all text-sm"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
      
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </AdminLayout>
  )
}