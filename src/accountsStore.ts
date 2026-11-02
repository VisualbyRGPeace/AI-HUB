import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_ACCOUNTS, PROVIDERS } from './data/providers'

export interface Account {
  id: string; providerId: string; displayName: string; website: string
  profile: string; notes: string; createdAt: string; lastUsed: string | null; isDefault: boolean
}
export type AccountInput = Pick<Account, 'providerId' | 'displayName' | 'website' | 'profile' | 'notes'>

interface S {
  accounts: Account[]
  add: (i: AccountInput) => void
  update: (id: string, i: AccountInput) => void
  remove: (id: string) => void
  setDefault: (id: string) => void
  touch: (id: string) => void
  loadDemo: () => void
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

function make(list: Account[], i: AccountInput): Account {
  // Tài khoản đầu tiên của một provider tự là mặc định
  return { ...i, id: uid(), createdAt: now(), lastUsed: null, isDefault: !list.some(a => a.providerId === i.providerId) }
}

// Lưu ở localStorage của trình duyệt này (Offline Mode) — KHÔNG phải cloud.
export const useAccounts = create<S>()(persist((set, get) => ({
  accounts: [],
  add: i => set({ accounts: [...get().accounts, make(get().accounts, i)] }),
  update: (id, i) => set({ accounts: get().accounts.map(a => (a.id === id ? { ...a, ...i } : a)) }),
  remove: id => {
    const target = get().accounts.find(a => a.id === id)
    let rest = get().accounts.filter(a => a.id !== id)
    if (target?.isDefault) {
      const next = rest.find(a => a.providerId === target.providerId)
      if (next) rest = rest.map(a => (a.id === next.id ? { ...a, isDefault: true } : a))
    }
    set({ accounts: rest })
  },
  setDefault: id => {
    const t = get().accounts.find(a => a.id === id)
    if (t) set({ accounts: get().accounts.map(a => (a.providerId === t.providerId ? { ...a, isDefault: a.id === id } : a)) })
  },
  touch: id => set({ accounts: get().accounts.map(a => (a.id === id ? { ...a, lastUsed: now() } : a)) }),
  loadDemo: () => {
    let list = get().accounts
    for (const d of DEMO_ACCOUNTS) {
      list = [...list, make(list, { providerId: d.providerId, displayName: d.displayName, website: PROVIDERS[d.providerId].website, profile: d.profile, notes: '' })]
    }
    set({ accounts: list })
  },
}), { name: 'aihub:accounts' }))
