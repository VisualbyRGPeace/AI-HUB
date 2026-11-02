import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type DataMode = 'demo' | 'connected' | 'offline'

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  try { localStorage.setItem('aihub:theme', t) } catch { /* storage có thể bị chặn */ }
}

function initialTheme(): Theme {
  try { return (localStorage.getItem('aihub:theme') as Theme) || 'dark' } catch { return 'dark' }
}

interface UIState {
  theme: Theme
  mode: DataMode
  toggleTheme: () => void
}

const start = initialTheme()
applyTheme(start)

export const useUI = create<UIState>((set, get) => ({
  theme: start,
  mode: 'demo', // chưa cấu hình backend => luôn là Demo Mode
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))
