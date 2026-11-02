import { supabase } from './supabase'
import { useAccounts, type Account } from '../accountsStore'
import { useProjects, type Project } from '../projectsStore'

type Row<T> = { id: string; data: T; updated_at: string }

// Đẩy: cloud = bản local (upsert tất cả, xóa dòng cloud không còn ở local).
export async function pushAll(): Promise<void> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase.')
  const now = new Date().toISOString()
  const accs = useAccounts.getState().accounts
  const projs = useProjects.getState().projects
  const a = await supabase.from('ai_accounts').upsert(accs.map(x => ({ id: x.id, data: x, updated_at: now })))
  if (a.error) throw a.error
  const p = await supabase.from('projects').upsert(projs.map(x => ({ id: x.id, data: x, updated_at: x.updatedAt })))
  if (p.error) throw p.error
  for (const [table, ids] of [['ai_accounts', accs.map(x => x.id)], ['projects', projs.map(x => x.id)]] as const) {
    const { data, error } = await supabase.from(table).select('id')
    if (error) throw error
    const stale = (data ?? []).map(r => r.id as string).filter(id => !ids.includes(id))
    if (stale.length) { const d = await supabase.from(table).delete().in('id', stale); if (d.error) throw d.error }
  }
}

// Kéo: gộp cloud vào local (thiếu thì thêm; dự án cloud mới hơn thì ghi đè). Không xóa gì ở local.
export async function pullAll(): Promise<{ accounts: number; projects: number }> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase.')
  const [a, p] = await Promise.all([supabase.from('ai_accounts').select('*'), supabase.from('projects').select('*')])
  if (a.error) throw a.error
  if (p.error) throw p.error
  const localAcc = useAccounts.getState().accounts
  const newAcc = (a.data as Row<Account>[]).filter(r => !localAcc.some(x => x.id === r.id)).map(r => r.data)
  useAccounts.setState({ accounts: [...localAcc, ...newAcc] })

  const localProj = useProjects.getState().projects
  let changed = 0
  const merged = [...localProj]
  for (const r of p.data as Row<Project>[]) {
    const i = merged.findIndex(x => x.id === r.id)
    if (i < 0) { merged.push(r.data); changed++ }
    else if (new Date(r.data.updatedAt) > new Date(merged[i].updatedAt)) { merged[i] = r.data; changed++ }
  }
  useProjects.setState({ projects: merged })
  return { accounts: newAcc.length, projects: changed }
}
