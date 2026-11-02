import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FolderKanban, Terminal, Files, History, Settings, Menu, Search, Sun, Moon, GitBranch } from 'lucide-react'
import { useUI } from '../store'
import { useAuth } from '../authStore'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'AI Accounts', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/workspace', label: 'Workspace', icon: Terminal },
  { to: '/files', label: 'File Manager', icon: Files },
  { to: '/activity', label: 'Activity History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useUI()
  const user = useAuth(s => s.user)
  const mode = !supabase ? 'Offline Mode' : user ? 'Connected' : 'Chưa đăng nhập'
  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-6 text-lg font-bold tracking-tight">AI <span className="text-brand">HUB</span></div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand/10 font-medium text-brand' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className="md:pl-60">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button className="btn md:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input placeholder="Tìm kiếm…" className="w-full rounded-lg border border-slate-300 bg-transparent py-2 pl-9 pr-3 text-sm dark:border-slate-700" />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 lg:inline">Project: <b>—</b></span>
            <span className="flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs dark:border-slate-700">
              <GitBranch size={12} /> GitHub: chưa kết nối · {mode}
            </span>
            <button className="btn" onClick={toggleTheme} aria-label="Đổi giao diện">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
