import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Files, Folder, History, LayoutGrid, Menu, Moon, Settings, SquarePen, Sun, UserRound, X } from 'lucide-react'
import { useUI } from '../store'
import { useAuth } from '../authStore'

const NAV = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/accounts', label: 'Tài khoản AI', icon: UserRound },
  { to: '/projects', label: 'Dự án', icon: Folder },
  { to: '/workspace', label: 'Làm việc', icon: SquarePen },
  { to: '/files', label: 'Tệp', icon: Files },
  { to: '/activity', label: 'Lịch sử', icon: History },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useUI()
  const user = useAuth(s => s.user)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-line bg-paper px-3 md:hidden">
        <button className="btn btn-icon btn-ghost" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu size={18} /></button>
        <span className="font-semibold tracking-tight">AI HUB</span>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-line bg-paper px-3 py-4 transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center px-2">
          <span className="mr-auto text-lg font-semibold tracking-tight">AI HUB</span>
          <button className="btn btn-icon btn-ghost md:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive ? 'bg-ink font-medium text-paper' : 'text-mute hover:bg-soft hover:text-ink'}`}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line px-2 pt-3">
          <p className="truncate text-xs text-mute" title={user?.email ?? undefined}>{user ? user.email ?? 'Đã đăng nhập' : 'Dữ liệu lưu trên trình duyệt này'}</p>
          <button className="btn w-full" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <div className="md:pl-60">
        <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10"><Outlet /></main>
      </div>
    </div>
  )
}
