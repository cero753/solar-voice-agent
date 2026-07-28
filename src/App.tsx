import { NavLink, Outlet } from 'react-router-dom'

function tab({ isActive }: { isActive: boolean }) {
  return [
    'rounded-lg px-4 py-2 text-sm font-medium transition',
    isActive ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-800',
  ].join(' ')
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="text-xl">☀️</span> SolarVoice
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={tab}>
              Advisor
            </NavLink>
            <NavLink to="/leads" className={tab}>
              Leads
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
