import { useEffect, useState } from 'react'
import { Download, Github, History, Lock, Upload } from 'lucide-react'
import { useGitHub } from '../githubStore'
import { useProjects } from '../projectsStore'
import { backup, getUser, listCommits, listRepos, restore, type Commit, type Repo } from '../lib/github'
import { fmtDateTime } from '../lib/format'
import { toast } from '../toastStore'

export default function GitHubPanel() {
  const { token, login, repo, connect, disconnect, setRepo } = useGitHub()
  const projects = useProjects(s => s.projects)
  const [input, setInput] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [busy, setBusy] = useState(false)
  const picked = repos.find(r => r.full_name === repo)

  useEffect(() => {
    if (token) listRepos(token).then(setRepos).catch(e => toast.error((e as Error).message))
  }, [token])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch (e) { toast.error((e as Error).message || 'Thao tác GitHub thất bại.') }
    setBusy(false)
  }
  const canSync = () => {
    if (!repo || !picked) { toast.error('Hãy chọn repository sao lưu trước.'); return false }
    if (!picked.private) { toast.error('Repository này là công khai. Hãy chọn repository riêng tư để bảo vệ dữ liệu.'); return false }
    return true
  }

  if (!token || !login) return (
    <div className="card space-y-3">
      <p className="text-sm text-mute">
        Dán một <b className="text-ink">fine-grained token</b> chỉ cấp quyền <i>Contents: Read and write</i> cho một repository riêng tư.
        Token chỉ lưu trong tab này và mất khi đóng tab.
      </p>
      <div className="flex gap-2">
        <input className="input" type="password" autoComplete="off" placeholder="github_pat_…" aria-label="GitHub token" value={input} onChange={e => setInput(e.target.value.trim())} />
        <button className="btn btn-primary" disabled={busy || !input}
          onClick={() => run(async () => { const u = await getUser(input); connect(input, u.login); setInput(''); toast.success(`Đã kết nối GitHub: ${u.login}`) })}>
          <Github size={16} />Kết nối
        </button>
      </div>
    </div>)

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Github size={16} />
        <span className="mr-auto text-sm font-medium">{login}</span>
        <button className="btn" onClick={() => { disconnect(); setRepos([]); setCommits([]) }}>Ngắt kết nối</button>
      </div>

      <select className="input" aria-label="Repository sao lưu" value={repo} onChange={e => setRepo(e.target.value)}>
        <option value="">Chọn repository sao lưu</option>
        {repos.map(r => <option key={r.full_name} value={r.full_name}>{r.full_name} ({r.private ? 'riêng tư' : 'công khai'})</option>)}
      </select>
      {picked && !picked.private && <p className="text-xs text-mute">Repository công khai không thể dùng để sao lưu.</p>}
      {picked?.private && <p className="flex items-center gap-1.5 text-xs text-mute"><Lock size={12} />Repository riêng tư</p>}
      {repos.length === 0 && <p className="text-xs text-mute">Chưa thấy repository nào. Kiểm tra token đã được cấp quyền cho repository cần dùng chưa.</p>}

      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => canSync() && run(async () => {
          if (!projects.length) return toast.error('Chưa có dự án để sao lưu.')
          const r = await backup(token, repo, projects)
          toast.success(`Sao lưu xong: ${r.written} tệp mới hoặc cập nhật, ${r.skipped} không đổi.`)
        })}><Upload size={14} />Sao lưu</button>
        <button className="btn" disabled={busy} onClick={() => canSync() && run(async () => {
          const r = await restore(token, repo)
          toast.success(`Khôi phục: thêm ${r.added} dự án, bỏ qua ${r.existing} dự án đã có.`)
        })}><Download size={14} />Khôi phục</button>
        <button className="btn" disabled={busy} onClick={() => canSync() && run(async () => setCommits(await listCommits(token, repo)))}><History size={14} />Lịch sử commit</button>
      </div>
      {busy && <p className="text-xs text-mute">Đang xử lý… sao lưu nhiều tệp có thể mất vài chục giây.</p>}

      {commits.length > 0 && (
        <div className="divide-y divide-line text-xs">
          {commits.map(c => (
            <div key={c.sha} className="flex gap-3 py-1.5">
              <span className="w-28 shrink-0 text-mute tabular-nums">{fmtDateTime(c.commit.author.date)}</span>
              <span className="truncate">{c.commit.message}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-mute">Mỗi dự án được ghi vào một thư mục riêng gồm các tệp .md và project.json. Khôi phục chỉ thêm dự án chưa có, không ghi đè dự án trên máy này.</p>
    </div>
  )
}
