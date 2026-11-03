import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col rounded-t-xl border border-ink/25 bg-paper sm:rounded-lg ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <h2 className="mr-auto truncate text-sm font-semibold">{title}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Đóng" title="Đóng"><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
