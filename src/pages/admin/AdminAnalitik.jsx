import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function SectionTitle({ children }) {
  return <h2 className="font-bold text-slate-700 text-base mb-3">{children}</h2>
}

export default function AdminAnalitik() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month') // week | month | all

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('reports')
        .select('*, users(id, full_name), zones(id, name)')
        .order('created_at', { ascending: false })
      setReports(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  // --- Computed stats ---
  const now = new Date()

  const filteredReports = reports.filter(r => {
    if (period === 'all') return true
    const d = new Date(r.created_at)
    if (period === 'week') return (now - d) / 86400000 <= 7
    if (period === 'month') return (now - d) / 86400000 <= 30
    return true
  })

  // By status
  const byStatus = {
    pending: filteredReports.filter(r => r.status === 'pending').length,
    in_progress: filteredReports.filter(r => r.status === 'in_progress').length,
    resolved: filteredReports.filter(r => r.status === 'resolved').length,
  }
  const totalFiltered = filteredReports.length
  const resolveRate = totalFiltered > 0 ? Math.round((byStatus.resolved / totalFiltered) * 100) : 0

  // By zone
  const zoneMap = {}
  filteredReports.forEach(r => {
    const zn = r.zones?.name ?? 'Unknown'
    zoneMap[zn] = (zoneMap[zn] ?? 0) + 1
  })
  const byZone = Object.entries(zoneMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxZone = byZone[0]?.[1] ?? 1

  // By day of week
  const dayMap = [0, 0, 0, 0, 0, 0, 0]
  filteredReports.forEach(r => {
    dayMap[new Date(r.created_at).getDay()]++
  })
  const maxDay = Math.max(...dayMap, 1)

  // By hour
  const hourMap = Array(24).fill(0)
  filteredReports.forEach(r => {
    hourMap[new Date(r.created_at).getHours()]++
  })
  const maxHour = Math.max(...hourMap, 1)

  // Monthly trend (last 6 months)
  const monthlyMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyMap[key] = { label: `${months[d.getMonth()]} ${d.getFullYear() % 100}`, count: 0 }
  }
  reports.forEach(r => {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthlyMap[key]) monthlyMap[key].count++
  })
  const monthlyData = Object.values(monthlyMap)
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1)

  // Avg resolution time
  const resolvedReports = filteredReports.filter(r => r.status === 'resolved' && r.created_at && r.updated_at)
  const avgTime = resolvedReports.length > 0
    ? Math.round(resolvedReports.reduce((sum, r) => sum + (new Date(r.updated_at) - new Date(r.created_at)) / 3600000, 0) / resolvedReports.length)
    : 0

  return (
    <AdminLayout title="Analitik & Statistik">
      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'week', label: '7 Hari' },
          { key: 'month', label: '30 Hari' },
          { key: 'all', label: 'Semua' },
        ].map(f => (
          <button key={f.key} onClick={() => setPeriod(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition
              ${period === f.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Laporan', value: totalFiltered, color: 'from-blue-500 to-blue-600', icon: '📊' },
              { label: 'Tingkat Selesai', value: `${resolveRate}%`, color: 'from-green-500 to-green-600', icon: '✅' },
              { label: 'Rata-rata Selesai', value: `${avgTime} jam`, color: 'from-orange-500 to-orange-600', icon: '⏱️' },
              { label: 'Belum Ditangani', value: byStatus.pending, color: 'from-red-500 to-red-600', icon: '⚠️' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg shadow-sm`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">{card.value}</p>
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Monthly Trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionTitle>Tren Bulanan (6 Bulan Terakhir)</SectionTitle>
              <div className="flex items-end gap-2 h-40 mt-4">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-blue-600">{m.count}</span>
                    <div className="w-full bg-blue-100 rounded-t-lg overflow-hidden" style={{ height: '100%', position: 'relative' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                        style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionTitle>Distribusi Status</SectionTitle>
              <div className="space-y-4 mt-4">
                {[
                  { label: 'Menunggu', count: byStatus.pending, color: 'bg-yellow-500', bgColor: 'bg-yellow-100' },
                  { label: 'Diproses', count: byStatus.in_progress, color: 'bg-blue-500', bgColor: 'bg-blue-100' },
                  { label: 'Selesai', count: byStatus.resolved, color: 'bg-green-500', bgColor: 'bg-green-100' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-600">{s.label}</span>
                      <span className="text-sm font-bold text-slate-700">{s.count}</span>
                    </div>
                    <div className={`h-3 ${s.bgColor} rounded-full overflow-hidden`}>
                      <div className={`h-3 ${s.color} rounded-full transition-all duration-700`}
                        style={{ width: totalFiltered > 0 ? `${(s.count / totalFiltered) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* By Zone */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionTitle>Laporan per Zona</SectionTitle>
              {byZone.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
              ) : (
                <div className="space-y-3 mt-2">
                  {byZone.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 truncate mr-2">{name}</span>
                          <span className="text-xs font-bold text-orange-600 shrink-0">{count}</span>
                        </div>
                        <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${(count / maxZone) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Day of Week */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <SectionTitle>Laporan per Hari</SectionTitle>
              <div className="flex items-end gap-2 h-36 mt-4">
                {dayMap.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-green-600">{count}</span>
                    <div className="w-full relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg transition-all duration-500"
                        style={{ height: `${(count / maxDay) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{days[i].slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionTitle>Jam Rawan Laporan</SectionTitle>
            <div className="flex items-end gap-[2px] h-28 mt-4">
              {hourMap.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative" style={{ height: '100%' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-sm transition-all duration-300 ${count === Math.max(...hourMap) ? 'bg-red-400' : 'bg-blue-300'}`}
                      style={{ height: `${(count / maxHour) * 100}%`, minHeight: count > 0 ? '2px' : '0' }}
                    />
                  </div>
                  {i % 3 === 0 && (
                    <span className="text-[9px] text-slate-400 mt-1">{String(i).padStart(2, '0')}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Distribusi laporan per jam (24 jam)</p>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
