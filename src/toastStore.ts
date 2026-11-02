import { create } from 'zustand'
import { useActivity } from './activityStore'

export interface Toast { id: number; type: 'success' | 'error'; text: string }
interface S { toasts: Toast[]; push: (type: Toast['type'], text: string) => void; dismiss: (id: number) => void }

let n = 0
export const useToasts = create<S>((set, get) => ({
  toasts: [],
  push: (type, text) => {
    const id = ++n
    set({ toasts: [...get().toasts, { id, type, text }] })
    setTimeout(() => get().dismiss(id), 3500)
  },
  dismiss: id => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}))
export const toast = {
  // Mỗi thao tác thành công cũng được ghi vào Activity History
  success: (t: string) => { useToasts.getState().push('success', t); useActivity.getState().log(t) },
  error: (t: string) => useToasts.getState().push('error', t),
}
