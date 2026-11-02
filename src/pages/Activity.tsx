import { Trash2 } from 'lucide-react'
import { useActivity } from '../activityStore'

export default function Activity() {
  const { items, clear } = useActivity()
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h1 className="mr-auto text-xl font-semibold">Activity History</h1>
        {items.length > 0 && <button className="btn" onClick={() => { if (confirm('Xóa toàn bộ lịch sử hoạt động?')) clear() }}><Trash2 size={14} /> Xóa lịch sử</button>}
      </div>
      <p className="text-xs text-slate-500">Ghi lại các thao tác thành công trên trình duyệt này (tối đa 200 mục).</p>
      {items.length === 0 ? <div className="card text-center text-slate-500">Chưa có hoạt động nào.</div> : (
        <div className="card divide-y divide-slate-200 p-0 dark:divide-slate-800">
          {items.map(a => (
            <div key={a.id} className="flex gap-3 px-4 py-2 text-sm">
              <span className="w-40 shrink-0 text-xs text-slate-500">{new Date(a.at).toLocaleString()}</span>
              <span>{a.text}</span>
            </div>))}
        </div>)}
    </div>
  )
}
