import { useEffect, useState } from 'react'
import { Github, Upload, Download, History } from 'lucide-react'
import { useGitHub } from '../githubStore'
import { useProjects } from '../projectsStore'
import { backup, getUser, listCommits, listRepos, restore, type Commit, type Repo } from '../lib/github'
import { toast } from '../toastStore'

export default function GitHubPanel() {
  const { token, login, repo, connect, disconnect, setRepo } = useGitHub()
  const projects = useProjects(s => s.projects)
  const [input, setInput] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [busy, setBusy] = useState(false)
  const box = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'
  const picked = repos.find(r => r.full_name === repo)

  useEffect(() => { if (token) listRepos(token).then(setRepos).catch(e => toast.error((e as Error).message)) }, [token])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch (e) { toast.error((e as Error).message || 'Thao tác GitHub thất bại.') }
    setBusy(false)
  }
  const canSync = () => {
    if (!repo || !picked) { toast.error('Hãy chọn repo sao lưu.'); return false }
    if (!picked.private) { toast.error('Repo này là PUBLIC. Để bảo vệ dữ liệu riêng tư, hãy chọn repo private.'); return false }
    return true
  }

  if (!token || !login) return (
    <div className="card max-w-md space-y-3">
      <b className="flex items-center gap-2"><Github size={16} /> GitHub Integration</b>
      <p className="text-xs text-slate-500">Dán một <b>fine-grained token</b> chỉ cấp quyền <i>Contents: Read and write</i> cho một repo private. Token chỉ lưu trong tab này (sessionStorage), mất khi đóng tab.</p>
      <input className={box} type="password" placeholder="github_pat_…" value={input} onChange={e => setInput(e.target.value.trim())} />
      <button className="btn btn-primary" disabled={busy || !input} onClick={() => run(async () => { const u = await getUser(input); connect(input, u.login); setInput(''); toast.success(`Đã kết nối GitHub: ${u.login}`) })}>Kết nối</button>
    </div>)

  return (
    <div className="card space-y-3">
      <div className="flex items-center"><b className="mr-auto flex items-center gap-2"><Github size={16} /> GitHub: {login}</b>
        <button className="btn" onClick={() => { disconnect(); setRepos([]); setCommits([]) }}>Ngắt kết nối</button></div>
      <select className={box} value={repo} onChange={e => setRepo(e.target.value)}>
        <option value="">— Chọn repo sao lưu (nên là private) —</option>
        {repos.map(r => <option key={r.full_name} value={r.full_name}>{r.full_name} {r.private ? '🔒' : '(public)'}</option>)}
      </select>
      {repos.length === 0 && <p className="text-xs text-slate-500">Chưa thấy repo nào. Kiểm tra token đã được cấp quyền cho repo cần dùng chưa.</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => canSync() && run(async () => {
          if (!projects.length) return toast.error('Chưa có dự án để sao lưu.')
          const r = await backup(token, repo, projects); toast.success(`Sao lưu xong: ${r.written} file mới/cập nhật, ${r.skipped} không đổi.`)
        })}><Upload size={14} /> Sao lưu lên GitHub</button>
        <button className="btn" disabled={busy} onClick={() => canSync() && run(async () => {
          const r = await restore(token, repo); toast.success(`Khôi phục: thêm ${r.added} dự án, bỏ qua ${r.existing} dự án đã có.`)
        })}><Download size={14} /> Khôi phục từ GitHub</button>
        <button className="btn" disabled={busy} onClick={() => picked && run(async () => setCommits(await listCommits(token, repo)))}><History size={14} /> Lịch sử commit</button>
      </div>
      {busy && <p className="text-xs text-slate-500">Đang xử lý… (sao lưu nhiều file có thể mất vài chục giây)</p>}
      {commits.length > 0 && <div className="divide-y divide-slate-200 text-xs dark:divide-slate-800">
        {commits.map(c => <div key={c.sha} className="flex gap-3 py-1"><span className="w-36 shrink-0 text-slate-500">{new Date(c.commit.author.date).toLocaleString()}</span><span className="truncate">{c.commit.message}</span></div>)}</div>}
      <p className="text-xs text-slate-500">Mỗi dự án được ghi vào thư mục <code>ten-du-an-xxxxxxxx/</code> (PROJECT, CONTEXT, TASKS, DECISIONS, CHANGELOG, HANDOFF .md và project.json). Khôi phục chỉ thêm dự án chưa có, không ghi đè dự án trên máy.</p>
    </div>
  )
}
