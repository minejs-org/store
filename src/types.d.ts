/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types.d.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { Storage } from './mod/storage';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type StorageType = 'local' | 'session' | 'memory';

    export interface StorageOptions {
        type?           : StorageType
        prefix?         : string
        serialize?      : (value: any) => string
        deserialize?    : (value: string) => any
        ttl?            : number // Time to live in milliseconds
    }

    export interface StorageItem<T> {
        value           : T
        timestamp       : number
        ttl?            : number
    }

    export interface StoreConfig<T> {
        state           : T
        persist?        : boolean
        storage?        : Storage
        storageKey?     : string
        middleware?     : ((state: T, action: any) => void)[]
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝