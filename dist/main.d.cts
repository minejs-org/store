import { Signal } from '@minejs/signals';

/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types.d.ts
//
// Made with ❤️ by Maysara.



// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    type StorageType = 'local' | 'session' | 'memory';

    interface StorageOptions {
        type?           : StorageType
        prefix?         : string
        serialize?      : (value: any) => string
        deserialize?    : (value: string) => any
        ttl?            : number // Time to live in milliseconds
    }

    interface StorageItem<T> {
        value           : T
        timestamp       : number
        ttl?            : number
    }

    interface StoreConfig<T> {
        state           : T
        persist?        : boolean
        storage?        : Storage
        storageKey?     : string
        middleware?     : ((state: T, action: any) => void)[]
    }

declare class Storage {
    private storage;
    private prefix;
    private serialize;
    private deserialize;
    constructor(options?: StorageOptions);
    /**
     * Get item from storage
     */
    get<T = any>(key: string, defaultValue?: T): T | null;
    /**
     * Set item in storage
     */
    set<T = any>(key: string, value: T, ttl?: number): void;
    /**
     * Remove item from storage
     */
    remove(key: string): void;
    /**
     * Clear all items
     */
    clear(): void;
    /**
     * Get all keys
     */
    keys(): string[];
    /**
     * Check if key exists
     */
    has(key: string): boolean;
}
/**
 * Create a reactive signal backed by storage
 */
declare function createStorageSignal<T>(key: string, defaultValue: T, storage?: Storage): Signal<T>;
declare const localStorage: Storage;
declare const sessionStorage: Storage;
declare const memoryStorage: Storage;

declare class Store<T extends Record<string, any>> {
    private _state;
    private config;
    private subscribers;
    constructor(config: StoreConfig<T>);
    /**
     * Get state (reactive)
     */
    get state(): {
        [K in keyof T]: Signal<T[K]>;
    };
    /**
     * Get snapshot (non-reactive)
     */
    getSnapshot(): T;
    /**
     * Set state (batch update)
     */
    setState(updates: Partial<T>): void;
    /**
     * Subscribe to state changes
     */
    subscribe(callback: () => void): () => void;
    private notify;
    /**
     * Reset to initial state
     */
    reset(): void;
    /**
     * Clear persisted data
     */
    clearPersisted(): void;
}
/**
 * Create a global store
 */
declare function createStore<T extends Record<string, any>>(config: StoreConfig<T>): Store<T>;

declare class IndexedDBStorage {
    private dbName;
    private storeName;
    private db;
    constructor(dbName?: string, storeName?: string);
    private openDB;
    get<T = any>(key: string): Promise<T | null>;
    set<T = any>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}

export { IndexedDBStorage, Storage, type StorageItem, type StorageOptions, type StorageType, Store, type StoreConfig, createStorageSignal, createStore, localStorage, memoryStorage, sessionStorage };
