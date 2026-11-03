import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useToasts } from '../toastStore'

const STYLE = {
  success: 'border-ink bg-ink text-paper',
  info: 'border-ink bg-ink text-paper',
  error: 'border-ink bg-paper text-ink',
} as const
const ICON = { success: CheckCircle2, info: Info, error: AlertCircle } as const

export default function Toasts() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map(t => {
        const Icon = ICON[t.type]
        return (
          <button key={t.id} onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm ${STYLE[t.type]}`}>
            <Icon size={16} className="mt-0.5" /><span>{t.text}</span>
          </button>
        )
      })}
    </div>
  )
}
