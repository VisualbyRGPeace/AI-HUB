import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// null khi chưa cấu hình => app chạy Offline Mode bình thường.
// Chỉ dùng anon key (công khai theo thiết kế). Bảo mật dựa vào RLS, không dựa vào việc giấu key.
export const supabase = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } })
  : null
