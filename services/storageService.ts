import { User, PinResult, GeneratedImage } from '../types';

const STORAGE_KEYS = {
  USER: 'pingenie_user',
};

const DB_NAME = 'AesthryaDB';
const DB_VERSION = 1;
const STORES = {
  PINS: 'pins',
  IMAGES: 'images'
};

// IndexedDB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.PINS)) {
        db.createObjectStore(STORES.PINS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
      }
    };
  });
};

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const storageService = {
  // Auth - Keep User in LocalStorage for synchronous initial checks
  login: (email: string): User => {
    const user: User = {
      id: btoa(email),
      email,
      name: email.split('@')[0]
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  // Pin Storage (IndexedDB)
  savePins: async (userId: string, pins: PinResult[]) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PINS, 'readwrite');
    const store = tx.objectStore(STORES.PINS);
    
    // Add userId to pin object for filtering later
    const timestamp = Date.now();
    for (const pin of pins) {
        // We cast to any to append userId for storage, although it's not in the PinResult type
        const pinWithUser = { ...pin, userId, createdAt: pin.createdAt || timestamp };
        store.put(pinWithUser);
    }
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },

  getPins: async (userId: string): Promise<PinResult[]> => {
    const allPins = await getAllFromStore<PinResult & { userId: string }>(STORES.PINS);
    // Filter by user ID
    return allPins
      .filter(p => p.userId === userId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  updatePinImage: async (userId: string, pinId: string, base64Image: string) => {
     const db = await openDB();
     return new Promise<void>((resolve, reject) => {
         const tx = db.transaction(STORES.PINS, 'readwrite');
         const store = tx.objectStore(STORES.PINS);
         const req = store.get(pinId);
         
         req.onsuccess = () => {
             const data = req.result;
             if (data) {
                 data.base64Image = base64Image;
                 data.isGeneratingImage = false;
                 store.put(data);
             }
         };
         tx.oncomplete = () => resolve();
         tx.onerror = () => reject(tx.error);
     });
  },

  // Image Storage (IndexedDB)
  saveImage: async (userId: string, image: GeneratedImage) => {
     const db = await openDB();
     const tx = db.transaction(STORES.IMAGES, 'readwrite');
     const store = tx.objectStore(STORES.IMAGES);
     const imgWithUser = { ...image, userId };
     store.put(imgWithUser);
     return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
     });
  },

  getImages: async (userId: string): Promise<GeneratedImage[]> => {
    const allImages = await getAllFromStore<GeneratedImage & { userId: string }>(STORES.IMAGES);
    return allImages
      .filter(i => i.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
};