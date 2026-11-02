import { useAccounts, type Account } from '../accountsStore'

export type IntegrationMode = 'external' | 'local'
export interface IntegrationStatus { mode: IntegrationMode; localAvailable: boolean; note: string }

// Abstraction layer. Hiện chỉ có External Browser Mode; Local Browser Manager chưa tồn tại.
export const browserManager = {
  openAccount(account: Account) {
    window.open(account.website, '_blank', 'noopener,noreferrer')
    useAccounts.getState().touch(account.id)
  },
  getBrowserProfiles(): string[] {
    return [] // cần ứng dụng local; chưa có
  },
  getIntegrationStatus(): IntegrationStatus {
    return { mode: 'external', localAvailable: false, note: 'Mở website chính thức; bạn tự quản lý phiên đăng nhập.' }
  },
  setDefaultAccount(id: string) {
    useAccounts.getState().setDefault(id)
  },
}
