
import { Episode } from '../types';

const DB_NAME = 'SwedenPodcastDB';
const STORE_NAME = 'downloads';
const DB_VERSION = 1;

export interface DownloadedItem {
  episode: Episode;
  blob: Blob;
  savedAt: number;
}

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveDownload = async (episode: Episode, blob: Blob) => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.put({
    id: episode.id,
    episode,
    blob,
    savedAt: Date.now()
  });
};

export const getAllDownloads = async (): Promise<DownloadedItem[]> => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteDownload = async (id: string) => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.delete(id);
};

export const clearAllDownloads = async () => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
};
