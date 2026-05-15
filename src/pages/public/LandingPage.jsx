import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Menu,
  X,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";

const features = [
  {
    icon: Camera,
    title: "Deteksi Plat Nomor AI",
    description: "Algoritma cerdas yang secara otomatis mengenali plat nomor kendaraan dari foto pelaporan dengan akurasi tinggi.",
    color: "from-[#37B6E9] to-blue-500"
  },
  {
    icon: Bell,
    title: "Notifikasi Instan",
    description: "Sistem koordinasi real-time yang langsung menghubungkan laporan Anda ke petugas keamanan di zona terdekat.",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: BarChart3,
    title: "Analitik Strategis",
    description: "Dashboard komprehensif untuk memantau tren pelanggaran dan efektivitas penanganan di seluruh area.",
    color: "from-[#4B4CED] to-indigo-600"
  },
  {
    icon: Shield,
    title: "Validasi Terpadu",
    description: "Setiap tindakan didasarkan pada bukti digital yang sah, termasuk foto, lokasi GPS, dan timestamp yang akurat.",
    color: "from-emerald-400 to-teal-500"
  }
];

const steps = [
  {
    title: "Dokumentasikan",
    description: "Temukan parkir liar? Ambil foto melalui aplikasi untuk memulai proses pelaporan otomatis.",
    icon: Camera
  },
  {
    title: "Koordinasi",
    description: "Sistem secara otomatis meneruskan detail laporan ke petugas yang berjaga di zona tersebut.",
    icon: Bell
  },
  {
    title: "Resolusi",
    description: "Petugas melakukan tindakan di lapangan dan memperbarui status laporan hingga selesai.",
    icon: CheckCircle2
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
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 selection:bg-[#37B6E9]/30 selection:text-white overflow-x-hidden">
      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 6s ease-in-out infinite; animation-delay: 2s; }
      `}</style>

      {/* Navbar */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-[#0B1120]/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg shadow-black/20" 
            : "bg-transparent py-4 md:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shadow-lg group-hover:border-[#37B6E9]/50 transition-colors">
              <img src="/logo.webp" alt="ParkWatch" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Park<span className="text-[#37B6E9]">Watch</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition">Fitur</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition">Cara Kerja</a>
            <div className="h-6 w-px bg-white/10" />
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-bold text-white hover:text-[#37B6E9] transition">
                Masuk
              </Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm font-bold bg-[#37B6E9] hover:bg-[#37B6E9]/90 text-white shadow-lg shadow-[#37B6E9]/25">
                Daftar Gratis
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0B1120]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <span className="text-lg font-bold text-white">Park<span className="text-[#37B6E9]">Watch</span></span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white" aria-label="Close menu">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 p-6">
              <motion.a 
                href="#features" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-2xl font-bold text-white hover:text-[#37B6E9] transition py-2"
              >
                Fitur
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-2xl font-bold text-white hover:text-[#37B6E9] transition py-2"
              >
                Cara Kerja
              </motion.a>
              <div className="w-full max-w-xs mt-4 space-y-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" fullWidth className="py-3.5 text-base border border-white/10 text-white">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button fullWidth className="py-3.5 text-base bg-[#37B6E9] text-white shadow-xl shadow-[#37B6E9]/20">
                    Daftar Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Optimized for all screens */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
        {/* Background Gradients - Responsive sizes */}
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] bg-[#37B6E9]/15 blur-[80px] lg:blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-[#4B4CED]/15 blur-[80px] lg:blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-12 lg:pt-20 lg:pb-0">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#37B6E9]/10 border border-[#37B6E9]/20 text-[#37B6E9] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#37B6E9] rounded-full animate-pulse" />
                Sistem Monitoring Parkir Terpadu
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.15] mb-4 sm:mb-6">
                Wujudkan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#37B6E9] via-blue-500 to-[#4B4CED]">Ketertiban</span> <br className="hidden sm:block" />
                Area Parkir Anda.
              </h1>
              
              <p className="text-sm sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed">
                Platform pelaporan parkir liar yang menghubungkan pelapor dengan petugas secara real-time melalui integrasi kecerdasan buatan.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-sm mx-auto lg:max-w-none lg:justify-start">
                <Link to="/register" className="w-full sm:w-auto group">
                  <Button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#37B6E9] hover:bg-[#37B6E9]/90 text-white text-base sm:text-lg font-bold shadow-xl shadow-[#37B6E9]/25 flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02]">
                    Laporkan Pelanggaran
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg border border-white/10 hover:bg-white/5 text-white font-medium">
                    Pelajari Mekanisme
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Hero Visual - Hidden on mobile, shown on lg */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block w-full"
            >
              <div className="relative z-10 animate-float">
                {/* Main Card */}
                <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 shadow-2xl shadow-black/50">
                  <div className="bg-[#0F172A] rounded-[24px] overflow-hidden border border-white/5 aspect-video relative">
                    {/* Mock UI Header */}
                    <div className="h-12 border-b border-white/5 flex items-center px-6 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                      <div className="ml-auto w-24 h-2 bg-white/5 rounded-full" />
                    </div>
                    {/* Mock UI Body */}
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="col-span-1 bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-xs text-slate-500 mb-2">Zona Aktif</div>
                        <div className="text-2xl font-bold text-white">12 / 15</div>
                        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[80%] bg-[#37B6E9]" />
                        </div>
                      </div>
                      <div className="col-span-1 bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-xs text-slate-500 mb-2">Laporan Hari Ini</div>
                        <div className="text-2xl font-bold text-[#37B6E9]">48</div>
                        <div className="flex gap-1 mt-2">
                          {[1,2,3,4].map(i => <div key={i} className="h-8 w-2 bg-[#4B4CED]/50 rounded-sm" />)}
                        </div>
                      </div>
                      <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/5 h-24 flex items-center justify-center">
                         <div className="text-center">
                           <MapPin className="w-6 h-6 text-[#37B6E9] mx-auto mb-2" />
                           <div className="text-xs text-slate-500">Monitoring Real-time Aktif</div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute top-20 -left-12 z-20 animate-float-delay"
              >
                <div className="bg-[#1E293B] border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                    <p className="text-sm text-white font-bold">Patroli Aktif</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute bottom-16 -right-8 z-20 animate-float"
              >
                <div className="bg-[#1E293B] border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#37B6E9]/20 rounded-xl flex items-center justify-center">
                    <Bell className="text-[#37B6E9] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Notifikasi</p>
                    <p className="text-sm text-white font-bold">Pelanggaran Zona A-2</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll down indicator - mobile only */}
        <motion.a
          href="#features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 lg:hidden z-10"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.a>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#0B1120] relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="text-center max-w-3xl mx-auto mb-12 sm:mb-20"
          >
            <motion.span variants={itemVariants} className="text-[#37B6E9] text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-4 block">Ekosistem ParkWatch</motion.span>
            <motion.h2 variants={itemVariants} className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-6">Solusi Monitoring Terintegrasi</motion.h2>
            <motion.p variants={itemVariants} className="text-slate-400 text-sm sm:text-lg leading-relaxed">
              Kami menghadirkan sinergi antara teknologi kecerdasan buatan dan pengawasan lapangan untuk hasil yang maksimal.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="group relative p-5 sm:p-6 md:p-8 bg-white/[0.03] border border-white/5 rounded-2xl sm:rounded-3xl hover:bg-white/[0.06] hover:border-[#37B6E9]/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-[#37B6E9] transition-colors">{feature.title}</h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works - Mobile Optimized */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden scroll-mt-20">
        {/* Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] bg-[#4B4CED]/5 blur-[60px] lg:blur-[100px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
            <div className="w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B4CED]/10 border border-[#4B4CED]/20 text-[#4B4CED] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
                Cara Kerja
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 sm:mb-8 lg:mb-10">Semudah 3 Langkah</h2>
              
              <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 sm:gap-6 group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-base sm:text-xl font-black text-[#37B6E9] group-hover:border-[#37B6E9] group-hover:shadow-lg group-hover:shadow-[#37B6E9]/20 transition-all">
                        {idx + 1}
                      </div>
                      {idx !== steps.length - 1 && (
                        <div className="absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 sm:h-10 lg:h-12 bg-white/5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-[#37B6E9] transition-colors">{step.title}</h4>
                      <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual / Phone Mockup - Responsive */}
            <div className="relative flex justify-center w-full max-w-xs sm:max-w-sm mx-auto lg:max-w-none">
              <div className="relative w-full aspect-[3/5] max-h-[400px] sm:max-h-[450px] lg:h-[500px] bg-[#0B1120] rounded-[30px] sm:rounded-[40px] border-3 sm:border-4 border-slate-800 shadow-2xl overflow-hidden">
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 sm:h-8 bg-slate-800 rounded-b-xl sm:rounded-b-2xl z-20 flex justify-center">
                  <div className="w-12 sm:w-16 h-3 sm:h-4 bg-black rounded-b-lg sm:rounded-b-xl" />
                </div>
                
                {/* Screen Content */}
                <div className="p-4 sm:p-6 pt-10 sm:pt-12 h-full bg-[#1E293B] flex flex-col">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10" />
                    <div className="text-[10px] sm:text-xs font-bold text-white">Notifikasi</div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10" />
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#37B6E9]/20 flex items-center justify-center shrink-0">
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-[#37B6E9]" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-bold text-white mb-0.5 sm:mb-1">Pelanggaran Terdeteksi</div>
                          <div className="text-[8px] sm:text-[10px] text-slate-400">B 1234 XYZ • Zona A</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5 opacity-50">
                       <div className="flex gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-bold text-white mb-0.5 sm:mb-1">Laporan Selesai</div>
                          <div className="text-[8px] sm:text-[10px] text-slate-400">D 9876 ABC • Zona B</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="h-14 sm:h-20 bg-gradient-to-t from-[#37B6E9] to-[#4B4CED] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <Bell className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                      <div className="text-white">
                        <div className="text-[10px] sm:text-xs font-bold">3 Laporan Baru</div>
                        <div className="text-[8px] sm:text-[10px] opacity-80">Tap untuk lihat detail</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#37B6E9] to-[#4B4CED] rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] p-6 sm:p-8 md:p-12 lg:p-20 overflow-hidden text-center shadow-2xl shadow-blue-500/10">
            {/* Decorative Circles - Responsive */}
            <div className="absolute top-[-30px] right-[-30px] w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] lg:w-[300px] lg:h-[300px] bg-white/10 blur-[40px] sm:blur-[50px] lg:blur-[60px] rounded-full" />
            <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] lg:w-[300px] lg:h-[300px] bg-black/10 blur-[40px] sm:blur-[50px] lg:blur-[60px] rounded-full" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6 lg:mb-8 leading-tight">
                Wujudkan <br className="hidden sm:block" /> Ketertiban Area.
              </h2>
              <p className="text-white/80 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 lg:mb-12 max-w-2xl mx-auto font-medium">
                Bergabunglah dengan ribuan pengguna lainnya dalam menciptakan lingkungan yang lebih tertib, aman, dan terorganisir mulai hari ini.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 bg-white text-[#0B1120] hover:bg-slate-100 text-base sm:text-lg font-black shadow-2xl">
                    Daftar Gratis
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 text-white border-2 border-white/20 hover:bg-white/10 text-base sm:text-lg font-black">
                    Masuk Sistem
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="py-8 sm:py-10 md:py-12 border-t border-white/5 bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-white/10">
                <img src="/logo.webp" alt="ParkWatch" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                Park<span className="text-[#37B6E9]">Watch</span>
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500">
              <div className="flex items-center gap-4 sm:gap-6">
                <a href="#" className="hover:text-[#37B6E9] transition">Privacy</a>
                <a href="#" className="hover:text-[#37B6E9] transition">Terms</a>
              </div>
              <span>&copy; {new Date().getFullYear()} ParkWatch Systems.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}