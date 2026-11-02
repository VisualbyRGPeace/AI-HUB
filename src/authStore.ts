import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

interface S {
  user: User | null
  loading: boolean
  init: () => void
  signInGithub: () => Promise<string | null>
  signInEmail: (email: string, password: string) => Promise<string | null>
  signUpEmail: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuth = create<S>((set) => ({
  user: null,
  loading: !!supabase,
  init: () => {
    if (!supabase) return set({ loading: false })
    supabase.auth.getSession().then(({ data }) => set({ user: data.session?.user ?? null, loading: false }))
    supabase.auth.onAuthStateChange((_e, session) => set({ user: session?.user ?? null, loading: false }))
  },
  // redirectTo không kèm #hash để tương thích HashRouter
  signInGithub: async () => {
    const { error } = await supabase!.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin + window.location.pathname } })
    return error?.message ?? null
  },
  signInEmail: async (email, password) => (await supabase!.auth.signInWithPassword({ email, password })).error?.message ?? null,
  signUpEmail: async (email, password) => (await supabase!.auth.signUp({ email, password })).error?.message ?? null,
  signOut: async () => { await supabase?.auth.signOut(); set({ user: null }) },
}))

useAuth.getState().init()
