import { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { MapPin, Clock, AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const shiftConfig = {
  pagi: { 
    label: 'Pagi',
    time: '06:00 - 14:00',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20'
  },
  sore: { 
    label: 'Sore',
    time: '14:00 - 22:00',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/20'
  },
  malam: { 
    label: 'Malam',
    time: '22:00 - 06:00',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-200 dark:border-indigo-500/20'
  },
};

function getCurrentShift() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'pagi';
  if (hour >= 14 && hour < 22) return 'sore';
  return 'malam';
}

// ── SCHEDULE CARD (simplified) ──
function ScheduleCard({ item, isActive }) {
  const config = shiftConfig[item.shift] || shiftConfig.pagi;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-[#242C3B] rounded-xl border p-4 transition-all",
        isActive 
          ? "border-cyan-300 dark:border-cyan-700 shadow-sm" 
          : "border-slate-200 dark:border-[#353F54]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            isActive 
              ? "bg-gradient-to-br from-cyan-500 to-blue-600" 
              : "bg-slate-100 dark:bg-[#353F54]"
          )}>
            <MapPin className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {item.zones?.name || "Zona tidak diketahui"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase",
                config.bg, config.color, config.border
              )}>
                {config.label}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock size={10} />
                {config.time}
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <span className="shrink-0 px-2 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
            Aktif
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ──
export default function SatpamJadwal() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJadwal = async () => {
    if (!user?.id) return;
    try {
      setError("");
      const { data, error: fetchError } = await supabase
        .from("roster")
        .select(`
          id, satpam_id, zone_id, shift,
          zones:zone_id (id, name)
        `)
        .eq("satpam_id", user.id)
        .order("shift")
        .order("id", { ascending: false });

      if (fetchError) {
        setError("Gagal memuat jadwal");
        setJadwal([]);
        return;
      }
      setJadwal(data ?? []);
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJadwal(); }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("satpam-schedule-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "roster",
        filter: `satpam_id=eq.${user.id}`
      }, fetchJadwal)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchJadwal, user?.id]);

  const currentShift = getCurrentShift();
  const activeItems = jadwal.filter(j => j.shift === currentShift);
  const otherItems = jadwal.filter(j => j.shift !== currentShift);

  return (
    <SatpamLayout>
      <div className="w-full min-w-0 space-y-6 pb-10">
        
        {/* Header */}
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Jadwal Penugasan
          </h2>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-2">
            Shift saat ini: <span className="font-bold">{shiftConfig[currentShift].label}</span> ({shiftConfig[currentShift].time})
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white dark:bg-[#242C3B] rounded-xl border border-slate-200 dark:border-[#353F54] animate-pulse" />
            ))}
          </div>
        ) : jadwal.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center text-center bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54]">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-bold text-slate-500 dark:text-slate-400">Belum ada penugasan</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Hubungi admin untuk di-assign ke zona</p>
          </div>
        ) : (
          <>
            {/* Penugasan Aktif */}
            {activeItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                  Sedang Bertugas
                </p>
                <div className="space-y-3">
                  {activeItems.map(item => (
                    <ScheduleCard key={item.id} item={item} isActive={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Shift Lainnya */}
            {otherItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Shift Lainnya
                </p>
                <div className="space-y-3">
                  {otherItems.map(item => (
                    <ScheduleCard key={item.id} item={item} isActive={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SatpamLayout>
  );
}