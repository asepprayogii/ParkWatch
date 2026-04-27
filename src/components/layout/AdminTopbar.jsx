import { useAuth } from '../../store/AuthContext'

export default function AdminTopbar({ title }) {
  const { user } = useAuth()

  const initials = (user?.full_name?.charAt(0) || 'A').toUpperCase()

  return (
    <>
      <style>{`
        .pw-topbar {
          background: rgba(2, 18, 42, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(55, 138, 221, 0.18);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pw-topbar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent);
        }
      `}</style>

      <div className="pw-topbar fixed top-0 left-0 right-0 z-50 px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #185FA5, #06B6D4)',
              borderRadius: '8px',
              boxShadow: '0 0 12px rgba(6,182,212,0.3)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none" style={{ letterSpacing: '-0.3px' }}>ParkWatch</p>
            <p className="leading-none mt-0.5" style={{ color: 'rgba(176,210,255,0.5)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Admin</p>
          </div>
        </div>

        {/* Title — centered */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm text-white"
          style={{ letterSpacing: '-0.2px' }}
        >
          {title}
        </h1>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #185FA5, #22D3EE)',
            boxShadow: '0 0 10px rgba(34,211,238,0.25)',
          }}
        >
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
      </div>
    </>
  )
}
