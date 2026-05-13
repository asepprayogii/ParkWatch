import { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { MapPin, Clock, AlertCircle, ShieldCheck, Calendar, CheckCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    bg: 'bg-amber-100/60 dark:bg-amber-500/10',
    border: 'border-amber-200/60 dark:border-amber-500/20'
  },
  sore: { 
    label: 'Sore',
    time: '14:00 - 22:00',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100/60 dark:bg-orange-500/10',
    border: 'border-orange-200/60 dark:border-orange-500/20'
  },
  malam: { 
    label: 'Malam',
    time: '22:00 - 06:00',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100/60 dark:bg-indigo-500/10',
    border: 'border-indigo-200/60 dark:border-indigo-500/20'
  },
};

// ── AUTO DETECT ACTIVE SHIFT ──
function getCurrentShift() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 14) return 'pagi';
  if (hour >= 14 && hour < 22) return 'sore';
  return 'malam';
}

function isRosterActive(item) {
  const currentShift = getCurrentShift();
  return item.shift === currentShift;
}

// ── GLASS CARD ──
function GlassCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-[#242C3B] rounded-2xl border border-slate-200 dark:border-[#353F54] shadow-lg overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ── SCHEDULE CARD ──
function ScheduleCard({ item }) {
  const config = shiftConfig[item.shift] || shiftConfig.pagi;
  const isActive = isRosterActive(item);

  return (
    <GlassCard className={cn(
      "transition-all duration-300",
      isActive ? "ring-2 ring-green-500/50 shadow-lg shadow-green-500/10" : "opacity-75 hover:opacity-100"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Info */}
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
              isActive 
                ? "bg-gradient-to-br from-green-500 to-emerald-500" 
                : "bg-slate-200 dark:bg-[#353F54]"
            )}>
              <MapPin className={cn("w-6 h-6", isActive ? "text-white" : "text-slate-400")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {item.zones?.name || "Zona tidak diketahui"}
                </p>
                {isActive && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Sedang Bertugas
                  </motion.span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                  config.bg, config.color, config.border
                )}>
                  {config.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {config.time}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status Icon */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-100 dark:bg-[#353F54]"
          )}>
            {isActive ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Active Indicator Bar */}
        {isActive && (
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: "100%" }}
            className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 mt-3 rounded-full"
          />
        )}
      </div>
    </GlassCard>
  );
}

// ── MAIN COMPONENT ──
export default function SatpamJadwal() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({ active: true, history: false });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── FETCH SCHEDULE ──
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
        console.error("Fetch error:", fetchError);
        setError("Gagal memuat jadwal: " + fetchError.message);
        setJadwal([]);
        return;
      }

      setJadwal(data ?? []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJadwal(); }, [user?.id]);

  // ── REALTIME LISTENER ──
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

  // ── FILTER & GROUP ──
  const { active, history } = (() => {
    const activeItems = jadwal.filter(isRosterActive);
    const historyItems = jadwal.filter((j) => !isRosterActive(j));
    return { active: activeItems, history: historyItems };
  })();

  const stats = {
    total: jadwal.length,
    active: active.length,
    completed: history.length,
  };

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentShift = getCurrentShift();

  return (
    <SatpamLayout title="Jadwal Tugas">
      <div className="w-full min-w-0 space-y-6 pb-10 px-2 md:px-4 lg:px-6">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
              <Calendar className="w-6 h-6 text-[#37B6E9]" />
            </span>
            Jadwal Penugasan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Lihat dan kelola jadwal tugas Anda
          </p>
        </motion.div>

        {/* Current Shift Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-800 rounded-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-bold text-green-700 dark:text-green-300">
            Shift Aktif: {shiftConfig[currentShift].label}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">
            ({shiftConfig[currentShift].time})
          </span>
        </motion.div>

        {/* Stats Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="p-4 bg-gradient-to-r from-[#37B6E9]/10 to-[#4B4CED]/10 dark:from-[#37B6E9]/20 dark:to-[#4B4CED]/20 border-[#37B6E9]/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              </div>
              <div>
                <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.active}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-500 dark:text-slate-400">{stats.completed}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Error</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Active Section */}
        <div>
          <button
            onClick={() => toggleSection("active")}
            className="w-full flex items-center justify-between p-3 mb-3 bg-slate-50 dark:bg-[#222834] rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a3142] transition"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Penugasan Aktif</span>
              {active.length > 0 && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">{active.length}</span>
              )}
            </div>
            <ChevronDown 
              size={16} 
              className={cn("text-slate-400 transition-transform", expanded.active ? 'rotate-180' : '')} 
            />
          </button>

          <AnimatePresence initial={false}>
            {expanded.active && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                {loading ? (
                  <GlassCard className="h-28 animate-pulse" />
                ) : active.length === 0 ? (
                  <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Belum ada penugasan aktif</p>
                    <p className="text-slate-400 text-sm mt-1">Hubungi admin untuk di-assign ke zona</p>
                  </GlassCard>
                ) : (
                  active.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Section */}
        <div>
          <button
            onClick={() => toggleSection("history")}
            className="w-full flex items-center justify-between p-3 mb-3 bg-slate-50 dark:bg-[#222834] rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a3142] transition"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Riwayat Penugasan</span>
              {history.length > 0 && (
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-[#353F54] text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full">{history.length}</span>
              )}
            </div>
            <ChevronDown 
              size={16} 
              className={cn("text-slate-400 transition-transform", expanded.history ? 'rotate-180' : '')} 
            />
          </button>

          <AnimatePresence initial={false}>
            {expanded.history && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <GlassCard key={i} className="h-24 animate-pulse" />)}
                  </div>
                ) : history.length === 0 ? (
                  <GlassCard className="p-6 text-center text-slate-400 text-sm">
                    Belum ada riwayat penugasan
                  </GlassCard>
                ) : (
                  history.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Card */}
        <GlassCard className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Informasi</p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1 list-disc list-inside">
                <li>Penugasan aktif ditentukan otomatis berdasarkan shift dan waktu saat ini</li>
                <li>Shift pagi: 06:00 - 14:00, Sore: 14:00 - 22:00, Malam: 22:00 - 06:00</li>
                <li>Hubungi admin jika terdapat ketidaksesuaian jadwal</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </SatpamLayout>
  );
}