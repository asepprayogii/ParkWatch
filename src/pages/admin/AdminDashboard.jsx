import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/layout/AdminLayout'

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0, pending: 0, in_progress: 0, resolved: 0
  })
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: reports } = await supabase
          .from('reports')
          .select('status')

        const total = reports?.length ?? 0
        const pending = reports?.filter(r => r.status === 'pending').length ?? 0
        const in_progress = reports?.filter(r => r.status === 'in_progress').length ?? 0
        const resolved = reports?.filter(r => r.status === 'resolved').length ?? 0
        setStats({ total, pending, in_progress, resolved })

        const { data: recent } = await supabase
          .from('reports')
          .select('*, users(full_name), zones(name)')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentReports(recent ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchStats)
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

  return (
    <AdminLayout title="Dashboard">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Laporan"
          value={stats.total}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Menunggu"
          value={stats.pending}
          color="bg-yellow-50 text-yellow-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Diproses"
          value={stats.in_progress}
          color="bg-orange-50 text-orange-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        <StatCard
          label="Selesai"
          value={stats.resolved}
          color="bg-green-50 text-green-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Laporan Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Laporan Terbaru</h2>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentReports.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada laporan</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentReports.map(report => {
              const status = statusConfig[report.status] ?? statusConfig.pending
              return (
                <div key={report.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white font-mono text-xs px-2 py-1 rounded-lg tracking-wider">
                      {report.plate_number ?? '?????'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{report.zones?.name ?? 'Zona tidak diketahui'}</p>
                      <p className="text-xs text-slate-400">{report.users?.full_name} · {timeAgo(report.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}