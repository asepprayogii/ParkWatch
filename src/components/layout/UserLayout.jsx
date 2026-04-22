import Topbar from './Topbar'
import BottomNav from './BottomNav'

export default function UserLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title={title} />
      <main className="pt-14 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}