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

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color} dark:bg-slate-700/50`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 transition-colors">{value}</p>
      </div>
    </div>
  )
}

// Section Title Component
function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 transition-colors">
      <div className="w-1 h-4 bg-blue-600 rounded-full" />
      {children}
    </h3>
  )
}

// Lalu wrap return JSX halaman kamu:
export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 })
  const [recentReports, setRecentReports] = useState([])
  const [topPlates, setTopPlates] = useState([])
  const [topReporters, setTopReporters] = useState([])
  const [topSatpam, setTopSatpam] = useState([])
  const [zoneStats, setZoneStats] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      // Semua laporan
      const { data: allReports } = await supabase
        .from('reports')
        .select('*, users(id, full_name), zones(id, name)')
        .order('created_at', { ascending: false })

      if (!allReports) return

      // Stats utama
      setStats({
        total: allReports.length,
        pending: allReports.filter(r => r.status === 'pending').length,
        in_progress: allReports.filter(r => r.status === 'in_progress').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
      })

      // 5 laporan terbaru
      setRecentReports(allReports.slice(0, 5))

      // Top plat — plat yang paling sering muncul
      const plateCount = {}
      allReports.forEach(r => {
        if (r.plate_number) {
          plateCount[r.plate_number] = (plateCount[r.plate_number] ?? 0) + 1
        }
      })
      const sortedPlates = Object.entries(plateCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([plate, count]) => ({ plate, count }))
      setTopPlates(sortedPlates)

      // Top pelapor — user yang paling sering lapor
      const reporterCount = {}
      const reporterNames = {}
      allReports.forEach(r => {
        if (r.users?.id) {
          reporterCount[r.users.id] = (reporterCount[r.users.id] ?? 0) + 1
          reporterNames[r.users.id] = r.users.full_name
        }
      })
      const sortedReporters = Object.entries(reporterCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, name: reporterNames[id], count }))
      setTopReporters(sortedReporters)

      // Zona paling bermasalah
      const zoneCount = {}
      const zoneNames = {}
      allReports.forEach(r => {
        if (r.zones?.id) {
          zoneCount[r.zones.id] = (zoneCount[r.zones.id] ?? 0) + 1
          zoneNames[r.zones.id] = r.zones.name
        }
      })
      const sortedZones = Object.entries(zoneCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, name: zoneNames[id], count }))
      setZoneStats(sortedZones)

      // Top satpam — yang paling banyak menyelesaikan laporan
      const { data: resolvedReports } = await supabase
        .from('reports')
        .select('zone_id, zones(name)')
        .eq('status', 'resolved')

      // Ambil roster untuk tahu satpam mana yang handle zona resolved
      const { data: satpamData } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'satpam')

      const { data: rosterData } = await supabase
        .from('roster')
        .select('satpam_id, zone_id, users(full_name)')

      // Hitung berapa laporan resolved per zona, lalu map ke satpam
      const satpamResolvedCount = {}
      const satpamNames = {}
      resolvedReports?.forEach(r => {
        const satpamInZone = rosterData?.filter(ro => ro.zone_id === r.zone_id) ?? []
        satpamInZone.forEach(s => {
          satpamResolvedCount[s.satpam_id] = (satpamResolvedCount[s.satpam_id] ?? 0) + 1
          satpamNames[s.satpam_id] = s.users?.full_name
        })
      })

      const sortedSatpam = Object.entries(satpamResolvedCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, name: satpamNames[id] ?? 'Unknown', count }))
      setTopSatpam(sortedSatpam)

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
    pending: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    in_progress: { label: 'Diproses', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    resolved: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' },
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff} dtk lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  }

  const maxPlate = topPlates[0]?.count ?? 1
  const maxReporter = topReporters[0]?.count ?? 1
  const maxZone = zoneStats[0]?.count ?? 1
  const maxSatpam = topSatpam[0]?.count ?? 1

  return (
    <AdminLayout title="Dashboard">
      <PageTransition>
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Laporan" value={stats.total} color="bg-blue-50 text-blue-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <StatCard label="Menunggu" value={stats.pending} color="bg-yellow-50 text-yellow-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Diproses" value={stats.in_progress} color="bg-orange-50 text-orange-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          />
          <StatCard label="Selesai" value={stats.resolved} color="bg-green-50 text-green-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Plat Paling Sering */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <SectionTitle>Plat Paling Sering Melanggar</SectionTitle>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : topPlates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {topPlates.map((item, idx) => (
                  <div key={item.plate} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg tracking-widest shrink-0">
                      {item.plate}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-2 bg-red-100 rounded-full flex-1 mr-2 overflow-hidden">
                          <div className="h-2 bg-red-500 rounded-full transition-all"
                            style={{ width: `${(item.count / maxPlate) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-red-600 shrink-0">{item.count}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zona Paling Bermasalah */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <SectionTitle>Zona Paling Bermasalah</SectionTitle>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : zoneStats.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {zoneStats.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 truncate mr-2">{item.name}</span>
                        <span className="text-xs font-bold text-orange-600 shrink-0">{item.count} laporan</span>
                      </div>
                      <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-orange-500 rounded-full transition-all"
                          style={{ width: `${(item.count / maxZone) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pelapor Paling Aktif */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <SectionTitle>Pelapor Paling Aktif</SectionTitle>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : topReporters.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {topReporters.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {item.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 truncate mr-2">{item.name}</span>
                        <span className="text-xs font-bold text-blue-600 shrink-0">{item.count} laporan</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(item.count / maxReporter) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Satpam Paling Aktif */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
            <SectionTitle>Satpam Paling Aktif</SectionTitle>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : topSatpam.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {topSatpam.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-green-600">
                        {item.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 truncate mr-2">{item.name}</span>
                        <span className="text-xs font-bold text-green-600 shrink-0">{item.count} selesai</span>
                      </div>
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-500 rounded-full transition-all"
                          style={{ width: `${(item.count / maxSatpam) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Laporan Terbaru */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
          <SectionTitle>Laporan Terbaru</SectionTitle>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : recentReports.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada laporan</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentReports.map(report => {
                const status = statusConfig[report.status] ?? statusConfig.pending
                return (
                  <div key={report.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 dark:bg-slate-950 text-white font-mono text-xs px-2 py-1 rounded-lg tracking-wider shrink-0">
                        {report.plate_number ?? '?????'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">{report.zones?.name ?? '-'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">{report.users?.full_name} · {timeAgo(report.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${status.color} dark:bg-slate-800/50 dark:border-slate-600 transition-colors`}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </AdminLayout>
  )
}