import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ClipboardCopy, Download, ExternalLink, FileText, Folder, Play, Plus, Save, Trash2 } from 'lucide-react'
import { PROVIDERS } from '../data/providers'
import { DOC_KEYS, useProjects, type DocKey } from '../projectsStore'
import { useAccounts } from '../accountsStore'
import { browserManager } from '../lib/browserManager'
import { buildContext, buildResume, copy, download, exportMarkdown, handoffTemplate } from '../lib/handoff'
import { fmtDate } from '../lib/format'
import { toast } from '../toastStore'
import { Empty, IconButton, PageHeader } from '../components/ui'

type Tab = DocKey | 'TASKS'
const TABS: Tab[] = ['PROJECT', 'CONTEXT', 'TASKS', 'DECISIONS', 'CHANGELOG', 'HANDOFF']

// Soạn thảo tài liệu: lưu tự động sau 0,5 giây ngừng gõ, và luôn lưu khi rời tab/trang (không mất chữ).
function DocEditor({ id, k }: { id: string; k: DocKey }) {
  const setDoc = useProjects(s => s.setDoc)
  const stored = useProjects(s => s.projects.find(p => p.id === id)?.docs[k] ?? '')
  const [text, setText] = useState(stored)
  const latest = useRef(stored)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (dirty.current) { dirty.current = false; setDoc(id, k, latest.current) }
  }, [id, k, setDoc])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [flush])

  // Nội dung đổi từ bên ngoài (vd: Tạo bản bàn giao) khi không đang gõ dở.
  useEffect(() => {
    if (!dirty.current && stored !== latest.current) { latest.current = stored; setText(stored) }
  }, [stored])

  return (
    <textarea className="input min-h-[360px] font-mono leading-relaxed" value={text} aria-label={k} spellCheck={false}
      placeholder={`Nội dung ${k} (tự động lưu)`}
      onChange={e => {
        latest.current = e.target.value; dirty.current = true; setText(e.target.value)
        clearTimeout(timer.current); timer.current = setTimeout(flush, 500)
      }}
      onBlur={flush} />
  )
}

function WorkspaceList() {
  const projects = useProjects(s => s.projects).filter(p => p.status !== 'archived').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <div>
      <PageHeader title="Làm việc" />
      {projects.length === 0 ? (
        <Empty icon={Folder} text="Chưa có dự án để làm việc.">
          <Link className="btn btn-primary" to="/projects" state={{ create: true }}><Plus size={16} />Tạo dự án</Link>
        </Empty>
      ) : (
        <div className="list">
          {projects.map(p => (
            <Link key={p.id} to={`/workspace/${p.id}`} className="row transition-colors hover:bg-soft">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-xs text-mute">{PROVIDERS[p.providerId]?.name ?? 'AI'} · cập nhật {fmtDate(p.updatedAt)}</div>
              </div>
              <ArrowRight size={16} className="text-mute" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkspaceDetail({ id }: { id: string }) {
  const { projects, addTask, toggleTask, removeTask, logProgress, update, setDoc } = useProjects()
  const accounts = useAccounts(s => s.accounts)
  const [tab, setTab] = useState<Tab>('CONTEXT')
  const [next, setNext] = useState('')
  const [accId, setAccId] = useState('')
  const [summary, setSummary] = useState('')
  const [task, setTask] = useState('')
  const p = projects.find(x => x.id === id)

  if (!p) return <Empty icon={Folder} text="Không tìm thấy dự án."><Link className="btn" to="/projects">Về danh sách dự án</Link></Empty>

  const nextId = next || p.providerId
  const candidates = accounts.filter(a => a.providerId === p.providerId)
  const chosen = candidates.find(a => a.id === accId) || candidates.find(a => a.isDefault) || candidates[0]
  const doCopy = async (text: string, ok: string) => ((await copy(text)) ? toast.info(ok) : toast.error('Không sao chép được. Hãy thử lại.'))
  const submitTask = () => { if (task.trim()) { addTask(p.id, task.trim()); setTask('') } }
  const aiName = (pid: string) => PROVIDERS[pid]?.name ?? 'AI'

  return (
    <div className="space-y-5">
      <PageHeader title={p.name}>
        <select className="input w-auto" aria-label="AI của dự án" value={p.providerId} onChange={e => update(p.id, { providerId: e.target.value })}>
          {Object.values(PROVIDERS).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        {candidates.length > 1 && (
          <select className="input w-auto" aria-label="Tài khoản" value={chosen?.id} onChange={e => setAccId(e.target.value)}>
            {candidates.map(a => <option key={a.id} value={a.id}>{a.displayName}</option>)}
          </select>
        )}
        <button className="btn btn-primary" onClick={() => (chosen ? browserManager.openAccount(chosen) : window.open(PROVIDERS[p.providerId]?.website, '_blank', 'noopener,noreferrer'))}>
          <ExternalLink size={14} />Mở {aiName(p.providerId)}
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn" onClick={() => doCopy(buildContext(p), 'Đã sao chép bối cảnh.')}><ClipboardCopy size={14} />Sao chép bối cảnh</button>
        <select className="input w-auto" aria-label="AI nhận bàn giao" value={nextId} onChange={e => setNext(e.target.value)}>
          {Object.values(PROVIDERS).map(x => <option key={x.id} value={x.id}>Chuyển cho {x.name}</option>)}
        </select>
        <button className="btn" onClick={() => doCopy(buildResume(p, aiName(nextId)), 'Đã sao chép prompt tiếp tục.')}><Play size={14} />Prompt tiếp tục</button>
        <button className="btn" onClick={() => { setDoc(p.id, 'HANDOFF', handoffTemplate(p, aiName(nextId))); setTab('HANDOFF'); toast.success('Đã tạo bản bàn giao.') }}><FileText size={14} />Tạo bàn giao</button>
        <IconButton label="Xuất tệp .md" icon={Download} onClick={() => download(`${p.name}.md`, exportMarkdown(p), 'text/markdown')} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${tab === t ? 'border-ink font-medium' : 'border-transparent text-mute hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'TASKS' ? (
        <div className="space-y-3">
          {p.tasks.length === 0 ? <p className="py-6 text-center text-sm text-mute">Chưa có công việc. Thêm việc đầu tiên bên dưới.</p> : (
            <div className="list">
              {p.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(p.id, t.id)} aria-label={t.text} />
                  <span className={`mr-auto ${t.done ? 'text-mute line-through' : ''}`}>{t.text}</span>
                  <IconButton label="Xóa công việc" icon={Trash2} className="btn btn-icon btn-ghost" onClick={() => removeTask(p.id, t.id)} />
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input className="input" placeholder="Thêm công việc" aria-label="Thêm công việc" value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitTask() }} />
            <button className="btn" onClick={submitTask}><Plus size={14} />Thêm</button>
          </div>
        </div>
      ) : <DocEditor key={`${p.id}:${tab}`} id={p.id} k={tab} />}

      <div className="card space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Ghi tiến độ</h2>
          <p className="text-xs text-mute">Phiên này đã làm gì? Nội dung sẽ được thêm vào CHANGELOG.</p>
        </div>
        <textarea className="input" rows={2} aria-label="Tóm tắt phiên làm việc" value={summary} onChange={e => setSummary(e.target.value)} />
        <button className="btn" onClick={() => { if (!summary.trim()) return toast.error('Hãy nhập tóm tắt trước khi lưu.'); logProgress(p.id, summary.trim()); setSummary(''); toast.success('Đã ghi tiến độ vào CHANGELOG.') }}>
          <Save size={14} />Lưu tiến độ
        </button>
      </div>
    </div>
  )
}

export default function Workspace() {
  const { id } = useParams()
  // key theo id để reset trạng thái cục bộ khi chuyển sang dự án khác
  return id ? <WorkspaceDetail key={id} id={id} /> : <WorkspaceList />
}
