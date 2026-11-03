import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  merge: (list: Partial<Account>[]) => number
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

// Mỗi nhà cung cấp luôn có đúng một tài khoản mặc định (nếu có tài khoản).
function normalize(list: Account[]): Account[] {
  const def = new Map<string, string>()
  for (const a of list) if (a.isDefault && !def.has(a.providerId)) def.set(a.providerId, a.id)
  for (const a of list) if (!def.has(a.providerId)) def.set(a.providerId, a.id)
  return list.map(a => (a.isDefault === (def.get(a.providerId) === a.id) ? a : { ...a, isDefault: def.get(a.providerId) === a.id }))
}

export function toAccount(a: Partial<Account>): Account {
  return {
    id: a.id ?? uid(), providerId: a.providerId ?? 'claude', displayName: a.displayName ?? '', website: a.website ?? '',
    profile: a.profile ?? '', notes: a.notes ?? '', createdAt: a.createdAt ?? now(), lastUsed: a.lastUsed ?? null, isDefault: !!a.isDefault,
  }
}

// Lưu ở localStorage của trình duyệt này (Offline Mode) — KHÔNG phải cloud.
export const useAccounts = create<S>()(persist((set, get) => ({
  accounts: [],
  add: i => set({ accounts: normalize([...get().accounts, toAccount({ ...i, isDefault: false })]) }),
  update: (id, i) => set({ accounts: normalize(get().accounts.map(a => (a.id === id ? { ...a, ...i } : a))) }),
  remove: id => set({ accounts: normalize(get().accounts.filter(a => a.id !== id)) }),
  setDefault: id => {
    const t = get().accounts.find(a => a.id === id)
    if (t) set({ accounts: normalize(get().accounts.map(a => (a.providerId === t.providerId ? { ...a, isDefault: a.id === id } : a))) })
  },
  touch: id => set({ accounts: get().accounts.map(a => (a.id === id ? { ...a, lastUsed: now() } : a)) }),
  // Gộp danh sách ngoài vào (nhập JSON / kéo cloud): chỉ thêm tài khoản chưa có id.
  merge: list => {
    const have = new Set(get().accounts.map(a => a.id))
    const fresh = list.filter(a => a.id && !have.has(a.id)).map(a => toAccount({ ...a, isDefault: false }))
    if (fresh.length) set({ accounts: normalize([...get().accounts, ...fresh]) })
    return fresh.length
  },
}), { name: 'aihub:accounts' }))
