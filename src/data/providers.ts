// Provider registry: nơi DUY NHẤT định nghĩa nhà cung cấp AI.
export interface Provider { id: string; name: string; website: string; color: string; description: string }

export const PROVIDERS: Record<string, Provider> = {
  claude:  { id: 'claude',  name: 'Claude',  website: 'https://claude.ai',         color: '#d97757', description: 'Anthropic' },
  chatgpt: { id: 'chatgpt', name: 'ChatGPT', website: 'https://chatgpt.com',       color: '#10a37f', description: 'OpenAI' },
  gemini:  { id: 'gemini',  name: 'Gemini',  website: 'https://gemini.google.com', color: '#4285f4', description: 'Google' },
}

export interface AIAccount { id: string; providerId: string; displayName: string; profile: string }
export interface Project { id: string; name: string; status: 'active' | 'completed' | 'archived'; updatedAt: string }

// Dữ liệu DEMO — chỉ hiển thị ở Demo Mode.
export const DEMO_ACCOUNTS: AIAccount[] = [
  { id: 'a1', providerId: 'claude',  displayName: 'Claude Personal',  profile: 'Profile 1' },
  { id: 'a2', providerId: 'claude',  displayName: 'Claude Work',      profile: 'Profile 2' },
  { id: 'a3', providerId: 'gemini',  displayName: 'Gemini Personal',  profile: 'Profile 1' },
  { id: 'a4', providerId: 'chatgpt', displayName: 'ChatGPT Personal', profile: 'Profile 3' },
]
export const DEMO_PROJECTS: Project[] = [
  { id: 'p1', name: 'Resource Library', status: 'active',    updatedAt: '2026-10-12' },
  { id: 'p2', name: 'Song Roulette',    status: 'completed', updatedAt: '2026-10-08' },
  { id: 'p3', name: 'Ngày trọng đại',   status: 'active',    updatedAt: '2026-09-29' },
]
