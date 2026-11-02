// Lưu file trong IndexedDB của trình duyệt này (không phải cloud).
export interface FileRec { id: string; projectId: string; folder: string; name: string; size: number; mime: string; createdAt: string; blob: Blob }
export interface FolderRec { key: string; projectId: string; name: string }
type Store = 'files' | 'folders'

const open = (): Promise<IDBDatabase> => new Promise((res, rej) => {
  const r = indexedDB.open('aihub-files', 1)
  r.onupgradeneeded = () => { r.result.createObjectStore('files', { keyPath: 'id' }); r.result.createObjectStore('folders', { keyPath: 'key' }) }
  r.onsuccess = () => res(r.result)
  r.onerror = () => rej(r.error)
})

async function tx<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((res, rej) => {
    const t = db.transaction(store, mode)
    const rq = fn(t.objectStore(store))
    t.oncomplete = () => { res(rq.result); db.close() }
    t.onerror = t.onabort = () => { rej(t.error ?? new Error('Lỗi lưu trữ (có thể hết dung lượng).')); db.close() }
  })
}

export const fileDb = {
  all: <T>(s: Store) => tx<T[]>(s, 'readonly', o => o.getAll() as IDBRequest<T[]>),
  put: (s: Store, v: FileRec | FolderRec) => tx(s, 'readwrite', o => o.put(v)),
  del: (s: Store, k: string) => tx(s, 'readwrite', o => o.delete(k)),
}
