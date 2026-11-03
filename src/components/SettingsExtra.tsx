import { useRef, useState } from 'react'
import { Download, Moon, Sun, Trash2, Upload } from 'lucide-react'
import { useUI } from '../store'
import { useAccounts, type Account } from '../accountsStore'
import { isProjectLike, useProjects } from '../projectsStore'
import { useActivity } from '../activityStore'
import { fileDb, type FileRec } from '../lib/fileDb'
import { browserManager } from '../lib/browserManager'
import { download } from '../lib/handoff'
import { toast } from '../toastStore'

const isAccount = (x: unknown): x is Account => {
  const a = x as Account
  return !!a && typeof a.id === 'string' && typeof a.providerId === 'string' && typeof a.displayName === 'string' && typeof a.website === 'string'
}

export default function SettingsExtra() {
  const { theme, toggleTheme } = useUI()
  const accounts = useAccounts(s => s.accounts)
  const projects = useProjects(s => s.projects)
  const file = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState(browserManager.isLocalEnabled())
  const status = browserManager.getIntegrationStatus()

  const exportAll = () => {
    download('ai-hub-backup.json', JSON.stringify({ app: 'ai-hub', version: 1, exportedAt: new Date().toISOString(), accounts, projects }, null, 2), 'application/json')
    toast.success('Đã xuất dữ liệu (không gồm file trong File Manager).')
  }
  const importAll = async (f?: File) => {
    if (!f) return
    try {
      const d = JSON.parse(await f.text())
      const accs = (Array.isArray(d.accounts) ? d.accounts : []).filter(isAccount) as Account[]
      const projs = (Array.isArray(d.projects) ? d.projects : []).filter(isProjectLike)
      if (!accs.length && !projs.length) return toast.error('File không hợp lệ hoặc rỗng.')
      const have = new Set(useAccounts.getState().accounts.map(a => a.id))
      const newAccs = accs.filter(a => !have.has(a.id))
      useAccounts.setState({ accounts: [...useAccounts.getState().accounts, ...newAccs] })
      const addedProjects = useProjects.getState().importAll(projs)
      toast.success(`Đã nhập ${newAccs.length} tài khoản và ${addedProjects} dự án mới.`)
    } catch { toast.error('Không đọc được file JSON.') }
    if (file.current) file.current.value = ''
  }
  const clearAll = async () => {
    if (!confirm('Xóa TOÀN BỘ dữ liệu AI HUB trong trình duyệt này (tài khoản, dự án, lịch sử, file)? Không thể hoàn tác.')) return
    if (prompt('Gõ XOA để xác nhận:') !== 'XOA') return toast.error('Đã hủy.')
    try {
      useAccounts.setState({ accounts: [] }); useProjects.setState({ projects: [] }); useActivity.getState().clear()
      for (const f of await fileDb.all<FileRec>('files')) await fileDb.del('files', f.id)
      for (const d of await fileDb.all<{ key: string }>('folders')) await fileDb.del('folders', d.key)
      toast.success('Đã xóa toàn bộ dữ liệu cục bộ.')
    } catch (e) { toast.error((e as Error).message) }
  }

  return (
    <>
      <div className="card space-y-2">
        <b>Appearance</b>
        <button className="btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Đang dùng giao diện {theme === 'dark' ? 'tối' : 'sáng'} — bấm để đổi</button>
      </div>
      <div className="card space-y-2">
        <b>Browser Integration</b>
        <p className="text-sm text-slate-500">Chế độ hiện tại: <b>{local ? 'Local Browser Manager' : 'External Browser'}</b>. {status.note}</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={local} onChange={e => { browserManager.setLocalEnabled(e.target.checked); setLocal(e.target.checked); toast.success(e.target.checked ? 'Đã bật Local Browser Manager.' : 'Đã tắt Local Browser Manager.') }} />
          Dùng Local Browser Manager (chỉ tick sau khi đã cài AI HUB Launcher trên Windows)
        </label>
        <p className="text-xs text-slate-500">Cần Chrome trên Windows và tệp cài đặt đi kèm. Mỗi tài khoản nhập tên thư mục profile Chrome (Default, Profile 1…) ở trang AI Accounts.</p>
      </div>
      <div className="card space-y-3">
        <b>Data Management</b>
        <p className="text-xs text-slate-500">Hiện có {accounts.length} tài khoản và {projects.length} dự án trong trình duyệt này. File trong File Manager không nằm trong bản xuất JSON.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={exportAll}><Download size={14} /> Xuất tất cả (JSON)</button>
          <button className="btn" onClick={() => file.current?.click()}><Upload size={14} /> Nhập từ JSON</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={e => importAll(e.target.files?.[0])} />
          <button className="btn" onClick={clearAll}><Trash2 size={14} /> Xóa toàn bộ dữ liệu</button>
        </div>
      </div>
    </>
  )
}
