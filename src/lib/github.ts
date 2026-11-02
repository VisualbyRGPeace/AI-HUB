import { DOC_KEYS, useProjects, type DocKey, type Project } from '../projectsStore'

const API = 'https://api.github.com'
export interface Repo { full_name: string; private: boolean }
export interface Commit { sha: string; commit: { message: string; author: { date: string } } }

async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, { ...init, headers: {
    Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28',
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  if (!r.ok) {
    const m = await r.json().catch(() => ({} as { message?: string }))
    throw Object.assign(new Error(m.message || `GitHub lỗi ${r.status}`), { status: r.status })
  }
  return r.json() as Promise<T>
}
const enc = (s: string) => btoa(unescape(encodeURIComponent(s)))
const dec = (b: string) => decodeURIComponent(escape(atob(b.replace(/\n/g, ''))))
const url = (p: string) => p.split('/').map(encodeURIComponent).join('/')

export const getUser = (t: string) => gh<{ login: string }>(t, '/user')
export const listRepos = (t: string) => gh<Repo[]>(t, '/user/repos?per_page=100&sort=updated')
export const listCommits = (t: string, repo: string) => gh<Commit[]>(t, `/repos/${repo}/commits?per_page=10`)

async function readFile(t: string, repo: string, path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const f = await gh<{ content: string; sha: string }>(t, `/repos/${repo}/contents/${url(path)}`)
    return { content: dec(f.content), sha: f.sha }
  } catch (e) { if ((e as { status?: number }).status === 404) return null; throw e }
}
async function listDir(t: string, repo: string, path = ''): Promise<{ name: string; type: string }[]> {
  try { return await gh(t, `/repos/${repo}/contents/${url(path)}`) } catch (e) { if ((e as { status?: number }).status === 404) return []; throw e }
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
const dirOf = (p: Project) => `${slug(p.name)}-${p.id.slice(0, 8)}`
const tasksMd = (p: Project) => `# TASKS\n\n${p.tasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.text}`).join('\n') || '(chưa có)'}\n`

function filesOf(p: Project): Record<string, string> {
  const { tasks, docs, ...meta } = p
  const out: Record<string, string> = { 'TASKS.md': tasksMd(p), 'project.json': JSON.stringify({ ...meta, tasks }, null, 2) }
  for (const k of DOC_KEYS) out[`${k}.md`] = docs[k]
  return out
}

// Sao lưu tuần tự (tránh xung đột commit); bỏ qua file không đổi.
export async function backup(t: string, repo: string, projects: Project[]) {
  let written = 0, skipped = 0
  for (const p of projects) {
    for (const [name, content] of Object.entries(filesOf(p))) {
      const path = `${dirOf(p)}/${name}`
      const cur = await readFile(t, repo, path)
      if (cur && cur.content === content) { skipped++; continue }
      await gh(t, `/repos/${repo}/contents/${url(path)}`, { method: 'PUT', body: JSON.stringify({ message: `AI HUB: cập nhật ${path}`, content: enc(content), ...(cur ? { sha: cur.sha } : {}) }) })
      written++
    }
  }
  return { written, skipped }
}

// Khôi phục: chỉ thêm dự án chưa có ở máy này (không ghi đè dự án local).
export async function restore(t: string, repo: string): Promise<{ added: number; existing: number }> {
  const local = useProjects.getState().projects
  let added = 0, existing = 0
  const fresh: Project[] = []
  for (const d of await listDir(t, repo)) {
    if (d.type !== 'dir' || d.name.startsWith('.')) continue
    const meta = await readFile(t, repo, `${d.name}/project.json`)
    if (!meta) continue
    const m = JSON.parse(meta.content) as Omit<Project, 'docs'>
    if (!m.id || !m.name) continue
    if (local.some(x => x.id === m.id)) { existing++; continue }
    const docs = {} as Record<DocKey, string>
    for (const k of DOC_KEYS) docs[k] = (await readFile(t, repo, `${d.name}/${k}.md`))?.content ?? ''
    fresh.push({ ...m, tasks: m.tasks ?? [], docs }); added++
  }
  if (fresh.length) useProjects.setState({ projects: [...fresh, ...local] })
  return { added, existing }
}
