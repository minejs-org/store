<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.1-black"/>
    <img src="https://img.shields.io/badge/🔥-@minejs-black"/>
    <br>
    <img src="https://img.shields.io/badge/coverage-98.39%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs/store?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs/store?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > **_Lightweight reactive state management with optional persistence._**

    - ### Setup

        > install [`space`](https://github.com/solution-lib/space) first.

        ```bash
        space i @minejs/store @minejs/signals
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Usage

        ```ts
        import { createStore, Storage, IndexedDBStorage, createStorageSignal } from '@minejs/store'
        import { signal } from '@minejs/signals'
        ```

        - ### 1. Basic Store

            ```typescript
            // Create a store with initial state
            const store = createStore({
                state: {
                    count   : 0,
                    name    : 'John'
                }
            })

            // Read state (reactive)
            const countSignal = store.state.count
            console.log(countSignal()) // 0

            // Update state
            store.setState({ count: 5 })
            console.log(countSignal()) // 5

            // Get snapshot (non-reactive)
            const snapshot = store.getSnapshot()
            console.log(snapshot) // { count: 5, name: 'John' }
            ```

        - ### 2. Persistent Store

            ```typescript
            // Create storage instance
            const storage = new Storage({ type: 'local' })

            // Create store with persistence
            const userStore = createStore({
                state: {
                    username    : 'user123',
                    theme       : 'dark'
                },
                persist         : true,
                storage,
                storageKey      : 'app'
            })

            // Changes are automatically persisted
            userStore.setState({ theme: 'light' })
            // Data saved to localStorage as 'app:theme'
            ```

        - ### 3. Reactive Subscriptions

            ```typescript
            const store = createStore({
                state: { count: 0 }
            })

            // Subscribe to state changes
            const unsubscribe = store.subscribe(() => {
                console.log('State changed!', store.getSnapshot())
            })

            store.setState({ count: 5 })
            // Logs: "State changed! { count: 5 }"

            // Unsubscribe
            unsubscribe()
            store.setState({ count: 10 })
            // Nothing logged
            ```

        - ### 4. Storage Types

            ```typescript
            // Local Storage (persists across sessions)
            const localStore = new Storage({ type: 'local' })

            // Session Storage (cleared on tab close)
            const sessionStore = new Storage({ type: 'session' })

            // Memory Storage (cleared on page reload)
            const memStore = new Storage({ type: 'memory' })

            // Pre-configured instances
            localStorage.set('key', 'value')
            const value = localStorage.get('key')
            ```

        - ### 5. IndexedDB Storage

            ```typescript
            const idbStore = new IndexedDBStorage('myapp-db', 'app-store')

            // Async operations
            await idbStore.set('user', { id: 1, name: 'John' })
            const user = await idbStore.get('user')

            await idbStore.remove('user')
            await idbStore.clear()
            const keys = await idbStore.keys()
            ```

        - ### 6. Storage Signals

            ```typescript
            const storage = new Storage({ type: 'local' })

            // Create reactive signal backed by storage
            const theme = createStorageSignal('theme', 'light', storage)

            console.log(theme()) // 'light'
            theme.set('dark')

            // Value persisted and synced across tabs
            console.log(storage.get('theme')) // 'dark'
            ```

    <br>

- ## API Reference 🔥

    - #### `createStore<T>(config: StoreConfig<T>): Store<T>`
        > Create a reactive state store.

        ```typescript
        interface StoreConfig<T> {
            state: T                        // Initial state
            persist?    : boolean           // Enable persistence
            storage?    : Storage           // Storage backend
            storageKey? : string            // Prefix for persisted keys
        }

        const store = createStore({
            state       : { count: 0, name: 'App' },
            persist     : true,
            storage     : new Storage({ type: 'local' }),
            storageKey  : 'myapp'
        })
        ```

    - #### `Store<T>.state: { [K in keyof T]: Signal<T[K]> }`

        > Access reactive state signals.

        ```typescript
        const store = createStore({ state: { count: 0 } })

        const countSignal = store.state.count
        countSignal()                   // Read
        countSignal.set(5)              // Write
        countSignal.update(n => n + 1)  // Update
        ```

    - #### `Store<T>.getSnapshot(): T`

        > Get non-reactive state snapshot.

        ```typescript
        const store = createStore({ state: { count: 0 } })

        const snapshot = store.getSnapshot()
        // { count: 0 } - regular object, not reactive
        ```

    - #### `Store<T>.setState(updates: Partial<T>): void`

        > Update multiple state properties (batched).

        ```typescript
        store.setState({
            count   : 10,
            name    : 'Updated'
        })
        // All updates applied at once
        ```

    - #### `Store<T>.subscribe(callback: () => void): () => void`

        > Listen to state changes.

        ```typescript
        const unsubscribe = store.subscribe(() => {
            console.log('State changed!')
        })

        unsubscribe() // Stop listening
        ```

    - #### `Store<T>.reset(): void`

        > Reset to initial state.

        ```typescript
        store.setState({ count: 100 })
        store.reset()
        // Back to initial state
        ```

    - #### `Store<T>.clearPersisted(): void`

        > Clear persisted data from storage.

        ```typescript
        store.clearPersisted()
        // Removes all persisted keys for this store
        ```

    - #### `Storage`

        > Unified storage interface for local, session, or memory storage.

        ```typescript
        const storage = new Storage({
            type        : 'local',          // 'local' | 'session' | 'memory'
            prefix      : 'myapp:',         // Key prefix
            serialize   : JSON.stringify,   // Custom serializer
            deserialize : JSON.parse,       // Custom deserializer
            ttl         : 3600000           // Optional TTL in ms
        })

        storage.set('key', { data: 'value' }, 3600000)
        const value = storage.get('key')
        storage.remove('key')
        storage.clear()
        storage.keys()                  // All keys
        storage.has('key')              // Check existence
        ```

    - #### `IndexedDBStorage`

        > Async IndexedDB storage for large data.

        ```typescript
        const idb = new IndexedDBStorage('db-name', 'store-name')

        await idb.set('key', value)
        const value = await idb.get('key')
        await idb.remove('key')
        await idb.clear()
        const keys = await idb.keys()
        ```

    - #### `createStorageSignal<T>(key: string, defaultValue: T, storage?: Storage): Signal<T>`

        > Create signal synced with storage.

        ```typescript
        const theme = createStorageSignal('theme', 'light', localStorage)

        theme()           // Read from storage
        theme.set('dark') // Write to storage + sync across tabs
        ```

    - #### Pre-configured Instances

        ```typescript
        import { localStorage, sessionStorage, memoryStorage } from '@minejs/store'

        // Ready-to-use storage instances
        localStorage.set('key', 'value')
        sessionStorage.get('key')
        memoryStorage.clear()
        ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->
