import { create } from 'zustand'
import { useActivity } from './activityStore'

export interface Toast { id: number; type: 'success' | 'error' | 'info'; text: string }
interface S { toasts: Toast[]; push: (type: Toast['type'], text: string) => void; dismiss: (id: number) => void }

let n = 0
export const useToasts = create<S>((set, get) => ({
  toasts: [],
  push: (type, text) => {
    const id = ++n
    set({ toasts: [...get().toasts.slice(-3), { id, type, text }] })
    setTimeout(() => get().dismiss(id), type === 'error' ? 5000 : 3000)
  },
  dismiss: id => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}))

export const toast = {
  // Thao tác thành công được ghi vào Lịch sử; info (vd: đã sao chép) thì không.
  success: (t: string) => { useToasts.getState().push('success', t); useActivity.getState().log(t) },
  info: (t: string) => useToasts.getState().push('info', t),
  error: (t: string) => useToasts.getState().push('error', t),
}
