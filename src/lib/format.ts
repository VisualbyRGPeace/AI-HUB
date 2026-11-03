export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '')
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
export const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
