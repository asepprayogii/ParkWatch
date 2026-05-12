import { useEffect, useState } from "react";
import { useAuth } from "../../store/authContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";

export default function SatpamJadwal() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        // Ambil semua penugasan satpam ini (aktif & non-aktif)
        const { data } = await supabase
          .from("roster")
          .select("*, zones(name)")
          .eq("satpam_id", user.id)
          .order("is_active", { ascending: false })
          .order("created_at", { ascending: false });

        setJadwal(data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [user.id]);

  return (
    <SatpamLayout>
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">
          Riwayat Penugasan {jadwal.length > 0 && <span className="text-blue-600">({jadwal.length})</span>}
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : jadwal.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Belum ada penugasan</p>
            <p className="text-slate-400 text-sm mt-1">Hubungi admin untuk di-assign ke zona</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jadwal.map((item) => (
              <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden ${item.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-slate-700">{item.zones?.name}</p>
                      {item.is_active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500 text-white rounded-full">
                          SEDANG BERJALAN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {item.start_date && (
                        <span>
                          Mulai: {new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {item.end_date && (
                        <span>
                          Selesai: {new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${item.is_active ? 'text-green-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SatpamLayout>
  );
}