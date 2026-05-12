import { useState } from 'react'
import { useTheme } from '../../store/ThemeContext'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Topbar from './Topbar'
import PageTransition from '../ui/PageTransition'

export default function UserLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { theme } = useTheme()

  return (
    <div
      className="min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{
        background: theme === 'dark' ? '#222834' : '#f8fafc',
        color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Sidebar — desktop only */}
      <Sidebar onCollapse={setCollapsed} />

      {/* Topbar — mobile only */}
      <div className="md:hidden">
        <Topbar title={title} />
      </div>

      {/* Main Content */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: 0,
          paddingTop: 0,
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .user-main-wrap {
              margin-left: ${collapsed ? '64px' : '224px'};
            }
          }
          .user-main-wrap {
            transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
            min-width: 0;
            width: auto;
          }
        `}</style>

        <main className="user-main-wrap pt-14 pb-24 px-4 md:pt-8 md:pb-8 md:px-6 min-w-0">
          {/* Desktop page title */}
          <div className="hidden md:flex items-start justify-between mb-6">
            <div>
              <h1
                className="text-xl font-bold transition-colors duration-300"
                style={{
                  color: theme === 'dark' ? '#fff' : '#0f172a',
                  letterSpacing: '-0.4px',
                }}
              >
                {title}
              </h1>
              <div
                className="mt-1.5 h-0.5 w-10 rounded-full"
                style={{ background: 'linear-gradient(90deg, #185FA5, #22D3EE)' }}
              />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      {/* Bottom Nav — mobile only */}
      <BottomNav />
    </div>
  )
}