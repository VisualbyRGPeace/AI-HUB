import { useEffect, useState } from 'react'
import { useDialogs, type DialogItem } from '../dialogStore'

function DialogView({ d }: { d: DialogItem }) {
  const close = useDialogs(s => s.close)
  const [value, setValue] = useState(d.defaultValue)
  const submit = () => close(d.id, d.kind === 'prompt' ? value : true)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close(d.id, null) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [d.id, close])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) close(d.id, null) }}>
      <form role="alertdialog" aria-modal="true" aria-label={d.message} className="w-full max-w-sm space-y-4 rounded-lg border border-ink/25 bg-paper p-4"
        onSubmit={e => { e.preventDefault(); submit() }}>
        <p className="whitespace-pre-line text-sm">{d.message}</p>
        {d.kind === 'prompt' && <input className="input" autoFocus value={value} onChange={e => setValue(e.target.value)} />}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => close(d.id, null)}>Hủy</button>
          <button type="submit" className="btn btn-primary" autoFocus={d.kind === 'confirm'}>{d.confirmLabel}</button>
        </div>
      </form>
    </div>
  )
}

export default function Dialogs() {
  const d = useDialogs(s => s.queue[0])
  return d ? <DialogView key={d.id} d={d} /> : null
}
