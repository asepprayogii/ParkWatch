import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import SatpamLayout from '../../components/layout/SatpamLayout'

const shiftColors = {
  pagi: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sore: 'bg-orange-50 text-orange-700 border-orange-200',
  malam: 'bg-blue-50 text-blue-700 border-blue-200',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function SatpamJadwal() {
  const { user } = useAuth()
  const [jadwal, setJadwal] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        let query = supabase
          .from('roster')
          .select('*, zones(name)')
          .eq('satpam_id', user.id)
          .order('date', { ascending: true })

        if (filter === 'upcoming') {
          query = query.gte('date', today)
        } else {
          query = query.lt('date', today)
        }

        const { data } = await query
        setJadwal(data ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchJadwal()
  }, [user.id, filter])

  const today = new Date().toISOString().split('T')[0]

  return (
    <SatpamLayout title="Jadwal Saya">
      <div className="py-3">

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'upcoming', label: 'Mendatang' },
            { key: 'past', label: 'Lalu' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition
                ${filter === f.key ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : jadwal.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Tidak ada jadwal</p>
            <p className="text-slate-400 text-sm mt-1">Hubungi admin untuk penjadwalan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jadwal.map(item => {
              const isToday = item.date === today
              return (
                <div key={item.id}
                  className={`bg-white rounded-2xl border overflow-hidden
                    ${isToday ? 'border-green-400 shadow-sm shadow-green-100' : 'border-slate-200'}`}>
                  {isToday && (
                    <div className="bg-green-600 px-4 py-1.5">
                      <p className="text-white text-xs font-semibold">Hari Ini</p>
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{formatDate(item.date)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${shiftColors[item.shift]}`}>
                          Shift {item.shift}
                        </span>
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="text-xs text-slate-500">{item.zones?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${isToday ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isToday ? 'text-green-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SatpamLayout>
  )
}