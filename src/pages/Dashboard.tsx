import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ExternalLink, Folder, Plus, UserRound } from 'lucide-react'
import { PROVIDERS } from '../data/providers'
import { useAccounts } from '../accountsStore'
import { useProjects } from '../projectsStore'
import { browserManager } from '../lib/browserManager'
import { fmtDate } from '../lib/format'
import { Empty, PageHeader, Section } from '../components/ui'
import ProviderIcon from '../components/ProviderIcon'

const Stat = ({ to, label, value }: { to: string; label: string; value: number }) => (
  <Link to={to} className="bg-paper p-4 transition-colors hover:bg-soft">
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
    <div className="text-sm text-mute">{label}</div>
  </Link>
)

export default function Dashboard() {
  const nav = useNavigate()
  const accounts = useAccounts(s => s.accounts)
  const projects = useProjects(s => s.projects)
  const active = projects.filter(p => p.status === 'active').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const quick = [...accounts].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)).slice(0, 6)

  return (
    <div className="space-y-8">
      <PageHeader title="Tổng quan">
        <button className="btn btn-primary" onClick={() => nav('/projects', { state: { create: true } })}><Plus size={16} />Dự án mới</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <Stat to="/accounts" label="Tài khoản AI" value={accounts.length} />
        <Stat to="/projects" label="Đang làm" value={active.length} />
        <Stat to="/projects" label="Hoàn thành" value={projects.filter(p => p.status === 'completed').length} />
      </div>

      <Section title="Tiếp tục làm việc" action={projects.length > 0 && <Link className="text-sm text-mute hover:text-ink" to="/projects">Tất cả dự án</Link>}>
        {active.length === 0 ? (
          <Empty icon={Folder} text="Chưa có dự án đang làm.">
            <button className="btn btn-primary" onClick={() => nav('/projects', { state: { create: true } })}><Plus size={16} />Tạo dự án</button>
          </Empty>
        ) : (
          <div className="list">
            {active.slice(0, 3).map(p => (
              <div key={p.id} className="row">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-mute">{PROVIDERS[p.providerId]?.name ?? 'AI'} · cập nhật {fmtDate(p.updatedAt)}</div>
                </div>
                <Link className="btn" to={`/workspace/${p.id}`}>Tiếp tục<ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Mở nhanh AI" action={accounts.length > 0 && <Link className="text-sm text-mute hover:text-ink" to="/accounts">Quản lý</Link>}>
        {quick.length === 0 ? (
          <Empty icon={UserRound} text="Chưa có tài khoản AI.">
            <button className="btn btn-primary" onClick={() => nav('/accounts', { state: { create: true } })}><Plus size={16} />Thêm tài khoản</button>
          </Empty>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quick.map(a => (
              <button key={a.id} className="btn h-12 justify-start gap-3 px-4" onClick={() => browserManager.openAccount(a)}>
                <ProviderIcon id={a.providerId} size={18} />
                <span className="min-w-0 flex-1 truncate text-left">{a.displayName}</span>
                <ExternalLink size={14} className="text-mute" />
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
