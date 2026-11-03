import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Đã xảy ra lỗi</h1>
        <p className="text-sm text-mute">{this.state.error.message}</p>
        <p className="text-xs text-mute">Dữ liệu của bạn vẫn an toàn trong trình duyệt.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>Tải lại trang</button>
      </div>
    )
  }
}
