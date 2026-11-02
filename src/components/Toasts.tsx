import { useToasts } from '../toastStore'

export default function Toasts() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} onClick={() => dismiss(t.id)}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm text-white shadow-lg ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
