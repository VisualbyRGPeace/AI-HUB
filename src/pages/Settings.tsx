import { useState } from 'react'
import { Github, LogOut, CloudUpload, CloudDownload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../authStore'
import { pullAll, pushAll } from '../lib/sync'
import { toast } from '../toastStore'
import GitHubPanel from '../components/GitHubPanel'
import SettingsExtra from '../components/SettingsExtra'

export default function Settings() {
  const { user, loading, signInGithub, signInEmail, signUpEmail, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700'

  const run = async (fn: () => Promise<string | null>, ok?: string) => {
    setBusy(true); const e = await fn(); setBusy(false)
    if (e) toast.error(e); else if (ok) toast.success(ok)
  }
  const auth = (kind: 'in' | 'up') => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Email không hợp lệ.')
    if (pw.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự.')
    run(() => (kind === 'in' ? signInEmail(email, pw) : signUpEmail(email, pw)), kind === 'up' ? 'Đã đăng ký. Kiểm tra email nếu Supabase yêu cầu xác nhận.' : undefined)
  }
  const sync = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try { await fn(); toast.success(ok) } catch (e) { toast.error((e as Error).message || 'Đồng bộ thất bại.') }
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div className="card space-y-1">
        <b>Supabase Connection</b>
        <p className="text-sm text-slate-500">
          {!supabase ? 'Offline Mode: chưa cấu hình Supabase (thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Dữ liệu chỉ lưu trong trình duyệt này.'
            : loading ? 'Đang kiểm tra phiên đăng nhập…'
            : user ? `Connected Mode: đã đăng nhập ${user.email ?? user.id}.` : 'Đã cấu hình Supabase nhưng chưa đăng nhập.'}
        </p>
      </div>

      {supabase && !loading && (user ? (
        <div className="card space-y-3">
          <b>Đồng bộ dữ liệu</b>
          <p className="text-xs text-slate-500">Đẩy lên: cloud sẽ giống hệt dữ liệu trên máy này (mục chỉ có trên cloud bị xóa). Kéo về: gộp dữ liệu cloud vào máy này, không xóa gì ở local.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={busy} onClick={() => sync(pushAll, 'Đã đẩy dữ liệu lên cloud.')}><CloudUpload size={14} /> Đẩy lên cloud</button>
            <button className="btn" disabled={busy} onClick={() => sync(async () => { const r = await pullAll(); toast.success(`Kéo về: +${r.accounts} tài khoản, ${r.projects} dự án cập nhật.`) }, 'Hoàn tất.')}><CloudDownload size={14} /> Kéo về</button>
            <button className="btn" onClick={signOut}><LogOut size={14} /> Đăng xuất</button>
          </div>
        </div>
      ) : (
        <div className="card max-w-md space-y-3">
          <b>Đăng nhập</b>
          <button className="btn w-full justify-center" disabled={busy} onClick={() => run(signInGithub)}><Github size={16} /> Đăng nhập bằng GitHub</button>
          <input className={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={input} type="password" placeholder="Mật khẩu" value={pw} onChange={e => setPw(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => auth('in')}>Đăng nhập</button>
            <button className="btn" disabled={busy} onClick={() => auth('up')}>Đăng ký</button>
          </div>
        </div>
      ))}
      <GitHubPanel />
      <SettingsExtra />
      <p className="text-xs text-slate-500">Giao diện hiện chỉ có tiếng Việt/Anh trộn, chưa có tính năng đổi ngôn ngữ.</p>
    </div>
  )
}
