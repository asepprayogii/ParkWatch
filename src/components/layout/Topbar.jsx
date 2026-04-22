import { useAuth } from '../../store/AuthContext'

export default function Topbar({ title }) {
  const { user } = useAuth()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="font-bold text-slate-800 text-sm">ParkWatch</span>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-slate-700 text-sm">
        {title}
      </h1>

      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-600">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </span>
      </div>
    </div>
  )
}