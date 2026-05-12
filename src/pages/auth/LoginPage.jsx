import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../services/auth'
import { useAuth } from '../../store/AuthContext'

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    title: 'Deteksi Plat',
    desc: 'AI baca plat otomatis'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Manajemen Parkir',
    desc: 'Kelola zona dan petugas'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Laporan & Statistik',
    desc: 'Pantau data real-time'
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger animasi setelah komponen mount
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      const { getCurrentUser } = await import('../../services/auth')
      const profile = await getCurrentUser()
      if (profile.role === 'admin') navigate('/admin/dashboard')
      else if (profile.role === 'satpam') navigate('/satpam/dashboard')
      else navigate('/user/feed')
    } catch (err) {
      setError(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
  }

  return (
    <>
      <style>{`
        @keyframes bgZoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.3); }
          50%       { box-shadow: 0 0 40px rgba(37,99,235,0.6); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bg-zoom {
          animation: bgZoom 1.8s cubic-bezier(.4,0,.2,1) forwards;
        }
        .anim-logo {
          animation: fadeDown 0.7s cubic-bezier(.4,0,.2,1) forwards;
        }
        .anim-form {
          animation: fadeUp 0.8s cubic-bezier(.4,0,.2,1) 0.2s both;
        }
        .anim-feature-1 {
          animation: slideRight 0.6s cubic-bezier(.4,0,.2,1) 0.3s both;
        }
        .anim-feature-2 {
          animation: slideRight 0.6s cubic-bezier(.4,0,.2,1) 0.45s both;
        }
        .anim-feature-3 {
          animation: slideRight 0.6s cubic-bezier(.4,0,.2,1) 0.6s both;
        }
        .anim-left-title {
          animation: slideRight 0.7s cubic-bezier(.4,0,.2,1) 0.15s both;
        }
        .anim-overlay {
          animation: fadeIn 1s ease forwards;
        }
        .float-card {
          animation: floatCard 4s ease-in-out infinite;
        }
        .logo-glow {
          animation: glowPulse 3s ease-in-out infinite;
        }
        .btn-shimmer {
          background: linear-gradient(135deg, #2563EB 0%, #3b82f6 40%, #1d4ed8 60%, #2563EB 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .btn-shimmer:hover {
          animation: shimmer 1.5s linear infinite;
        }
        .input-focus:focus {
          border-color: rgba(59,130,246,0.6) !important;
          background: rgba(59,130,246,0.08) !important;
        }
        .feature-card {
          transition: transform 0.2s, background 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.12) !important;
        }
      `}</style>

      <div className="min-h-screen flex relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Background dengan animasi zoom */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={mounted ? 'bg-zoom' : ''}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: "url('/bg-parking.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Overlay gradient */}
        <div
          className="absolute inset-0 anim-overlay"
          style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(5,15,35,0.8) 100%)' }}
        />

        {/* Particle dots dekoratif */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${[3,4,2,5,3,4][i]}px`,
                height: `${[3,4,2,5,3,4][i]}px`,
                background: 'rgba(59,130,246,0.4)',
                left: `${[15,35,60,75,85,50][i]}%`,
                top: `${[20,60,15,45,75,35][i]}%`,
                animation: `floatCard ${[4,5,3.5,6,4.5,5.5][i]}s ease-in-out infinite`,
                animationDelay: `${[0,1,0.5,1.5,0.8,2][i]}s`,
              }}
            />
          ))}
        </div>

        {/* ── MOBILE LAYOUT ── */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-10 md:hidden">

          {/* Logo */}
          <div className={`flex flex-col items-center mb-8 ${mounted ? 'anim-logo' : 'opacity-0'}`}>
            <div className="logo-glow rounded-2xl mb-3 p-1">
              <img src="/logo.png" alt="ParkWatch" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-white">Park</span>
              <span className="text-blue-400">Watch</span>
            </h1>
            <p className="text-slate-300 text-sm mt-1">Pantau. Amankan. Kendaraan Anda.</p>
          </div>

          {/* Card */}
          <div
            className={`w-full max-w-sm rounded-2xl p-6 float-card ${mounted ? 'anim-form' : 'opacity-0'}`}
            style={{
              background: 'rgba(10, 18, 42, 0.82)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
            }}
          >
            <h2 className="text-xl font-bold text-white mb-1">Selamat Datang</h2>
            <p className="text-slate-400 text-sm mb-6">Masuk untuk melanjutkan</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><UserIcon /></div>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Username atau Email" required
                  className="input-focus w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
                  style={inputStyle} />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><LockIcon /></div>
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="Password" required
                  className="input-focus w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
                  style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm text-slate-300">Ingat saya</span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="btn-shimmer w-full py-3 rounded-xl text-white font-bold text-sm transition active:scale-95 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </span>
                ) : 'Masuk'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-slate-400 text-sm">
                Belum punya akun?{' '}
                <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="relative z-10 hidden md:flex w-full">

          {/* Kiri */}
          <div className="flex-1 flex flex-col justify-between p-12">
            <div className={mounted ? 'anim-logo' : 'opacity-0'}>
              <div className="flex items-center gap-3 mb-16">
                <div className="logo-glow rounded-xl p-1">
                  <img src="/logo.png" alt="ParkWatch" className="w-10 h-10 object-contain" />
                </div>
                <span className="text-2xl font-bold">
                  <span className="text-white">Park</span>
                  <span className="text-blue-400">Watch</span>
                </span>
              </div>
              <div className="anim-left-title">
                <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
                  Sistem Monitoring<br />
                  <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Parkir Cerdas
                  </span>
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Pantau, kelola, dan amankan area parkir<br />Anda secara real-time dengan AI.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="flex gap-4">
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className={`feature-card flex flex-col gap-2 p-4 rounded-2xl flex-1 anim-feature-${idx + 1}`}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="text-blue-400">{f.icon}</div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-slate-400 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan — Form */}
          <div className={`w-[420px] flex items-center justify-center p-8 ${mounted ? 'anim-form' : 'opacity-0'}`}>
            <div
              className="w-full rounded-2xl p-8 float-card"
              style={{
                background: 'rgba(8, 15, 35, 0.88)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15)',
              }}
            >
              {/* Logo desktop */}
              <div className="flex flex-col items-center mb-5">
                <div className="logo-glow rounded-2xl p-1 mb-2">
                  <img src="/logo.png" alt="ParkWatch" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Parkir</span>
                  <span className="text-blue-400">Watch</span>
                </h1>
                <p className="text-slate-400 text-xs mt-1">Sistem Monitoring Parkir</p>
              </div>

              <div className="border-t mb-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

              <h2 className="text-xl font-bold text-white mb-1">Selamat Datang</h2>
              <p className="text-slate-400 text-sm mb-5">Silakan masuk ke akun Anda</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><UserIcon /></div>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="Username atau Email" required
                    className="input-focus w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><LockIcon /></div>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                    placeholder="Password" required
                    className="input-focus w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <span className="text-sm text-slate-300">Ingat saya</span>
                  </label>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-shimmer w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 disabled:opacity-50 transition">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : 'Masuk'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-slate-400 text-sm">
                  Belum punya akun?{' '}
                  <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition">
                    Daftar sekarang
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}