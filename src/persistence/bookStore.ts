export const MAX_PERSIST_BYTES = 150 * 1024 * 1024;

const DB_NAME = 'escrivaninha';
const STORE = 'books';
const CURRENT_KEY = 'current';

export interface StoredBook {
  name: string;
  size: number;
  pageCount: number;
  blob?: Blob;
  savedAt: number;
}

// Formato interno para armazenar no IndexedDB (Blob não é bem suportado por fake-indexeddb).
interface StoredBookRecord {
  name: string;
  size: number;
  pageCount: number;
  blobData?: ArrayBuffer;
  blobType?: string;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    let completed = false;
    const closeDb = () => {
      if (!completed) {
        completed = true;
        db.close();
      }
    };
    try {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        closeDb();
        reject(req.error);
      };
      tx.onerror = () => {
        closeDb();
        reject(tx.error);
      };
      tx.onabort = () => {
        closeDb();
        reject(new Error('Transaction aborted'));
      };
      tx.oncomplete = () => {
        closeDb();
      };
    } catch (e) {
      closeDb();
      reject(e);
    }
  }));
}

function isStoredBookRecord(v: unknown): v is StoredBookRecord {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  // fake-indexeddb pode não preservar instanceof ArrayBuffer, então checamos se é "tipo de dados".
  const isBlobData = (val: unknown) => val === undefined || (typeof val === 'object' && val !== null && typeof (val as { byteLength?: unknown }).byteLength === 'number');
  return typeof o.name === 'string' && typeof o.size === 'number'
    && typeof o.pageCount === 'number' && typeof o.savedAt === 'number'
    && isBlobData(o.blobData)
    && (o.blobType === undefined || typeof o.blobType === 'string');
}

export async function saveCurrentBook(book: Omit<StoredBook, 'savedAt'>): Promise<void> {
  // Acima do teto guardamos só metadados: o usuário reabre o arquivo e a
  // página salva no localStorage é reaproveitada.
  try {
    let blobData: ArrayBuffer | undefined;
    let blobType: string | undefined;
    if (book.size <= MAX_PERSIST_BYTES && book.blob) {
      // blob.arrayBuffer() puxa até 150 MB em memória transitoriamente (arquivo + Blob ambos held).
      // Por isso o branch acima-teto deliberadamente nunca toca o blob.
      blobData = await book.blob.arrayBuffer();
      blobType = book.blob.type;
    }

    const record: StoredBookRecord = {
      name: book.name,
      size: book.size,
      pageCount: book.pageCount,
      blobData,
      blobType,
      savedAt: Date.now(),
    };
    await withStore('readwrite', (s) => s.put(record, CURRENT_KEY));
  } catch (e) {
    console.error('Não foi possível persistir o livro', e);
  }
}

export async function loadCurrentBook(): Promise<StoredBook | null> {
  try {
    const r = await withStore<unknown>('readonly', (s) => s.get(CURRENT_KEY));
    if (!r) return null;
    if (!isStoredBookRecord(r)) return null;

    let blob: Blob | undefined;
    if (r.blobData) {
      blob = new Blob([r.blobData], { type: r.blobType || '' });
    }

    const result: StoredBook = {
      name: r.name,
      size: r.size,
      pageCount: r.pageCount,
      blob,
      savedAt: r.savedAt,
    };
    return result;
  } catch {
    return null;
  }
}

export async function clearCurrentBook(): Promise<void> {
  try { await withStore('readwrite', (s) => s.delete(CURRENT_KEY)); } catch { /* silencioso */ }
}
