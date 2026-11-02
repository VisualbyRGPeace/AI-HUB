import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Activity { id: number; at: string; text: string }
interface S { items: Activity[]; log: (text: string) => void; clear: () => void }

// Nhật ký thao tác thành công, lưu trong trình duyệt này (tối đa 200 dòng).
export const useActivity = create<S>()(persist((set, get) => ({
  items: [],
  log: text => set({ items: [{ id: Date.now() + Math.random(), at: new Date().toISOString(), text }, ...get().items].slice(0, 200) }),
  clear: () => set({ items: [] }),
}), { name: 'aihub:activity' }))
