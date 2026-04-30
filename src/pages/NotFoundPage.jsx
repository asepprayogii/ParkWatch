import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[160px] font-extrabold text-slate-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-500 text-sm mb-8">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition text-sm active:scale-95"
          >
            ← Kembali ke Halaman Sebelumnya
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-xl transition text-sm active:scale-95"
          >
            Ke Beranda
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-8">ParkWatch © 2026</p>
      </div>
    </div>
  )
}
