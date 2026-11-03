import { create } from 'zustand'

// Thay confirm()/prompt() của trình duyệt bằng hộp thoại trong app.
export interface DialogItem {
  id: number; kind: 'confirm' | 'prompt'; message: string
  defaultValue: string; confirmLabel: string
  resolve: (v: boolean | string | null) => void
}
interface S { queue: DialogItem[]; push: (i: DialogItem) => void; close: (id: number, v: boolean | string | null) => void }

export const useDialogs = create<S>((set, get) => ({
  queue: [],
  push: i => set({ queue: [...get().queue, i] }),
  close: (id, v) => {
    const it = get().queue.find(x => x.id === id)
    set({ queue: get().queue.filter(x => x.id !== id) })
    it?.resolve(v)
  },
}))

let n = 0
export const confirmDialog = (message: string, confirmLabel = 'Xác nhận') =>
  new Promise<boolean>(res => useDialogs.getState().push({
    id: ++n, kind: 'confirm', message, defaultValue: '', confirmLabel, resolve: v => res(v === true),
  }))

export const promptDialog = (message: string, defaultValue = '', confirmLabel = 'Lưu') =>
  new Promise<string | null>(res => useDialogs.getState().push({
    id: ++n, kind: 'prompt', message, defaultValue, confirmLabel, resolve: v => res(typeof v === 'string' ? v : null),
  }))
