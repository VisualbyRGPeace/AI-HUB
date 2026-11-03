import { useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { toAccount, useAccounts, type Account } from '../accountsStore'
import { isProjectLike, useProjects } from '../projectsStore'
import { useActivity } from '../activityStore'
import { fileDb } from '../lib/fileDb'
import { browserManager } from '../lib/browserManager'
import { download } from '../lib/handoff'
import { confirmDialog, promptDialog } from '../dialogStore'
import { toast } from '../toastStore'

const isAccount = (x: unknown): x is Account => {
  const a = x as Account
  return !!a && typeof a.id === 'string' && typeof a.providerId === 'string' && typeof a.displayName === 'string' && typeof a.website === 'string'
}

export function DataPanel() {
  const accounts = useAccounts(s => s.accounts)
  const projects = useProjects(s => s.projects)
  const file = useRef<HTMLInputElement>(null)

  const exportAll = () => {
    download('ai-hub-backup.json', JSON.stringify({ app: 'ai-hub', version: 1, exportedAt: new Date().toISOString(), accounts, projects }, null, 2), 'application/json')
    toast.success('Đã xuất dữ liệu (không gồm tệp trong mục Tệp).')
  }

  const importAll = async (f?: File) => {
    if (!f) return
    try {
      const d = JSON.parse(await f.text())
      // Chấp nhận bản xuất đầy đủ {accounts, projects} hoặc một mảng dự án thuần
      const accs = (Array.isArray(d?.accounts) ? d.accounts : []).filter(isAccount).map(toAccount)
      const projs = (Array.isArray(d) ? d : Array.isArray(d?.projects) ? d.projects : []).filter(isProjectLike)
      if (!accs.length && !projs.length) return toast.error('Tệp không hợp lệ hoặc không có dữ liệu.')
      const a = useAccounts.getState().merge(accs)
      const p = useProjects.getState().importAll(projs)
      toast.success(`Đã nhập ${a} tài khoản và ${p} dự án mới.`)
    } catch { toast.error('Không đọc được tệp JSON.') }
    finally { if (file.current) file.current.value = '' }
  }

  const clearAll = async () => {
    if (!(await confirmDialog('Xóa TOÀN BỘ dữ liệu trong trình duyệt này (tài khoản, dự án, lịch sử, tệp)? Không thể hoàn tác.', 'Tiếp tục'))) return
    if ((await promptDialog('Gõ XOA để xác nhận xóa.', '', 'Xóa tất cả'))?.trim().toUpperCase() !== 'XOA') return toast.error('Đã hủy, chưa xóa gì.')
    try {
      useAccounts.setState({ accounts: [] }); useProjects.setState({ projects: [] }); useActivity.getState().clear()
      await fileDb.clearAll()
      toast.success('Đã xóa toàn bộ dữ liệu.')
    } catch (e) { toast.error((e as Error).message) }
  }

  return (
    <div className="card space-y-3">
      <p className="text-sm text-mute">Hiện có {accounts.length} tài khoản và {projects.length} dự án. Dữ liệu chỉ nằm trong trình duyệt này, hãy xuất ra tệp để sao lưu.</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={exportAll}><Download size={14} />Xuất JSON</button>
        <button className="btn" onClick={() => file.current?.click()}><Upload size={14} />Nhập JSON</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => importAll(e.target.files?.[0])} />
        <button className="btn" onClick={clearAll}><Trash2 size={14} />Xóa tất cả</button>
      </div>
    </div>
  )
}

export function BrowserPanel() {
  const [local, setLocal] = useState(browserManager.isLocalEnabled())
  const status = browserManager.getIntegrationStatus()
  return (
    <div className="card space-y-3">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5" checked={local} onChange={e => {
          browserManager.setLocalEnabled(e.target.checked); setLocal(e.target.checked)
          toast.success(e.target.checked ? 'Đã bật Local Browser Manager.' : 'Đã tắt Local Browser Manager.')
        }} />
        <span>
          Mở bằng đúng profile Chrome
          <span className="block text-xs text-mute">Chỉ bật sau khi đã cài AI HUB Launcher trên Windows. Khi tắt, tài khoản mở ở tab mới.</span>
        </span>
      </label>
      <p className="text-xs text-mute">{status.note}</p>
    </div>
  )
}
