/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/IndexedDBStorage.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗


// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class IndexedDBStorage {
        private dbName: string;
        private storeName: string;
        private db: IDBDatabase | null = null;

        constructor(dbName = 'crux-db', storeName = 'store') {
            this.dbName = dbName;
            this.storeName = storeName;
        }

        private async openDB(): Promise<IDBDatabase> {
            if (this.db) return this.db;

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
            });
        }

        public async get<T = any>(key: string): Promise<T | null> {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || null);
            });
        }

        public async set<T = any>(key: string, value: T): Promise<void> {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(value, key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }

        public async remove(key: string): Promise<void> {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }

        public async clear(): Promise<void> {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }

        public async keys(): Promise<string[]> {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAllKeys();

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result as string[]);
            });
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
