import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Zap, 
  BarChart3, 
  MapPin, 
  Camera, 
  Bell, 
  CheckCircle2, 
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";

const features = [
  {
    icon: Camera,
    title: "AI Plate Recognition",
    description: "Scan plat nomor kendaraan secara otomatis menggunakan teknologi OCR berbasis AI yang akurat.",
    color: "from-[#37B6E9] to-blue-500"
  },
  {
    icon: Bell,
    title: "Real-time Alerts",
    description: "Notifikasi instan untuk petugas keamanan saat ada laporan pelanggaran di zona mereka.",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Pantau tren parkir dan efektivitas petugas melalui dashboard analitik yang komprehensif.",
    color: "from-[#4B4CED] to-indigo-600"
  },
  {
    icon: Shield,
    title: "Secure & Verified",
    description: "Sistem pelaporan terverifikasi untuk memastikan setiap tindakan didasarkan pada bukti nyata.",
    color: "from-emerald-400 to-teal-500"
  }
];

const steps = [
  {
    title: "Laporkan",
    description: "Ambil foto kendaraan yang melanggar aturan parkir.",
    icon: Camera
  },
  {
    title: "Verifikasi",
    description: "Sistem mendeteksi plat dan petugas memverifikasi lokasi.",
    icon: Shield
  },
  {
    title: "Tindakan",
    description: "Petugas segera menuju lokasi untuk memberikan sanksi.",
    icon: Zap
  }
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Global Styles for Branding Consistency */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(55,182,233,0.3); }
          50%       { box-shadow: 0 0 40px rgba(55,182,233,0.6); }
        }
        .logo-glow {
          animation: glowPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Navbar */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="logo-glow w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
              <img src="/logo.webp" alt="ParkWatch" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Park</span>
              <span className="text-blue-400">Watch</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-[#37B6E9] transition">Fitur</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-[#37B6E9] transition">Cara Kerja</a>
            <Link to="/login">
              <Button 
                variant="ghost" 
                className="text-sm font-bold border border-white/10 hover:bg-white/5 text-white transition-all duration-300"
              >
                Masuk
              </Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm font-bold bg-[#37B6E9] hover:bg-[#37B6E9]/90 shadow-lg shadow-[#37B6E9]/20">Daftar Sekarang</Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isMobileMenuOpen ? { x: 0 } : { x: "100%" }}
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0f172a] z-[60] border-l border-white/5 p-8 md:hidden"
      >
        <div className="flex justify-end mb-8">
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2"><X /></button>
        </div>
        <div className="flex flex-col gap-6">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold">Fitur</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold">Cara Kerja</a>
          <hr className="border-white/10" />
          <Link to="/login">
            <Button 
              variant="ghost" 
              fullWidth 
              className="py-4 text-lg border border-white/10 hover:bg-white/5 text-white transition-all duration-300"
            >
              Masuk
            </Button>
          </Link>
          <Link to="/register">
            <Button fullWidth className="py-4 text-lg bg-[#37B6E9]">Daftar Sekarang</Button>
          </Link>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                AI-Powered Parking Management
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                Monitor Parkir <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#37B6E9] to-[#4B4CED]">
                  Lebih Pintar.
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed">
                Transformasi manajemen parkir dengan sistem pemantauan real-time, deteksi plat nomor otomatis, dan koordinasi petugas yang efisien.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 py-4 bg-[#37B6E9] hover:bg-[#37B6E9]/90 text-lg shadow-xl shadow-[#37B6E9]/20 group">
                    Mulai Sekarang
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto px-8 py-4 text-lg border border-white/10 hover:bg-white/5">
                    Pelajari Fitur
                  </Button>
                </a>
              </div>
              
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#37B6E9]/20 to-[#4B4CED]/20 blur-[60px] rounded-3xl" />
              <div className="relative bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 shadow-2xl overflow-hidden">
                <img 
                  src="/logo.webp" 
                  alt="ParkWatch Preview" 
                  className="w-full h-auto rounded-2xl opacity-80"
                />
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 -left-6 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status Petugas</p>
                      <p className="text-sm text-white font-bold">Patroli Aktif</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 -right-6 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Bell className="text-blue-500 w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laporan Baru</p>
                      <p className="text-sm text-white font-bold">Zona A-2 Terdeteksi</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-blue-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">Fitur Unggulan</h2>
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6">Dilengkapi Teknologi Mutakhir</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              Kami menggabungkan AI dan manajemen data real-time untuk memberikan solusi parkir terbaik bagi institusi Anda.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="group relative p-8 bg-slate-800/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-500/20 transition-all pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-blue-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">Proses Kerja</h2>
              <h3 className="text-3xl md:text-5xl font-black text-white mb-8">Sesederhana 1, 2, 3...</h3>
              <div className="space-y-12">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xl font-black text-[#37B6E9]">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#37B6E9]/10 blur-[100px] rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[40px] p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Camera className="text-white w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-white">Scan Plat Nomor</span>
                    </div>
                    <span className="text-xs text-blue-400 font-bold">OTOMATIS</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Deteksi AI</span>
                      <CheckCircle2 className="text-emerald-500 w-4 h-4" />
                    </div>
                    <p className="text-2xl font-black text-white tracking-widest">B 1234 XYZ</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-blue-500 w-5 h-5" />
                      <span className="text-sm font-medium text-blue-100">Lokasi: Zona Gedung Utama (B-1)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-[#37B6E9] to-[#4B4CED] rounded-[48px] p-12 lg:p-20 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
                Siap Menjaga Ketertiban <br /> Parkir Anda?
              </h2>
              <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto font-medium">
                Bergabunglah dengan ribuan pengguna lainnya dan mulai ciptakan lingkungan parkir yang lebih tertib dan aman hari ini.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-10 py-5 bg-white text-[#0f172a] hover:bg-slate-100 text-lg font-black shadow-2xl">
                    Daftar Sekarang — Gratis
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto px-10 py-5 text-white border-2 border-white/20 hover:bg-white/10 text-lg font-black">
                    Masuk ke Sistem
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-white/10">
                <img src="/logo.webp" alt="ParkWatch" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">Park</span>
                <span className="text-blue-400">Watch</span>
              </span>
            </div>
            
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} ParkWatch Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
