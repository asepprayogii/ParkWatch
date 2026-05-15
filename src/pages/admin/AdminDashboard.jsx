// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { FileText, AlertTriangle, CheckCircle, Clock, MapPin, Activity, ShieldCheck, Map as MapIcon, Users, AlertOctagon, TrendingUp } from 'lucide-react'
import L from 'leaflet'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

// Fix Leaflet marker icon issue in Vite
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Glassmorphism Component
function GlassCard({ children, className }) {
  return (
    <div className={cn(
      "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[24px] overflow-hidden transition-all duration-300",
      className
    )}>
      {children}
    </div>
  )
}

function StatCard({ label, value, icon, colorClass, gradientClass, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      <GlassCard className="p-6 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-2xl">
        <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20", gradientClass)} />
        <div className="flex items-center gap-5 relative z-10">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white transition-transform duration-300 group-hover:scale-110", colorClass)}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-[#37B6E9] tracking-wide uppercase opacity-80 mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

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

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 })
  const [recentReports, setRecentReports] = useState([])
  const [topPlates, setTopPlates] = useState([])
  const [topReporters, setTopReporters] = useState([])
  const [topSatpam, setTopSatpam] = useState([])
  const [zoneStats, setZoneStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [mapZones, setMapZones] = useState([])

  const fetchAll = async () => {
    try {
      const { data: allReports } = await supabase
        .from('reports')
        .select('*, users(id, full_name), zones(id, name)')
        .order('created_at', { ascending: false })

      if (!allReports) return

      setStats({
        total: allReports.length,
        pending: allReports.filter(r => r.status === 'pending').length,
        in_progress: allReports.filter(r => r.status === 'in_progress').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
      })

      setRecentReports(allReports.slice(0, 6))

      const plateCount = {}
      allReports.forEach(r => {
        if (r.plate_number) plateCount[r.plate_number] = (plateCount[r.plate_number] ?? 0) + 1
      })
      setTopPlates(Object.entries(plateCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([plate, count]) => ({ plate, count })))

      const zoneCount = {}
      const zoneNames = {}
      allReports.forEach(r => {
        if (r.zones?.id) {
          zoneCount[r.zones.id] = (zoneCount[r.zones.id] ?? 0) + 1
          zoneNames[r.zones.id] = r.zones.name
        }
      })
      const sortedZones = Object.entries(zoneCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ id, name: zoneNames[id], count }))
      setZoneStats(sortedZones)
      setChartData(sortedZones.map(z => ({ name: z.name.substring(0, 10), Laporan: z.count })))

      const { data: resolvedReports } = await supabase.from('reports').select('zone_id, zones(name)').eq('status', 'resolved')
      const { data: rosterData } = await supabase.from('roster').select('satpam_id, zone_id, users(full_name)')

      const satpamResolvedCount = {}
      const satpamNames = {}
      resolvedReports?.forEach(r => {
        const satpamInZone = rosterData?.filter(ro => ro.zone_id === r.zone_id) ?? []
        satpamInZone.forEach(s => {
          satpamResolvedCount[s.satpam_id] = (satpamResolvedCount[s.satpam_id] ?? 0) + 1
          satpamNames[s.satpam_id] = s.users?.full_name
        })
      })

      setTopSatpam(Object.entries(satpamResolvedCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ id, name: satpamNames[id] ?? 'Unknown', count })))

      const reporterCount = {}
      const reporterNames = {}
      allReports.forEach(r => {
        if (r.users?.id) {
          reporterCount[r.users.id] = (reporterCount[r.users.id] ?? 0) + 1
          reporterNames[r.users.id] = r.users.full_name
        }
      })
      setTopReporters(Object.entries(reporterCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ id, name: reporterNames[id] ?? 'Anonim', count })))

      const { data: zonesData } = await supabase
        .from('zones')
        .select('id, name, latitude, longitude, radius')
      setMapZones((zonesData ?? []).filter(z => z.latitude && z.longitude))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const statusConfig = {
    pending: { label: 'Menunggu', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    in_progress: { label: 'Diproses', bg: 'bg-blue-100 dark:bg-[#37B6E9]/20', text: 'text-blue-700 dark:text-[#37B6E9]', dot: 'bg-[#37B6E9]' },
    resolved: { label: 'Selesai', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff} dtk`
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam`
    return `${Math.floor(diff / 86400)} hari`
  }

  const mapCenter = [-7.1297312, 112.7242796]

  return (
    <AdminLayout>
      {/* ✅ FIX: Ganti max-w-7xl mx-auto dengan w-full agar mengisi space saat sidebar collapsed */}
      <div className="w-full space-y-8 pb-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Dashboard Admin</h2>
            <p className="text-slate-600 dark:text-slate-300 font-medium mt-2">Sistem Pengawasan Parkir Terpadu ParkWatch</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#242C3B] px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#353F54] shadow-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-widest">Sistem Aktif</span>
          </div>
        </motion.div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Laporan" value={stats.total} delay={0.1}
            icon={<FileText size={28} strokeWidth={2.5} />} 
            colorClass="bg-[#4B4CED]" 
            gradientClass="bg-[#4B4CED]" 
          />
          <StatCard 
            label="Menunggu" value={stats.pending} delay={0.2}
            icon={<AlertTriangle size={28} strokeWidth={2.5}/>} 
            colorClass="bg-amber-500" 
            gradientClass="bg-amber-500" 
          />
          <StatCard 
            label="Diproses" value={stats.in_progress} delay={0.3}
            icon={<Activity size={28} strokeWidth={2.5}/>} 
            colorClass="bg-[#37B6E9]" 
            gradientClass="bg-[#37B6E9]" 
          />
          <StatCard 
            label="Selesai" value={stats.resolved} delay={0.4}
            icon={<ShieldCheck size={28} strokeWidth={2.5}/>} 
            colorClass="bg-emerald-500" 
            gradientClass="bg-emerald-500" 
          />
        </div>

        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            
            {/* Map */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-8">
                <SectionTitle icon={MapIcon}>Zona Parkir Universitas Trunojoyo Madura</SectionTitle>
                <div className="h-[400px] w-full rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-[#353F54] relative z-0">
                  <MapContainer center={mapCenter} zoom={17} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapZones.map(zone => (
                      <Circle
                        key={zone.id}
                        center={[zone.latitude, zone.longitude]}
                        radius={zone.radius || 50}
                        pathOptions={{ color: '#37B6E9', fillColor: '#4B4CED', fillOpacity: 0.25, weight: 2 }}
                      >
                        <Popup>
                          <div className="font-black text-slate-900 text-sm">{zone.name}</div>
                        </Popup>
                      </Circle>
                    ))}
                    {mapZones.map(zone => (
                      <Marker key={`marker-${zone.id}`} position={[zone.latitude, zone.longitude]}>
                        <Popup>
                          <div className="font-black text-slate-900 text-sm">{zone.name}</div>
                        </Popup>
                      </Marker>
                    ))}
                    {mapZones.length === 0 && (
                      <>
                        <Marker position={mapCenter}>
                          <Popup>
                            <div className="font-black text-slate-900">Pusat Parkir UTM</div>
                          </Popup>
                        </Marker>
                        <Circle center={mapCenter} radius={80} pathOptions={{ color: '#37B6E9', fillColor: '#37B6E9', fillOpacity: 0.3 }} />
                      </>
                    )}
                  </MapContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Chart */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <SectionTitle icon={TrendingUp}>Zona Bermasalah</SectionTitle>
                  <span className="text-xs font-black text-slate-400 dark:text-[#37B6E9] uppercase tracking-[0.2em]">Analisis Data</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#353F54" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(55, 182, 233, 0.05)' }}
                        contentStyle={{ backgroundColor: '#242C3B', border: '1px solid #353F54', borderRadius: '16px', color: '#fff', fontWeight: 700 }}
                      />
                      <Bar dataKey="Laporan" fill="#4B4CED" radius={[8, 8, 0, 0]} barSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <div className="space-y-8">
            
            {/* Laporan Terbaru */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <GlassCard className="p-8 flex flex-col h-[480px]">
                <SectionTitle icon={Clock}>Laporan Terbaru</SectionTitle>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                  {recentReports.map((report) => {
                    const status = statusConfig[report.status]
                    return (
                      <div key={report.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]/50 hover:border-[#37B6E9]/50 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-[#242C3B] px-3 py-1 rounded-xl shadow-sm border border-slate-100 dark:border-[#353F54]">
                            {report.plate_number || 'UNKNOWN'}
                          </span>
                          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2", status.bg, status.text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)}></span>
                            {status.label}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{report.zones?.name}</span>
                          <span className="text-slate-400 dark:text-slate-400 font-bold">{timeAgo(report.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* Top Pelanggar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
              <GlassCard className="p-8">
                <SectionTitle icon={AlertOctagon}>Pelanggar Tersering</SectionTitle>
                <div className="space-y-5">
                  {topPlates.map((item, idx) => (
                    <div key={item.plate} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={cn("text-xs font-black", idx === 0 ? "text-[#37B6E9]" : "text-slate-400")}>0{idx + 1}</span>
                        <span className="font-mono text-sm font-black text-slate-800 dark:text-white">{item.plate}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-20 bg-slate-100 dark:bg-[#222834] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4B4CED] rounded-full" style={{ width: `${(item.count / (topPlates[0]?.count || 1)) * 100}%` }} />
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-[#37B6E9]">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Top Pelapor */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <GlassCard className="p-8">
                <SectionTitle icon={Users}>Pelapor Teraktif</SectionTitle>
                <div className="space-y-5">
                  {topReporters.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#222834] flex items-center justify-center text-[10px] font-black text-slate-500">
                          {item.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#37B6E9] bg-[#37B6E9]/10 px-2 py-0.5 rounded-lg">{item.count}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Laporan</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </div>
      </div>
    </AdminLayout>
  )
}