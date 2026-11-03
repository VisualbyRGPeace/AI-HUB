import { useAccounts, type Account } from '../accountsStore'

export type IntegrationMode = 'external' | 'local'
export interface IntegrationStatus { mode: IntegrationMode; localAvailable: boolean; note: string }

// Thư mục profile Chrome hợp lệ: Default, Profile 1, Profile 2…
export const PROFILE_RE = /^(Default|Profile \d{1,3})$/
const KEY = 'aihub:localbrowser'

function flag(): boolean { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

// Abstraction layer. External: mở tab mới. Local: gọi aihub:// (cần cài AI HUB Launcher trên Windows).
export const browserManager = {
  isLocalEnabled: flag,
  setLocalEnabled(on: boolean) { try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* ignore */ } },

  openAccount(account: Account) {
    if (flag() && PROFILE_RE.test(account.profile)) {
      // Không thể tự biết launcher đã cài chưa; người dùng tự bật tùy chọn này sau khi cài.
      const a = document.createElement('a')
      a.href = `aihub://open?profile=${encodeURIComponent(account.profile)}&url=${encodeURIComponent(account.website)}`
      a.click()
    } else {
      window.open(account.website, '_blank', 'noopener,noreferrer')
    }
    useAccounts.getState().touch(account.id)
  },
  getBrowserProfiles(): string[] {
    return [] // trình duyệt không cho web liệt kê profile; người dùng nhập tay tên thư mục
  },
  getIntegrationStatus(): IntegrationStatus {
    return flag()
      ? { mode: 'local', localAvailable: true, note: 'Đang bật: tài khoản có profile hợp lệ sẽ mở bằng đúng profile Chrome qua AI HUB Launcher; tài khoản khác vẫn mở ở tab mới.' }
      : { mode: 'external', localAvailable: false, note: 'Đang tắt: mở website chính thức ở tab mới, bạn tự quản lý phiên đăng nhập.' }
  },
  setDefaultAccount(id: string) {
    useAccounts.getState().setDefault(id)
  },
}
