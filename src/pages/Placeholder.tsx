export default function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="card text-center">
      <h1 className="mb-1 text-xl font-semibold">{title}</h1>
      <p className="text-sm text-slate-500">Chưa triển khai — sẽ làm ở Phase {phase}.</p>
    </div>
  )
}
