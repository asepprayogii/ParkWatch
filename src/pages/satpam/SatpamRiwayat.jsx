// src/pages/satpam/SatpamRiwayat.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../lib/supabase";
import SatpamLayout from "../../components/layout/SatpamLayout";
import { Search, MapPin, Clock, CheckCircle, Activity, AlertTriangle, Filter, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/60 dark:bg-amber-500/10",
    border: "border-amber-200/60 dark:border-amber-500/20",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "Diproses",
    color: "text-blue-600 dark:text-[#37B6E9]",
    bg: "bg-blue-100/60 dark:bg-[#37B6E9]/10",
    border: "border-blue-200/60 dark:border-[#37B6E9]/20",
    icon: Activity,
  },
  resolved: {
    label: "Selesai",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/60 dark:bg-emerald-500/10",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    icon: CheckCircle,
  },
};

// ── GLASS CARD ──
function GlassCard({ children, className, hover = true, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] shadow-xl rounded-[20px] overflow-hidden transition-all duration-300",
        hover && "hover:shadow-2xl cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ── HISTORY CARD ──
function HistoryCard({ report, onClick }) {
  const status = statusConfig[report.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const isResolved = report.status === "resolved";

  return (
    <GlassCard hover={true} onClick={onClick} className="group">
      <div className="p-4 flex items-start gap-4">
        {/* Photo / Icon */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-[#222834] border border-slate-200 dark:border-[#353F54]">
          {report.photo_url ? (
            <>
              <img src={report.photo_url} alt="laporan" className="w-full h-full object-cover" />
              {isResolved && report.evidence_photo_url && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle size={10} className="text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <StatusIcon className={cn("w-7 h-7", status.color)} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="bg-slate-900 dark:bg-[#1a1f2e] text-white font-mono text-xs px-2.5 py-1 rounded-lg tracking-wider">
              {report.plate_number ?? "?????"}
            </div>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              status.bg, status.color, status.border
            )}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={12} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {report.zones?.name ?? "Zona tidak diketahui"}
            </span>
          </div>

          {report.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
              {report.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(report.created_at)}
            </span>
            {isResolved && report.evidence_photo_url && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={12} /> Ada bukti
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#37B6E9] transition-colors shrink-0 mt-2" />
      </div>
    </GlassCard>
  );
}

// ── MAIN COMPONENT ──
export default function SatpamRiwayat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchRiwayat = async () => {
    if (!user?.id) return;
    try {
      // Ambil zona yang pernah/tengah dijaga satpam
      const { data: rosterData } = await supabase
        .from("roster")
        .select("zone_id")
        .eq("satpam_id", user.id);

      if (!rosterData?.length) {
        setReports([]);
        return;
      }

      const zoneIds = [...new Set(rosterData.map((r) => r.zone_id))];
      let query = supabase
        .from("reports")
        .select("*, users(full_name), zones(name)")
        .in("zone_id", zoneIds)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data } = await query;
      setReports(data ?? []);
    } catch (err) {
      console.error("Fetch riwayat error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [user?.id, filterStatus]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("satpam-riwayat-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reports",
        filter: `satpam_id=eq.${user.id}` // Simplified; adjust if needed
      }, fetchRiwayat)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchRiwayat, user?.id]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.plate_number?.toLowerCase().includes(q) ||
        r.zones?.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    in_progress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  }), [reports]);

  return (
    <SatpamLayout title="Riwayat Penanganan">
      <div className="w-full min-w-0 space-y-6 pb-10 px-2 md:px-4 lg:px-6">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              Riwayat Tugas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Pantau semua laporan yang telah kamu tangani
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-[#222834]" },
            { label: "Menunggu", value: stats.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/60 dark:bg-amber-500/10" },
            { label: "Diproses", value: stats.in_progress, color: "text-blue-600 dark:text-[#37B6E9]", bg: "bg-blue-100/60 dark:bg-[#37B6E9]/10" },
            { label: "Selesai", value: stats.resolved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100/60 dark:bg-emerald-500/10" },
          ].map((s) => (
            <GlassCard key={s.label} hover={false} className={cn("p-3 text-center", s.bg)}>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <GlassCard hover={false} className="p-1.5 flex items-center gap-2">
            <div className="p-2 bg-[#37B6E9]/10 dark:bg-[#37B6E9]/20 rounded-xl">
              <Search className="w-4 h-4 text-[#37B6E9]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari plat nomor, zona, atau deskripsi..."
              className="flex-1 bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none py-2"
            />
          </GlassCard>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: "all", label: "Semua" },
              { key: "pending", label: "Menunggu" },
              { key: "in_progress", label: "Diproses" },
              { key: "resolved", label: "Selesai" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2",
                  filterStatus === f.key
                    ? "bg-[#37B6E9] text-white shadow-lg shadow-[#37B6E9]/25"
                    : "bg-white dark:bg-[#242C3B] border border-slate-200 dark:border-[#353F54] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2a3142]"
                )}
              >
                {f.key !== "all" && <Filter size={12} />}
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <GlassCard key={i} hover={false} className="h-24 animate-pulse" />)}
          </div>
        ) : filteredReports.length === 0 ? (
          <GlassCard hover={false} className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#222834] dark:to-[#242C3B] rounded-3xl flex items-center justify-center mb-5">
              <Activity className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-black text-lg mb-1">
              {search ? "Tidak ada hasil" : "Belum ada riwayat"}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
              {search ? `Tidak ditemukan untuk "${search}"` : "Laporan di zona kamu akan muncul di sini"}
            </p>
          </GlassCard>
        ) : (
          <motion.div className="flex flex-col gap-3 w-full min-w-0" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
            {filteredReports.map((report, idx) => (
              <motion.div key={report.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: idx * 0.02 }}>
                <HistoryCard report={report} onClick={() => navigate(`/satpam/report-detail/${report.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </SatpamLayout>
  );
}