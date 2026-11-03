import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Eye, File as FileIcon, FileArchive, FileCode, FileImage, FilePlus, FileText, FolderPlus, Pencil, Search, Trash2, Upload } from 'lucide-react'
import { useProjects } from '../projectsStore'
import { fileDb, type FileRec, type FolderRec } from '../lib/fileDb'
import { downloadBlob } from '../lib/handoff'
import { fmtDate, fmtSize } from '../lib/format'
import { confirmDialog, promptDialog } from '../dialogStore'
import { toast } from '../toastStore'
import { Empty, IconButton, PageHeader } from '../components/ui'
import Modal from '../components/Modal'

const TYPES: Record<string, { label: string; ext: string[] }> = {
  image: { label: 'Hình ảnh', ext: ['png', 'jpg', 'jpeg', 'svg'] },
  document: { label: 'Tài liệu', ext: ['pdf', 'docx', 'xlsx', 'pptx'] },
  text: { label: 'Văn bản', ext: ['txt', 'md', 'json'] },
  code: { label: 'Mã nguồn', ext: ['js', 'ts', 'jsx', 'tsx', 'css', 'html'] },
  archive: { label: 'Nén', ext: ['zip'] },
}
const ALLOWED = Object.values(TYPES).flatMap(t => t.ext)
const TEXT_EXT = [...TYPES.text.ext, ...TYPES.code.ext]
const MAX = 25 * 1024 * 1024
const ext = (n: string) => n.split('.').pop()?.toLowerCase() ?? ''
const iconFor = (name: string) => {
  const e = ext(name)
  if (TYPES.image.ext.includes(e)) return FileImage
  if (TYPES.code.ext.includes(e)) return FileCode
  if (TYPES.text.ext.includes(e) || e === 'pdf' || TYPES.document.ext.includes(e)) return FileText
  if (TYPES.archive.ext.includes(e)) return FileArchive
  return FileIcon
}

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

  const load = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([fileDb.all<FileRec>('files'), fileDb.all<FolderRec>('folders')])
      setFiles(f); setFolders(d); setError(null)
      const e = await navigator.storage?.estimate?.()
      if (e?.usage != null && e.quota) setUsage(`Đã dùng ${fmtSize(e.usage)} / ${fmtSize(e.quota)}`)
    } catch (e) { setError((e as Error).message || 'Không mở được kho lưu trữ.') }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])

  const myFolders = folders.filter(f => f.projectId === pid)
  const list = useMemo(() => files.filter(f => f.projectId === pid
    && (folder === null || f.folder === folder)
    && f.name.toLowerCase().includes(q.trim().toLowerCase())
    && (type === 'all' || TYPES[type]?.ext.includes(ext(f.name)))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [files, pid, folder, q, type])

  const upload = async (picked: FileList | null) => {
    if (!picked) return
    let ok = 0
    for (const file of Array.from(picked)) {
      if (!ALLOWED.includes(ext(file.name))) { toast.error(`"${file.name}": loại tệp chưa được hỗ trợ.`); continue }
      if (file.size > MAX) { toast.error(`"${file.name}" vượt quá 25 MB.`); continue }
      try {
        await fileDb.put('files', { id: crypto.randomUUID(), projectId: pid, folder: folder ?? '', name: file.name, size: file.size, mime: file.type, createdAt: new Date().toISOString(), blob: file })
        ok++
      } catch (e) { toast.error(`"${file.name}": ${(e as Error).message}`) }
    }
    if (ok) toast.success(`Đã lưu ${ok} tệp.`)
    if (input.current) input.current.value = ''
    load()
  }
  const newFolder = async () => {
    const name = (await promptDialog('Tên thư mục mới', '', 'Tạo'))?.trim()
    if (!name) return
    if (name.length > 40) return toast.error('Tên thư mục tối đa 40 ký tự.')
    if (myFolders.some(f => f.name === name)) return toast.error('Thư mục đã tồn tại.')
    try { await fileDb.put('folders', { key: `${pid}/${name}`, projectId: pid, name }); toast.success(`Đã tạo thư mục "${name}".`); setFolder(name); load() }
    catch (e) { toast.error((e as Error).message) }
  }
  const delFolder = async () => {
    if (!folder) return
    if (files.some(f => f.projectId === pid && f.folder === folder)) return toast.error('Thư mục còn tệp, hãy xóa tệp trước.')
    try { await fileDb.del('folders', `${pid}/${folder}`); setFolder(null); toast.success('Đã xóa thư mục.'); load() }
    catch (e) { toast.error((e as Error).message) }
  }
  const rename = async (f: FileRec) => {
    const name = (await promptDialog('Tên tệp mới', f.name))?.trim()
    if (!name || name === f.name) return
    if (ext(name) !== ext(f.name)) return toast.error('Không đổi được phần mở rộng của tệp.')
    try { await fileDb.put('files', { ...f, name }); toast.success('Đã đổi tên tệp.'); load() } catch (e) { toast.error((e as Error).message) }
  }
  const remove = async (f: FileRec) => {
    if (!(await confirmDialog(`Xóa tệp "${f.name}"?`, 'Xóa'))) return
    try { await fileDb.del('files', f.id); toast.success(`Đã xóa "${f.name}".`); load() } catch (e) { toast.error((e as Error).message) }
  }
  const show = async (f: FileRec) => {
    const e = ext(f.name)
    if (TEXT_EXT.includes(e)) return setPreview({ f, text: (await f.blob.text()).slice(0, 200000) })
    if (TYPES.image.ext.includes(e) || e === 'pdf') return setPreview({ f, url: URL.createObjectURL(f.blob) })
    setPreview({ f })
  }

  return (
    <div>
      <PageHeader title="Tệp">
        <select className="input w-auto max-w-[200px]" aria-label="Dự án" value={pid} onChange={e => { setPid(e.target.value); setFolder(null) }}>
          <option value="general">Chung</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => input.current?.click()}><Upload size={16} />Tải lên</button>
        <input ref={input} type="file" multiple hidden accept={ALLOWED.map(e => '.' + e).join(',')} onChange={e => upload(e.target.files)} />
      </PageHeader>

      {loading ? <p className="py-10 text-center text-sm text-mute">Đang tải…</p>
        : error ? <Empty icon={FileIcon} text={error} />
        : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {[{ k: null, label: 'Tất cả' }, { k: '', label: 'Gốc' }, ...myFolders.map(f => ({ k: f.name, label: f.name }))].map(x => (
                <button key={String(x.k)} className={`btn ${folder === x.k ? 'btn-primary' : ''}`} onClick={() => setFolder(x.k)}>{x.label}</button>
              ))}
              <IconButton label="Thư mục mới" icon={FolderPlus} onClick={newFolder} />
              {folder && <IconButton label="Xóa thư mục này" icon={Trash2} onClick={delFolder} />}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-mute" />
                <input className="input pl-9" placeholder="Tìm tệp" aria-label="Tìm tệp" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <select className="input w-auto" aria-label="Loại tệp" value={type} onChange={e => setType(e.target.value)}>
                <option value="all">Mọi loại</option>
                {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </div>

            {list.length === 0 ? (
              <Empty icon={FilePlus} text="Chưa có tệp nào ở đây.">
                <button className="btn" onClick={() => input.current?.click()}><Upload size={16} />Tải lên</button>
              </Empty>
            ) : (
              <div className="list">
                {list.map(f => { const Icon = iconFor(f.name); return (
                  <div key={f.id} className="row">
                    <Icon size={18} className="text-mute" />
                    <div className="min-w-0 flex-1 basis-40">
                      <div className="truncate text-sm">{f.name}</div>
                      <div className="text-xs text-mute">{fmtSize(f.size)} · {fmtDate(f.createdAt)}{f.folder && ` · ${f.folder}`}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconButton label="Xem" icon={Eye} onClick={() => show(f)} />
                      <IconButton label="Tải xuống" icon={Download} onClick={() => downloadBlob(f.name, f.blob)} />
                      <IconButton label="Đổi tên" icon={Pencil} onClick={() => rename(f)} />
                      <IconButton label="Xóa" icon={Trash2} onClick={() => remove(f)} />
                    </div>
                  </div>
                )})}
              </div>
            )}
            <p className="text-xs text-mute">Tệp lưu trong trình duyệt này, tối đa 25 MB mỗi tệp. {usage}</p>
          </div>
        )}

      {preview && (
        <Modal title={preview.f.name} wide onClose={() => setPreview(null)}>
          {preview.text != null ? <pre className="whitespace-pre-wrap break-words text-xs">{preview.text}</pre>
            : preview.url && ext(preview.f.name) === 'pdf' ? <iframe src={preview.url} title={preview.f.name} className="h-[70vh] w-full rounded-lg border border-line" />
            : preview.url ? <img src={preview.url} alt={preview.f.name} className="mx-auto max-h-[70vh] max-w-full" />
            : <p className="text-sm text-mute">Không xem trước được loại tệp này. Hãy tải xuống để mở.</p>}
        </Modal>
      )}
    </div>
  )
}
