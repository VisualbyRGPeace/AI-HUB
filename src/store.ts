import { create } from 'zustand'

export type Theme = 'light' | 'dark'
const KEY = 'aihub:ui-theme'

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  try { localStorage.setItem(KEY, t) } catch { /* storage có thể bị chặn */ }
}

function initialTheme(): Theme {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' } catch { return 'light' }
}

interface UIState { theme: Theme; toggleTheme: () => void }

const start = initialTheme()
document.documentElement.classList.toggle('dark', start === 'dark')

export const useUI = create<UIState>((set, get) => ({
  theme: start,
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))
