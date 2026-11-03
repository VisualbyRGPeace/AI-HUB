import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Archive, ArchiveRestore, ArrowRight, Copy, Folder, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PROVIDERS } from '../data/providers'
import { useProjects, type ProjectInput } from '../projectsStore'
import { fileDb } from '../lib/fileDb'
import { fmtDate } from '../lib/format'
import { confirmDialog } from '../dialogStore'
import { toast } from '../toastStore'
import { Empty, Field, IconButton, PageHeader } from '../components/ui'
import Modal from '../components/Modal'

const EMPTY: ProjectInput = { name: '', description: '', status: 'active', providerId: 'claude', repoUrl: '' }
const STATUS: Record<ProjectInput['status'], string> = { active: 'Đang làm', completed: 'Hoàn thành', archived: 'Lưu trữ' }

export default function Projects() {
  const { projects, add, update, remove, duplicate } = useProjects()
  const nav = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ProjectInput>(EMPTY)
  const [err, setErr] = useState<string | null>(null)

  const list = useMemo(() => projects
    .filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(a.status === 'archived') - Number(b.status === 'archived') || b.updatedAt.localeCompare(a.updatedAt)), [projects, q])

  const openForm = (id: string | 'new') => {
    const p = projects.find(x => x.id === id)
    setForm(p ? { name: p.name, description: p.description, status: p.status, providerId: p.providerId, repoUrl: p.repoUrl } : EMPTY)
    setErr(null); setEditing(id)
  }

  // Mở sẵn form khi đến từ nút "Dự án mới" ở Tổng quan.
  useEffect(() => {
    if ((location.state as { create?: boolean } | null)?.create) { openForm('new'); nav('.', { replace: true, state: null }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...form, name: form.name.trim(), description: form.description.trim(), repoUrl: form.repoUrl.trim() }
    if (!clean.name) return setErr('Vui lòng nhập tên dự án.')
    if (clean.repoUrl) { try { if (new URL(clean.repoUrl).protocol !== 'https:') throw 0 } catch { return setErr('Địa chỉ repository phải bắt đầu bằng https://') } }
    if (editing === 'new') { const id = add(clean); toast.success('Đã tạo dự án.'); setEditing(null); nav(`/workspace/${id}`); return }
    if (editing) { update(editing, clean); toast.success('Đã cập nhật dự án.') }
    setEditing(null)
  }

  const del = async (id: string, name: string) => {
    if (!(await confirmDialog(`Xóa dự án "${name}" cùng các tệp của dự án?`, 'Xóa'))) return
    remove(id)
    fileDb.purgeProject(id).catch(() => { /* không có tệp hoặc kho lưu trữ không khả dụng */ })
    toast.success('Đã xóa dự án.')
  }

  return (
    <div>
      <PageHeader title="Dự án">
        <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} />Dự án mới</button>
      </PageHeader>

      {projects.length === 0 ? (
        <Empty icon={Folder} text="Chưa có dự án nào.">
          <button className="btn btn-primary" onClick={() => openForm('new')}><Plus size={16} />Tạo dự án đầu tiên</button>
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-mute" />
            <input className="input pl-9" placeholder="Tìm dự án" aria-label="Tìm dự án" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          {list.length === 0 ? <p className="py-10 text-center text-sm text-mute">Không có kết quả phù hợp.</p> : (
            <div className="list">
              {list.map(p => (
                <div key={p.id} className={`row ${p.status === 'archived' ? 'opacity-60' : ''}`}>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="chip">{STATUS[p.status]}</span>
                    </div>
                    <div className="truncate text-xs text-mute">{p.description || 'Chưa có mô tả'}</div>
                    <div className="text-xs text-mute">{PROVIDERS[p.providerId]?.name ?? 'AI'} · cập nhật {fmtDate(p.updatedAt)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="btn btn-primary" onClick={() => nav(`/workspace/${p.id}`)}>Mở<ArrowRight size={14} /></button>
                    <IconButton label="Sửa" icon={Pencil} onClick={() => openForm(p.id)} />
                    <IconButton label="Nhân bản" icon={Copy} onClick={() => { duplicate(p.id); toast.success('Đã nhân bản dự án.') }} />
                    <IconButton label={p.status === 'archived' ? 'Khôi phục' : 'Lưu trữ'} icon={p.status === 'archived' ? ArchiveRestore : Archive}
                      onClick={() => { update(p.id, { status: p.status === 'archived' ? 'active' : 'archived' }); toast.success(p.status === 'archived' ? 'Đã khôi phục dự án.' : 'Đã lưu trữ dự án.') }} />
                    <IconButton label="Xóa" icon={Trash2} onClick={() => del(p.id, p.name)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Dự án mới' : 'Sửa dự án'} onClose={() => setEditing(null)}>
          <form className="space-y-4" onSubmit={save}>
            <Field label="Tên dự án"><input className="input" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Mô tả"><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="AI chính">
                <select className="input" value={form.providerId} onChange={e => setForm({ ...form, providerId: e.target.value })}>
                  {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Trạng thái">
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProjectInput['status'] })}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Repository (tùy chọn)"><input className="input" placeholder="https://github.com/…" value={form.repoUrl} onChange={e => setForm({ ...form, repoUrl: e.target.value })} /></Field>
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
