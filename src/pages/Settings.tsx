import { useState } from 'react'
import { CloudDownload, CloudUpload, Github, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../authStore'
import { pullAll, pushAll } from '../lib/sync'
import { toast } from '../toastStore'
import { PageHeader, Section } from '../components/ui'
import GitHubPanel from '../components/GitHubPanel'
import { BrowserPanel, DataPanel } from '../components/DataPanel'

function CloudPanel() {
  const { user, loading, signInGithub, signInEmail, signUpEmail, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)

  if (!supabase) return (
    <div className="card text-sm text-mute">
      Chưa bật. Để đồng bộ giữa nhiều thiết bị, cấu hình Supabase theo hướng dẫn trong README.
    </div>
  )
  if (loading) return <div className="card text-sm text-mute">Đang kiểm tra phiên đăng nhập…</div>

  const run = async (fn: () => Promise<string | null>, ok?: string) => {
    setBusy(true); const e = await fn(); setBusy(false)
    if (e) toast.error(e); else if (ok) toast.success(ok)
  }
  const auth = (kind: 'in' | 'up') => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Email không hợp lệ.')
    if (pw.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự.')
    run(async () => { const e = await (kind === 'in' ? signInEmail(email, pw) : signUpEmail(email, pw)); if (!e) setPw(''); return e },
      kind === 'up' ? 'Đã đăng ký. Kiểm tra email nếu cần xác nhận.' : undefined)
  }
  const sync = async (fn: () => Promise<string | void>) => {
    setBusy(true)
    try { toast.success((await fn()) || 'Đã đồng bộ.') } catch (e) { toast.error((e as Error).message || 'Đồng bộ thất bại.') }
    setBusy(false)
  }

  if (user) return (
    <div className="card space-y-3">
      <p className="text-sm">Đã đăng nhập: <b>{user.email ?? user.id}</b></p>
      <p className="text-xs text-mute">Đẩy lên: cloud giống hệt máy này (mục chỉ có trên cloud sẽ bị xóa). Kéo về: gộp dữ liệu cloud vào máy này, không xóa gì ở máy.</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => sync(async () => { await pushAll(); return 'Đã đẩy dữ liệu lên cloud.' })}><CloudUpload size={14} />Đẩy lên</button>
        <button className="btn" disabled={busy} onClick={() => sync(async () => { const r = await pullAll(); return `Đã kéo về: thêm ${r.accounts} tài khoản, cập nhật ${r.projects} dự án.` })}><CloudDownload size={14} />Kéo về</button>
        <button className="btn" onClick={signOut}><LogOut size={14} />Đăng xuất</button>
      </div>
    </div>
  )

  return (
    <form className="card max-w-md space-y-3" onSubmit={e => { e.preventDefault(); auth('in') }}>
      <button type="button" className="btn w-full" disabled={busy} onClick={() => run(signInGithub)}><Github size={16} />Đăng nhập bằng GitHub</button>
      <input className="input" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" type="password" autoComplete="current-password" placeholder="Mật khẩu" aria-label="Mật khẩu" value={pw} onChange={e => setPw(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>Đăng nhập</button>
        <button type="button" className="btn" disabled={busy} onClick={() => auth('up')}>Đăng ký</button>
      </div>
    </form>
  )
}

export default function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Cài đặt" />
      <Section title="Dữ liệu"><DataPanel /></Section>
      <Section title="Sao lưu lên GitHub"><GitHubPanel /></Section>
      <Section title="Đồng bộ cloud (Supabase)"><CloudPanel /></Section>
      <Section title="Trình duyệt"><BrowserPanel /></Section>
    </div>
  )
}
