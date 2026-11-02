import { Link } from 'react-router-dom'
import { Plus, FolderPlus, Play, ExternalLink } from 'lucide-react'
import { DEMO_ACCOUNTS, DEMO_PROJECTS, PROVIDERS } from '../data/providers'

const Stat = ({ label, v }: { label: string; v: number }) => (
  <div className="card"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-500">{label}</div></div>
)

export default function Dashboard() {
  const accounts = DEMO_ACCOUNTS, projects = DEMO_PROJECTS
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
        Demo Mode: dữ liệu bên dưới là mẫu, chưa lưu ở đâu cả. Chưa có kết nối Supabase/GitHub.
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">AI Accounts</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          {Object.values(PROVIDERS).map(p => (
            <div key={p.id} className="card flex items-center gap-3 py-3">
              <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
              <b>{p.name}</b><span className="text-slate-500">{accounts.filter(a => a.providerId === p.id).length} accounts</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(a => { const p = PROVIDERS[a.providerId]; return (
            <div key={a.id} className="card">
              <div className="mb-1 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} /><b>{a.displayName}</b></div>
              <div className="mb-3 text-xs text-slate-500">{p.name} · {a.profile} · Chưa cấu hình tích hợp</div>
              <a className="btn" href={p.website} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open</a>
            </div>
          )})}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Projects</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Tổng" v={projects.length} />
          <Stat label="Đang hoạt động" v={projects.filter(p => p.status === 'active').length} />
          <Stat label="Hoàn thành" v={projects.filter(p => p.status === 'completed').length} />
        </div>
      </section>
      <section className="flex flex-wrap gap-3">
        <Link className="btn btn-primary" to="/projects"><FolderPlus size={16} /> New Project</Link>
        <Link className="btn" to="/accounts"><Plus size={16} /> Add AI Account</Link>
        <Link className="btn" to="/workspace"><Play size={16} /> Resume Project</Link>
      </section>
    </div>
  )
}
