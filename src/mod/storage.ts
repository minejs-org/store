/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/Storage.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { signal, effect, type Signal } from '@minejs/signals';
    import * as types from '../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Storage {
        private storage: globalThis.Storage | Map<string, string>;
        private prefix: string;
        private serialize: (value: any) => string;
        private deserialize: (value: string) => any;

        constructor(options: types.StorageOptions = {}) {
            const type = options.type || 'local';
            this.prefix = options.prefix || 'crux:';
            this.serialize = options.serialize || JSON.stringify;
            this.deserialize = options.deserialize || JSON.parse;

            // Select storage backend
            switch (type) {
                case 'local':
                    this.storage = globalThis.localStorage;
                    break;
                case 'session':
                    this.storage = globalThis.sessionStorage;
                    break;
                case 'memory':
                    this.storage = new Map();
                    break;
            }
        }

        /**
         * Get item from storage
         */
        public get<T = any>(key: string, defaultValue?: T): T | null {
            const fullKey = this.prefix + key;

            try {
                const raw = this.storage instanceof Map
                    ? this.storage.get(fullKey)
                    : this.storage.getItem(fullKey);

                if (raw === null || raw === undefined) {
                    return defaultValue !== undefined ? defaultValue : null;
                }

                const item: types.StorageItem<T> = this.deserialize(raw);

                // Check TTL
                if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                    this.remove(key);
                    return defaultValue !== undefined ? defaultValue : null;
                }

                return item.value;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue !== undefined ? defaultValue : null;
            }
        }

        /**
         * Set item in storage
         */
        public set<T = any>(key: string, value: T, ttl?: number): void {
            const fullKey = this.prefix + key;

            try {
                const item: types.StorageItem<T> = {
                    value,
                    timestamp: Date.now(),
                    ttl
                };

                const raw = this.serialize(item);

                if (this.storage instanceof Map) {
                    this.storage.set(fullKey, raw);
                } else {
                    this.storage.setItem(fullKey, raw);
                }
            } catch (error) {
                console.error('Storage set error:', error);
            }
        }

        /**
         * Remove item from storage
         */
        public remove(key: string): void {
            const fullKey = this.prefix + key;

            try {
                if (this.storage instanceof Map) {
                    this.storage.delete(fullKey);
                } else {
                    this.storage.removeItem(fullKey);
                }
            } catch (error) {
                console.error('Storage remove error:', error);
            }
        }

        /**
         * Clear all items
         */
        public clear(): void {
            try {
                if (this.storage instanceof Map) {
                    this.storage.clear();
                } else {
                    // Only clear items with our prefix
                    const keys = Object.keys(this.storage);
                    keys.forEach(key => {
                        if (key.startsWith(this.prefix)) {
                            (this.storage as globalThis.Storage).removeItem(key);
                        }
                    });
                }
            } catch (error) {
                console.error('Storage clear error:', error);
            }
        }

        /**
         * Get all keys
         */
        public keys(): string[] {
            try {
                if (this.storage instanceof Map) {
                    return Array.from(this.storage.keys())
                        .filter(key => key.startsWith(this.prefix))
                        .map(key => key.slice(this.prefix.length));
                } else {
                    return Object.keys(this.storage)
                        .filter(key => key.startsWith(this.prefix))
                        .map(key => key.slice(this.prefix.length));
                }
            } catch (error) {
                console.error('Storage keys error:', error);
                return [];
            }
        }

        /**
         * Check if key exists
         */
        public has(key: string): boolean {
            return this.get(key) !== null;
        }
    }

    /**
     * Create a reactive signal backed by storage
     */
    export function createStorageSignal<T>(
        key: string,
        defaultValue: T,
        storage: Storage = localStorage
    ): Signal<T> {
        // Initialize with stored value
        const initialValue = storage.get<T>(key, defaultValue);
        const sig = signal<T>(initialValue!);

        // Sync to storage on change
        effect(() => {
            storage.set(key, sig());
        });

        // Listen to storage events (for cross-tab sync)
        if (storage === localStorage || storage === sessionStorage) {
            window.addEventListener('storage', (e) => {
                if (e.key === key && e.newValue) {
                    try {
                        const item: types.StorageItem<T> = JSON.parse(e.newValue);
                        sig.set(item.value);
                    } catch {
                        // Ignore parse errors
                    }
                }
            });
        }

        return sig;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    export const localStorage   = new Storage({ type: 'local' });
    export const sessionStorage = new Storage({ type: 'session' });
    export const memoryStorage  = new Storage({ type: 'memory' });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝

