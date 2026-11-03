// Provider registry: nơi DUY NHẤT định nghĩa nhà cung cấp AI.
export interface Provider { id: string; name: string; website: string; description: string }

export const PROVIDERS: Record<string, Provider> = {
  claude:  { id: 'claude',  name: 'Claude',  website: 'https://claude.ai',         description: 'Anthropic' },
  chatgpt: { id: 'chatgpt', name: 'ChatGPT', website: 'https://chatgpt.com',       description: 'OpenAI' },
  gemini:  { id: 'gemini',  name: 'Gemini',  website: 'https://gemini.google.com', description: 'Google' },
}
