import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ExternalLink, Pencil, Plus, Search, Star, Trash2, UserRound } from 'lucide-react'
import { PROVIDERS } from '../data/providers'
import { useAccounts, type AccountInput } from '../accountsStore'
import { browserManager, PROFILE_RE } from '../lib/browserManager'
import { fmtDate } from '../lib/format'
import { confirmDialog } from '../dialogStore'
import { toast } from '../toastStore'
import { Empty, Field, IconButton, PageHeader } from '../components/ui'
import Modal from '../components/Modal'
import ProviderIcon from '../components/ProviderIcon'

const EMPTY: AccountInput = { providerId: 'claude', displayName: '', website: PROVIDERS.claude.website, profile: '', notes: '' }

function validate(f: AccountInput): string | null {
  if (!f.displayName.trim()) return 'Vui lòng nhập tên hiển thị.'
  if (f.displayName.trim().length > 60) return 'Tên hiển thị tối đa 60 ký tự.'
  if (f.profile.trim() && !PROFILE_RE.test(f.profile.trim())) return 'Profile phải là Default, Profile 1, Profile 2… (hoặc để trống).'
  if (!PROVIDERS[f.providerId]) return 'Nhà cung cấp không hợp lệ.'
  try { if (new URL(f.website).protocol !== 'https:') return 'Địa chỉ website phải bắt đầu bằng https://' } catch { return 'Địa chỉ website không hợp lệ.' }
  return null
}

export default function Accounts() {
  const { accounts, add, update, remove, setDefault } = useAccounts()
  const nav = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [pf, setPf] = useState('all')
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<AccountInput>(EMPTY)
  const [err, setErr] = useState<string | null>(null)

  const list = useMemo(() => accounts.filter(a =>
    (pf === 'all' || a.providerId === pf) && a.displayName.toLowerCase().includes(q.trim().toLowerCase())), [accounts, q, pf])

  const openForm = (id: string | 'new') => {
    const a = accounts.find(x => x.id === id)
    setForm(a ? { providerId: a.providerId, displayName: a.displayName, website: a.website, profile: a.profile, notes: a.notes } : EMPTY)
    setErr(null); setEditing(id)
  }

  // Mở sẵn form khi đến từ nút "Thêm tài khoản" ở Tổng quan.
  useEffect(() => {
    if ((location.state as { create?: boolean } | null)?.create) { openForm('new'); nav('.', { replace: true, state: null }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...form, displayName: form.displayName.trim(), profile: form.profile.trim(), website: form.website.trim(), notes: form.notes.trim() }
    const msg = validate(clean)
    if (msg) return setErr(msg)
    if (editing === 'new') { add(clean); toast.success('Đã thêm tài khoản.') }
    else if (editing) { update(editing, clean); toast.success('Đã cập nhật tài khoản.') }
    setEditing(null)
  }

  return (
    <div>
      <PageHeader title="Tài khoản AI">
        <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} />Thêm tài khoản</button>
      </PageHeader>

      {accounts.length === 0 ? (
        <Empty icon={UserRound} text="Chưa có tài khoản nào. Thêm tài khoản để mở nhanh Claude, ChatGPT hoặc Gemini.">
          <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} />Thêm tài khoản</button>
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-mute" />
              <input className="input pl-9" placeholder="Tìm tài khoản" aria-label="Tìm tài khoản" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <select className="input w-auto" aria-label="Lọc theo nhà cung cấp" value={pf} onChange={e => setPf(e.target.value)}>
              <option value="all">Tất cả</option>
              {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {list.length === 0 ? <p className="py-10 text-center text-sm text-mute">Không có kết quả phù hợp.</p> : (
            <div className="list">
              {list.map(a => (
                <div key={a.id} className="row">
                  <ProviderIcon id={a.providerId} size={18} framed />
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{a.displayName}</span>
                      {a.isDefault && <span className="chip"><Star size={11} />Mặc định</span>}
                    </div>
                    <div className="truncate text-xs text-mute">
                      {PROVIDERS[a.providerId]?.name ?? a.providerId}{a.profile && ` · ${a.profile}`} · {a.lastUsed ? `mở ${fmtDate(a.lastUsed)}` : 'chưa mở'}
                    </div>
                    {a.notes && <div className="truncate text-xs text-mute">{a.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="btn" onClick={() => browserManager.openAccount(a)}><ExternalLink size={14} />Mở</button>
                    {!a.isDefault && <IconButton label="Đặt làm mặc định" icon={Star} onClick={() => { setDefault(a.id); toast.success('Đã đặt làm mặc định.') }} />}
                    <IconButton label="Sửa" icon={Pencil} onClick={() => openForm(a.id)} />
                    <IconButton label="Xóa" icon={Trash2} onClick={async () => { if (await confirmDialog(`Xóa tài khoản "${a.displayName}"?`, 'Xóa')) { remove(a.id); toast.success('Đã xóa tài khoản.') } }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Thêm tài khoản' : 'Sửa tài khoản'} onClose={() => setEditing(null)}>
          <form className="space-y-4" onSubmit={save}>
            <Field label="Nhà cung cấp">
              <select className="input" value={form.providerId} onChange={e => setForm({ ...form, providerId: e.target.value, website: PROVIDERS[e.target.value].website })}>
                {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Tên hiển thị"><input className="input" autoFocus placeholder="Ví dụ: Claude Công việc" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} /></Field>
            <Field label="Địa chỉ website"><input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></Field>
            <Field label="Profile Chrome (tùy chọn)" hint="Tên thư mục profile: Default, Profile 1… Chỉ dùng khi bật Local Browser Manager trong Cài đặt.">
              <input className="input" value={form.profile} onChange={e => setForm({ ...form, profile: e.target.value })} />
            </Field>
            <Field label="Ghi chú" hint="Không nhập mật khẩu hay khóa API."><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
            {err && <p className="flex items-center gap-2 text-sm" role="alert"><AlertCircle size={16} />{err}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
