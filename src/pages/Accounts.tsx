import { useMemo, useState } from 'react'
import { ExternalLink, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { PROVIDERS } from '../data/providers'
import { useAccounts, type AccountInput } from '../accountsStore'
import { browserManager } from '../lib/browserManager'
import { toast } from '../toastStore'

const EMPTY: AccountInput = { providerId: 'claude', displayName: '', website: PROVIDERS.claude.website, profile: '', notes: '' }

function validate(f: AccountInput): string | null {
  if (!f.displayName.trim()) return 'Vui lòng nhập tên hiển thị.'
  if (f.displayName.length > 60) return 'Tên hiển thị tối đa 60 ký tự.'
  if (!PROVIDERS[f.providerId]) return 'Nhà cung cấp không hợp lệ.'
  try { if (new URL(f.website).protocol !== 'https:') return 'URL phải bắt đầu bằng https://' } catch { return 'URL không hợp lệ.' }
  return null
}

export default function Accounts() {
  const { accounts, add, update, remove, loadDemo } = useAccounts()
  const [q, setQ] = useState('')
  const [pf, setPf] = useState('all')
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<AccountInput>(EMPTY)
  const [err, setErr] = useState<string | null>(null)

  const list = useMemo(() => accounts.filter(a =>
    (pf === 'all' || a.providerId === pf) && a.displayName.toLowerCase().includes(q.toLowerCase())), [accounts, q, pf])

  const openForm = (id: string | 'new') => {
    const a = accounts.find(x => x.id === id)
    setForm(a ? { providerId: a.providerId, displayName: a.displayName, website: a.website, profile: a.profile, notes: a.notes } : EMPTY)
    setErr(null); setEditing(id)
  }
  const save = () => {
    const e = validate(form)
    if (e) return setErr(e)
    const clean = { ...form, displayName: form.displayName.trim() }
    if (editing === 'new') { add(clean); toast.success('Đã thêm tài khoản.') }
    else if (editing) { update(editing, clean); toast.success('Đã cập nhật tài khoản.') }
    setEditing(null)
  }
  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">AI Accounts</h1>
        <input className={`${input} max-w-[200px]`} placeholder="Tìm tài khoản…" value={q} onChange={e => setQ(e.target.value)} />
        <select className={`${input} max-w-[140px] dark:bg-slate-900`} value={pf} onChange={e => setPf(e.target.value)}>
          <option value="all">Tất cả</option>
          {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} /> Add Account</button>
      </div>
      <p className="text-xs text-slate-500">Offline Mode: dữ liệu chỉ lưu trong trình duyệt này (localStorage). Không lưu mật khẩu hay cookie.</p>

      {accounts.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="mb-3 text-slate-500">Chưa có tài khoản nào.</p>
          <div className="flex justify-center gap-2">
            <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} /> Thêm tài khoản</button>
            <button className="btn" onClick={() => { loadDemo(); toast.success('Đã nạp dữ liệu mẫu.') }}>Nạp dữ liệu mẫu</button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center text-slate-500">Không có kết quả phù hợp.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(a => { const p = PROVIDERS[a.providerId]; return (
            <div key={a.id} className="card">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p?.color }} />
                <b className="truncate">{a.displayName}</b>
                {a.isDefault && <span className="rounded bg-brand/15 px-1.5 text-xs text-brand">Mặc định</span>}
              </div>
              <div className="mb-3 text-xs text-slate-500">
                {p?.name} · {a.profile || 'Chưa đặt profile'} · {a.lastUsed ? `Dùng: ${new Date(a.lastUsed).toLocaleDateString()}` : 'Chưa mở lần nào'}
              </div>
              {a.notes && <p className="mb-3 text-xs">{a.notes}</p>}
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={() => browserManager.openAccount(a)}><ExternalLink size={14} /> Open</button>
                <button className="btn" onClick={() => openForm(a.id)} aria-label="Sửa"><Pencil size={14} /></button>
                {!a.isDefault && <button className="btn" onClick={() => { browserManager.setDefaultAccount(a.id); toast.success('Đã đặt mặc định.') }} aria-label="Đặt mặc định"><Star size={14} /></button>}
                <button className="btn" onClick={() => { if (confirm(`Xóa "${a.displayName}"?`)) { remove(a.id); toast.success('Đã xóa tài khoản.') } }} aria-label="Xóa"><Trash2 size={14} /></button>
              </div>
            </div>
          )})}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center"><b className="mr-auto">{editing === 'new' ? 'Thêm tài khoản' : 'Sửa tài khoản'}</b>
              <button onClick={() => setEditing(null)} aria-label="Đóng"><X size={18} /></button></div>
            <select className={`${input} dark:bg-slate-900`} value={form.providerId}
              onChange={e => setForm({ ...form, providerId: e.target.value, website: PROVIDERS[e.target.value].website })}>
              {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className={input} placeholder="Tên hiển thị (vd: Claude Work)" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
            <input className={input} placeholder="Website URL (https://…)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
            <input className={input} placeholder="Tên browser profile (tùy chọn)" value={form.profile} onChange={e => setForm({ ...form, profile: e.target.value })} />
            <textarea className={input} rows={2} placeholder="Ghi chú (không nhập mật khẩu)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setEditing(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
