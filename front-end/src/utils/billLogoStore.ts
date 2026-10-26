const DB_NAME = 'money-managment'
const STORE = 'bill-logos'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'))
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
        const request = run(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Logo storage failed.'))
      }),
  )
}

export async function setBillLogo(key: string, dataUrl: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(dataUrl, key))
}

export async function getBillLogo(key: string): Promise<string | null> {
  const result = await runTransaction<string | undefined>('readonly', (store) => store.get(key))
  return result ?? null
}

export async function deleteBillLogo(key: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(key))
}

export async function listAllBillLogos(): Promise<{ key: string; dataUrl: string }[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const results: { key: string; dataUrl: string }[] = []
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve(results)
        return
      }
      results.push({ key: String(cursor.key), dataUrl: String(cursor.value) })
      cursor.continue()
    }
    request.onerror = () => reject(request.error ?? new Error('Could not read logos.'))
  })
}

export async function replaceAllBillLogos(entries: ReadonlyArray<{ key: string; dataUrl: string }>) {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    for (const entry of entries) {
      store.put(entry.dataUrl, entry.key)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Could not restore logos.'))
  })
}
