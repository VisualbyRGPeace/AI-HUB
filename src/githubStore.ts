import { create } from 'zustand'

// Token chỉ nằm trong sessionStorage: mất khi đóng tab, không bao giờ vào code/repo.
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* ignore */ } },
  del: (k: string) => { try { sessionStorage.removeItem(k) } catch { /* ignore */ } } }
const ls = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } } }

interface S {
  token: string | null; login: string | null; repo: string
  connect: (token: string, login: string) => void
  disconnect: () => void
  setRepo: (r: string) => void
}
export const useGitHub = create<S>((set) => ({
  token: ss.get('aihub:gh'), login: ss.get('aihub:ghlogin'), repo: ls.get('aihub:ghrepo') ?? '',
  connect: (token, login) => { ss.set('aihub:gh', token); ss.set('aihub:ghlogin', login); set({ token, login }) },
  disconnect: () => { ss.del('aihub:gh'); ss.del('aihub:ghlogin'); set({ token: null, login: null }) },
  setRepo: repo => { ls.set('aihub:ghrepo', repo); set({ repo }) },
}))
