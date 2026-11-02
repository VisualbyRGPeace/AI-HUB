import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Eye, FolderPlus, Pencil, Trash2, Upload, X } from 'lucide-react'
import { useProjects } from '../projectsStore'
import { fileDb, type FileRec, type FolderRec } from '../lib/fileDb'
import { toast } from '../toastStore'

const TYPES: Record<string, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'svg'], document: ['pdf', 'docx', 'xlsx', 'pptx'],
  text: ['txt', 'md', 'json'], code: ['js', 'ts', 'jsx', 'tsx', 'css', 'html'], archive: ['zip'],
}
const ALLOWED = Object.values(TYPES).flat()
const TEXT_EXT = [...TYPES.text, ...TYPES.code]
const MAX = 25 * 1024 * 1024
const ext = (n: string) => n.split('.').pop()?.toLowerCase() ?? ''
const size = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export default function Files() {
  const projects = useProjects(s => s.projects)
  const [pid, setPid] = useState('general')
  const [folder, setFolder] = useState<string | null>(null) // null = tất cả
  const [files, setFiles] = useState<FileRec[]>([])
  const [folders, setFolders] = useState<FolderRec[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [preview, setPreview] = useState<{ f: FileRec; url?: string; text?: string } | null>(null)
  const [usage, setUsage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const box = 'rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'

  const load = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([fileDb.all<FileRec>('files'), fileDb.all<FolderRec>('folders')])
      setFiles(f); setFolders(d); setError(null)
      const e = await navigator.storage?.estimate?.()
      if (e?.usage != null && e.quota) setUsage(`Đã dùng ${size(e.usage)} / ~${size(e.quota)} của trình duyệt`)
    } catch (e) { setError((e as Error).message || 'Không mở được kho lưu trữ.') }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])

  const myFolders = folders.filter(f => f.projectId === pid)
  const list = useMemo(() => files.filter(f => f.projectId === pid
    && (folder === null || f.folder === folder)
    && f.name.toLowerCase().includes(q.toLowerCase())
    && (type === 'all' || TYPES[type]?.includes(ext(f.name)))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [files, pid, folder, q, type])

  const upload = async (picked: FileList | null) => {
    if (!picked) return
    let ok = 0
    for (const file of Array.from(picked)) {
      if (!ALLOWED.includes(ext(file.name))) { toast.error(`"${file.name}": loại file không được hỗ trợ.`); continue }
      if (file.size > MAX) { toast.error(`"${file.name}" vượt quá 25 MB.`); continue }
      try {
        await fileDb.put('files', { id: crypto.randomUUID(), projectId: pid, folder: folder ?? '', name: file.name, size: file.size, mime: file.type, createdAt: new Date().toISOString(), blob: file })
        ok++
      } catch (e) { toast.error(`"${file.name}": ${(e as Error).message}`) }
    }
    if (ok) toast.success(`Đã lưu ${ok} file vào trình duyệt.`)
    if (input.current) input.current.value = ''
    load()
  }
  const newFolder = async () => {
    const name = prompt('Tên thư mục:')?.trim()
    if (!name) return
    if (myFolders.some(f => f.name === name)) return toast.error('Thư mục đã tồn tại.')
    await fileDb.put('folders', { key: `${pid}/${name}`, projectId: pid, name }); toast.success(`Đã tạo thư mục "${name}".`); load()
  }
  const delFolder = async () => {
    if (!folder) return
    if (files.some(f => f.projectId === pid && f.folder === folder)) return toast.error('Thư mục còn file, hãy xóa file trước.')
    await fileDb.del('folders', `${pid}/${folder}`); setFolder(null); toast.success('Đã xóa thư mục.'); load()
  }
  const rename = async (f: FileRec) => {
    const name = prompt('Tên mới:', f.name)?.trim()
    if (!name || name === f.name) return
    if (ext(name) !== ext(f.name)) return toast.error('Không đổi phần mở rộng file.')
    await fileDb.put('files', { ...f, name }); toast.success('Đã đổi tên.'); load()
  }
  const remove = async (f: FileRec) => { if (confirm(`Xóa "${f.name}"?`)) { await fileDb.del('files', f.id); toast.success(`Đã xóa "${f.name}".`); load() } }
  const save = (f: FileRec) => { const a = document.createElement('a'); a.href = URL.createObjectURL(f.blob); a.download = f.name; a.click(); URL.revokeObjectURL(a.href) }
  const show = async (f: FileRec) => {
    const e = ext(f.name)
    if (TEXT_EXT.includes(e)) return setPreview({ f, text: (await f.blob.text()).slice(0, 200000) })
    if (TYPES.image.includes(e) || e === 'pdf') return setPreview({ f, url: URL.createObjectURL(f.blob) })
    setPreview({ f })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">File Manager</h1>
        <select className={box} value={pid} onChange={e => { setPid(e.target.value); setFolder(null) }}>
          <option value="general">Chung (không thuộc dự án)</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => input.current?.click()}><Upload size={16} /> Upload</button>
        <input ref={input} type="file" multiple hidden accept={ALLOWED.map(e => '.' + e).join(',')} onChange={e => upload(e.target.files)} />
      </div>
      <p className="text-xs text-slate-500">File lưu trong trình duyệt này (IndexedDB), không lên cloud. Tối đa 25 MB/file. {usage}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button className={`btn ${folder === null ? 'btn-primary' : ''}`} onClick={() => setFolder(null)}>Tất cả</button>
        <button className={`btn ${folder === '' ? 'btn-primary' : ''}`} onClick={() => setFolder('')}>Gốc</button>
        {myFolders.map(f => <button key={f.key} className={`btn ${folder === f.name ? 'btn-primary' : ''}`} onClick={() => setFolder(f.name)}>{f.name}</button>)}
        <button className="btn" onClick={newFolder}><FolderPlus size={14} /> Thư mục mới</button>
        {folder && <button className="btn" onClick={delFolder}><Trash2 size={14} /> Xóa thư mục</button>}
        <input className={`${box} ml-auto max-w-[180px]`} placeholder="Tìm file…" value={q} onChange={e => setQ(e.target.value)} />
        <select className={box} value={type} onChange={e => setType(e.target.value)}>
          <option value="all">Mọi loại</option>{Object.keys(TYPES).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div className="card text-center text-slate-500">Đang tải…</div>
        : error ? <div className="card text-center text-red-500">Lỗi: {error}</div>
        : list.length === 0 ? <div className="card text-center text-slate-500">Chưa có file. Bấm Upload để thêm.</div> : (
        <div className="card divide-y divide-slate-200 p-0 dark:divide-slate-800">
          {list.map(f => (
            <div key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{f.name}{f.folder && <span className="ml-2 text-xs text-slate-500">/{f.folder}</span>}</span>
              <span className="text-xs text-slate-500">{size(f.size)} · {new Date(f.createdAt).toLocaleDateString()}</span>
              <button className="btn" onClick={() => show(f)} aria-label="Xem"><Eye size={14} /></button>
              <button className="btn" onClick={() => save(f)} aria-label="Tải xuống"><Download size={14} /></button>
              <button className="btn" onClick={() => rename(f)} aria-label="Đổi tên"><Pencil size={14} /></button>
              <button className="btn" onClick={() => remove(f)} aria-label="Xóa"><Trash2 size={14} /></button>
            </div>))}
        </div>)}

      {preview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="card flex max-h-[90vh] w-full max-w-3xl flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex"><b className="mr-auto truncate">{preview.f.name}</b><button onClick={() => setPreview(null)} aria-label="Đóng"><X size={18} /></button></div>
            <div className="min-h-0 flex-1 overflow-auto">
              {preview.text != null ? <pre className="whitespace-pre-wrap break-words text-xs">{preview.text}</pre>
                : preview.url && ext(preview.f.name) === 'pdf' ? <iframe src={preview.url} title={preview.f.name} className="h-[70vh] w-full" />
                : preview.url ? <img src={preview.url} alt={preview.f.name} className="mx-auto max-h-[70vh]" />
                : <p className="text-sm text-slate-500">Không xem trước được loại file này. Hãy tải xuống để mở.</p>}
            </div>
          </div>
        </div>)}
    </div>
  )
}
