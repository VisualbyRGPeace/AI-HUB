import { History, Trash2 } from 'lucide-react'
import { useActivity } from '../activityStore'
import { fmtDateTime } from '../lib/format'
import { confirmDialog } from '../dialogStore'
import { Empty, PageHeader } from '../components/ui'

export default function Activity() {
  const { items, clear } = useActivity()
  return (
    <div>
      <PageHeader title="Lịch sử">
        {items.length > 0 && (
          <button className="btn" onClick={async () => { if (await confirmDialog('Xóa toàn bộ lịch sử hoạt động?', 'Xóa')) clear() }}><Trash2 size={14} />Xóa lịch sử</button>
        )}
      </PageHeader>
      {items.length === 0 ? <Empty icon={History} text="Chưa có hoạt động nào." /> : (
        <div className="list">
          {items.map(a => (
            <div key={a.id} className="flex flex-wrap gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-xs leading-5 text-mute tabular-nums">{fmtDateTime(a.at)}</span>
              <span className="min-w-0 flex-1">{a.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
