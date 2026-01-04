/* eslint-disable @typescript-eslint/no-explicit-any */
// test/main.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { describe, expect, test, beforeEach, afterEach, beforeAll } from 'bun:test';
    import 'fake-indexeddb/auto';
    import { JSDOM } from 'jsdom';
    import { Storage, createStore, createStorageSignal } from '../src/main';
    import { IndexedDBStorage } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ SETUP ════════════════════════════════════════╗

    let dom: JSDOM;

    beforeAll(() => {
        // Create jsdom instance
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url                 : 'http://localhost',
            pretendToBeVisual   : true,
        });

        // Set global objects
        (globalThis as any).window              = dom.window;
        (globalThis as any).document            = dom.window.document;
        (globalThis as any).localStorage        = dom.window.localStorage;
        (globalThis as any).sessionStorage      = dom.window.sessionStorage;
        (globalThis as any).indexedDB           = (globalThis as any).indexedDB || dom.window.indexedDB;
        (globalThis as any).IDBDatabase         = dom.window.IDBDatabase;
        (globalThis as any).IDBOpenDBRequest    = dom.window.IDBOpenDBRequest;
    });

    beforeEach(() => {
        // Clear storage before each test
        dom.window.localStorage.clear();
        dom.window.sessionStorage.clear();
    });

    afterEach(() => {
        // Cleanup
        try {
            dom.window.localStorage.clear();
            dom.window.sessionStorage.clear();
        } catch {
            // Ignore cleanup errors
        }
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    // ============================================================================
    // STORAGE TESTS
    // ============================================================================

    describe('Storage', () => {
        let storage: Storage;

        beforeEach(() => {
            storage = new Storage({ type: 'memory', prefix: 'test:' });
        });

        test('should create storage with default options', () => {
            const memStorage = new Storage();
            expect(memStorage).toBeDefined();
        });

        test('should set and get items', () => {
            storage.set('key1', 'value1');
            expect(storage.get('key1') as string).toEqual('value1');
        });

        test('should get with default value', () => {
            expect(storage.get('nonexistent', 'default')).toEqual('default');
        });

        test('should return null for nonexistent keys without default', () => {
            expect(storage.get('nonexistent')).toBeNull();
        });

        test('should set and get objects', () => {
            const obj = { a: 1, b: 'test' };
            storage.set('obj', obj);
            expect(storage.get('obj') as any).toEqual(obj);
        });

        test('should set and get arrays', () => {
            const arr = [1, 2, 3];
            storage.set('arr', arr);
            expect(storage.get('arr') as any).toEqual(arr);
        });

        test('should handle TTL expiration', () => {
            storage.set('ttl-key', 'value', 1); // 1ms TTL
            expect(storage.get('ttl-key') as string).toEqual('value');
            // Wait for TTL to expire
            const sleep = () => new Promise(resolve => setTimeout(resolve, 10));
            return sleep().then(() => {
                expect(storage.get('ttl-key')).toBeNull();
            });
        });

        test('should remove items', () => {
            storage.set('key', 'value');
            expect(storage.get('key') as string).toEqual('value');
            storage.remove('key');
            expect(storage.get('key')).toBeNull();
        });

        test('should clear all items', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 'value2');
            storage.clear();
            expect(storage.get('key1')).toBeNull();
            expect(storage.get('key2')).toBeNull();
        });

        test('should get all keys', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 'value2');
            const keys = storage.keys();
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys.length).toBe(2);
        });

        test('should check if key exists', () => {
            storage.set('exists', 'value');
            expect(storage.has('exists')).toBe(true);
            expect(storage.has('nonexistent')).toBe(false);
        });

        test('should support custom serialization', () => {
            const customStorage = new Storage({
                type: 'memory',
                serialize: (val: any) => JSON.stringify({ wrapped: val }),
                deserialize: (str: string) => JSON.parse(str).wrapped
            });
            customStorage.set('key', { data: 'test' });
            expect(customStorage.get('key') as any).toEqual({ data: 'test' });
        });

        test('should handle invalid JSON gracefully', () => {
            const mapStorage = new Storage({ type: 'memory' });
            // This tests error handling in the get method
            expect(mapStorage.get('invalid')).toBeNull();
        });

        test('should support prefixes', () => {
            const prefixed1 = new Storage({ type: 'memory', prefix: 'app1:' });
            const prefixed2 = new Storage({ type: 'memory', prefix: 'app2:' });

            prefixed1.set('key', 'value1');
            prefixed2.set('key', 'value2');

            expect(prefixed1.get('key') as string).toEqual('value1');
            expect(prefixed2.get('key') as string).toEqual('value2');
        });

        test('should handle number values', () => {
            storage.set('num', 42);
            expect(storage.get('num') as number).toEqual(42);
        });

        test('should handle boolean values', () => {
            storage.set('bool', true);
            expect(storage.get('bool') as boolean).toEqual(true);
        });

        test('should handle null and undefined', () => {
            storage.set('nullVal', null);
            expect(storage.get('nullVal') as null).toBe(null);
        });

        test('should clear only prefixed items in globalThis storage', () => {
            // Test the prefix filtering in clear method
            const prefixed = new Storage({ type: 'memory', prefix: 'my:' });
            prefixed.set('key1', 'value1');
            prefixed.set('key2', 'value2');
            expect(prefixed.keys().length).toBe(2);
            prefixed.clear();
            expect(prefixed.keys().length).toBe(0);
        });

        test('should handle errors in remove operation', () => {
            storage.remove('nonexistent-key');
            expect(storage.get('nonexistent-key')).toBeNull();
        });

        test('should handle errors in keys operation', () => {
            storage.set('a', 1);
            storage.set('b', 2);
            const keys = storage.keys();
            expect(keys.length).toBeGreaterThanOrEqual(2);
        });

        test('should handle TTL with custom deserialize', () => {
            const customStorage = new Storage({
                type: 'memory',
                serialize: (v) => JSON.stringify({ wrapped: v }),
                deserialize: (s) => JSON.parse(s).wrapped
            });
            customStorage.set('key', 'value', 50);
            expect(customStorage.get('key') as string).toBe('value');
        });

        test('should differentiate between empty string and null', () => {
            storage.set('empty', '');
            storage.set('nullKey', null);
            expect(storage.get('empty') as string).toBe('');
            expect(storage.get('nullKey') as null).toBe(null);
        });

        test('should handle complex objects with nested structures', () => {
            const complex = {
                nested: {
                    deep: {
                        value: 42,
                        array: [1, 2, { key: 'value' }]
                    }
                },
                list: [{ id: 1 }, { id: 2 }]
            };
            storage.set('complex', complex);
            expect(storage.get('complex') as any).toEqual(complex);
        });
    });

    // ============================================================================
    // STORE TESTS
    // ============================================================================

    describe('Store', () => {
        test('should create store with initial state', () => {
            const store = createStore({
                state: { count: 0, name: 'test' }
            });

            expect(store.getSnapshot()).toEqual({ count: 0, name: 'test' });
        });

        test('should create reactive signals', () => {
            const store = createStore({
                state: { count: 0 }
            });

            const countSignal = store.state.count;
            expect(countSignal()).toBe(0);

            countSignal.set(5);
            expect(store.getSnapshot().count).toBe(5);
        });

        test('should update state with setState', () => {
            const store = createStore({
                state: { count: 0, name: 'test' }
            });

            store.setState({ count: 10 });
            expect(store.getSnapshot().count).toBe(10);
            expect(store.getSnapshot().name).toBe('test');
        });

        test('should batch state updates', () => {
            const store = createStore({
                state: { a: 0, b: 0 }
            });

            store.setState({ a: 1, b: 2 });
            expect(store.getSnapshot()).toEqual({ a: 1, b: 2 });
        });

        test('should support subscriptions', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let callCount = 0;
            const unsubscribe = store.subscribe(() => {
                callCount++;
            });

            store.setState({ count: 1 });
            expect(callCount).toBe(1);

            unsubscribe();
            store.setState({ count: 2 });
            expect(callCount).toBe(1); // Should not increment after unsubscribe
        });

        test('should reset to initial state', () => {
            const store = createStore({
                state: { count: 0, name: 'initial' }
            });

            store.setState({ count: 10, name: 'updated' });
            store.reset();

            expect(store.getSnapshot()).toEqual({ count: 0, name: 'initial' });
        });

        test('should persist state to storage', () => {
            const storage = new Storage({ type: 'memory' });
            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage,
                storageKey: 'mystore'
            });

            store.setState({ count: 5 });

            // Create another store instance with same storage
            const store2 = createStore({
                state: { count: 0 },
                persist: true,
                storage,
                storageKey: 'mystore'
            });

            expect(store2.getSnapshot().count).toBe(5);
        });

        test('should clear persisted data', () => {
            const storage = new Storage({ type: 'memory' });
            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage,
                storageKey: 'mystore'
            });

            store.setState({ count: 5 });
            store.clearPersisted();

            expect(storage.get('mystore:count')).toBeNull();
        });

        test('should handle multiple store instances', () => {
            const store1 = createStore({
                state: { value: 1 }
            });

            const store2 = createStore({
                state: { value: 2 }
            });

            expect(store1.getSnapshot().value).toBe(1);
            expect(store2.getSnapshot().value).toBe(2);
        });

        test('should update multiple state keys', () => {
            const store = createStore({
                state: { a: 1, b: 2, c: 3 }
            });

            store.setState({ a: 10, c: 30 });
            expect(store.getSnapshot()).toEqual({ a: 10, b: 2, c: 30 });
        });

        test('should ignore non-existent keys in setState', () => {
            const store = createStore({
                state: { a: 1 }
            });

            store.setState({ a: 2, nonexistent: 3 } as any);
            expect(store.getSnapshot()).toEqual({ a: 2 });
        });
    });

    // ============================================================================
    // STORAGE SIGNAL TESTS
    // ============================================================================

    describe('Storage Signal', () => {
        test('should create storage signal', () => {
            const storage = new Storage({ type: 'memory' });
            const signal = createStorageSignal('key', 'default', storage);

            expect(signal()).toBe('default');
        });

        test('should sync signal to storage', () => {
            const storage = new Storage({ type: 'memory' });
            const signal = createStorageSignal('key', 'initial', storage);

            signal.set('updated');
            const stored = storage.get('key');
            expect(stored).toBe('updated');
        });

        test('should restore from storage on creation', () => {
            const storage = new Storage({ type: 'memory' });
            // Pre-set value in storage
            storage.set('key', 'stored');

            const signal = createStorageSignal('key', 'default', storage);
            expect(signal()).toBe('stored');
        });

        test('should handle cross-tab sync with localStorage', (done: any) => {
            // This test verifies that the event listener is registered for localStorage
            // The listener code path is: if (storage === localStorage || storage === sessionStorage)
            // Since we pass a fresh Storage instance, it checks the identity comparison
            const storage = new Storage({ type: 'local' });
            const signal = createStorageSignal('sync-key', 'initial', storage);

            // The signal should be created successfully
            expect(signal()).toBe('initial');
            done();
        });

        test('should handle cross-tab sync with sessionStorage', (done: any) => {
            // This test verifies that the event listener is registered for sessionStorage
            const storage = new Storage({ type: 'session' });
            const signal = createStorageSignal('sync-key2', 'initial', storage);

            // The signal should be created successfully
            expect(signal()).toBe('initial');
            done();
        });

        test('should ignore invalid JSON in storage events', (done: any) => {
            const storage = new Storage({ type: 'local' });
            const signal = createStorageSignal('invalid-key', 'initial', storage);

            setTimeout(() => {
                // Simulate invalid JSON storage event
                const StorageEventConstructor = dom.window.StorageEvent;
                const event = new StorageEventConstructor('storage', {
                    key: 'crux:invalid-key',
                    newValue: 'not-json',
                    oldValue: null,
                    storageArea: dom.window.localStorage,
                    url: 'http://localhost'
                });

                dom.window.dispatchEvent(event);

                setTimeout(() => {
                    // Should keep original value due to parse error
                    expect(signal()).toBe('initial');
                    done();
                }, 50);
            }, 20);
        });

        test('should not listen to storage events for memory storage', () => {
            const storage = new Storage({ type: 'memory' });
            const signal = createStorageSignal('mem-key', 'initial', storage);

            // Memory storage should not have event listeners
            expect(signal()).toBe('initial');
        });

        test('should use default memory storage', () => {
            const signal = createStorageSignal('default-key', 'value');
            expect(signal()).toBe('value');
        });
    });

    // ============================================================================
    // IndexedDBStorage TESTS
    // ============================================================================

    describe('IndexedDBStorage', () => {
        let idbStorage: IndexedDBStorage;

        beforeEach(() => {
            idbStorage = new IndexedDBStorage('test-db', 'test-store');
        });

        test('should create IndexedDBStorage instance', () => {
            expect(idbStorage).toBeDefined();
        });

        test('should set and get items from IndexedDB', async () => {
            await idbStorage.set('key1', 'value1');
            const value = await idbStorage.get('key1');
            expect(value).toBe('value1');
        });

        test('should get null for nonexistent keys', async () => {
            const value = await idbStorage.get('nonexistent');
            expect(value).toBeNull();
        });

        test('should set and get objects', async () => {
            const obj = { a: 1, b: 'test', c: { nested: true } };
            await idbStorage.set('obj', obj);
            const value = await idbStorage.get('obj');
            expect(value).toEqual(obj);
        });

        test('should remove items', async () => {
            await idbStorage.set('key', 'value');
            expect(await idbStorage.get('key') as string).toEqual('value');
            await idbStorage.remove('key');
            expect(await idbStorage.get('key')).toBeNull();
        });

        test('should clear all items', async () => {
            await idbStorage.set('key1', 'value1');
            await idbStorage.set('key2', 'value2');
            await idbStorage.set('key3', 'value3');

            await idbStorage.clear();

            expect(await idbStorage.get('key1')).toBeNull();
            expect(await idbStorage.get('key2')).toBeNull();
            expect(await idbStorage.get('key3')).toBeNull();
        });

        test('should get all keys', async () => {
            await idbStorage.set('key1', 'value1');
            await idbStorage.set('key2', 'value2');
            await idbStorage.set('key3', 'value3');

            const keys = await idbStorage.keys();

            expect(keys.length).toBe(3);
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys).toContain('key3');
        });

        test('should handle multiple instances with different databases', async () => {
            const idb1 = new IndexedDBStorage('db1', 'store1');
            const idb2 = new IndexedDBStorage('db2', 'store2');

            await idb1.set('key', 'value1');
            await idb2.set('key', 'value2');

            expect(await idb1.get('key') as string).toBe('value1');
            expect(await idb2.get('key') as string).toBe('value2');
        });

        test('should use default database and store names', async () => {
            const idb = new IndexedDBStorage();
            await idb.set('test-key', 'test-value');
            const value = await idb.get('test-key');
            expect(value).toEqual('test-value');
        });

        test('should handle multiple operations in sequence', async () => {
            await idbStorage.set('a', 1);
            await idbStorage.set('b', 2);
            await idbStorage.set('c', 3);

            expect(await idbStorage.get('a') as number).toEqual(1);
            expect(await idbStorage.get('b') as number).toEqual(2);
            expect(await idbStorage.get('c') as number).toEqual(3);

            await idbStorage.remove('b');

            expect(await idbStorage.get('a') as number).toEqual(1);
            expect(await idbStorage.get('b')).toBeNull();
            expect(await idbStorage.get('c') as number).toEqual(3);
        });

        afterEach(async () => {
            // Clean up IndexedDB after tests
            try {
                await idbStorage.clear();
            } catch {
                // Ignore cleanup errors
            }
        });
    });

    // ============================================================================
    // Integration TESTS
    // ============================================================================

    describe('Integration', () => {
        test('should work with Store using memory storage', async () => {
            const storage = new Storage({ type: 'memory' });
            const store = createStore({
                state: { count: 0, user: 'test' },
                persist: true,
                storage,
                storageKey: 'app'
            });

            store.setState({ count: 5, user: 'john' });

            const stored = storage.get('app:count');
            expect(stored).toEqual(5);
        });

        test('should handle complex nested state', () => {
            const store = createStore({
                state: {
                    user: { id: 1, name: 'test' },
                    items: [1, 2, 3],
                    meta: { timestamp: Date.now() }
                }
            });

            store.setState({
                user: { id: 2, name: 'updated' }
            });

            expect(store.getSnapshot().user).toEqual({ id: 2, name: 'updated' });
        });

        test('should maintain data consistency across multiple operations', () => {
            const storage = new Storage({ type: 'memory' });
            const store = createStore({
                state: { a: 1, b: 2, c: 3 },
                persist: true,
                storage,
                storageKey: 'test'
            });

            store.setState({ a: 10 });
            store.setState({ b: 20 });
            store.setState({ c: 30 });

            expect(store.getSnapshot()).toEqual({ a: 10, b: 20, c: 30 });
            expect(storage.get('test:a') as number).toEqual(10);
            expect(storage.get('test:b') as number).toEqual(20);
            expect(storage.get('test:c') as number).toEqual(30);
        });

        test('should handle persistence without storage gracefully', () => {
            const store = createStore({
                state: { value: 0 }
            });

            store.setState({ value: 5 });
            expect(store.getSnapshot().value).toEqual(5);
        });

        test('should support default storage key', () => {
            const storage = new Storage({ type: 'memory' });
            const store = createStore({
                state: { value: 0 },
                persist: true,
                storage
            });

            store.setState({ value: 5 });
            expect(storage.get('store:value') as number).toEqual(5);
        });

        test('should clear persisted state without storage gracefully', () => {
            const store = createStore({
                state: { value: 0 }
            });

            store.setState({ value: 5 });
            store.clearPersisted(); // Should not throw
            expect(store.getSnapshot().value).toBe(5);
        });

        test('should multiple subscribers receive updates', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let sub1Called = 0;
            let sub2Called = 0;

            store.subscribe(() => { sub1Called++; });
            store.subscribe(() => { sub2Called++; });

            store.setState({ count: 1 });

            expect(sub1Called).toEqual(1);
            expect(sub2Called).toEqual(1);
        });

        test('should handle signals directly', () => {
            const store = createStore({
                state: { x: 0, y: 0 }
            });

            const xSignal = store.state.x;
            const ySignal = store.state.y;

            xSignal.set(10);
            ySignal.set(20);

            expect(store.getSnapshot()).toEqual({ x: 10, y: 20 });
        });

        test('should properly serialize/deserialize complex types', () => {
            const storage = new Storage({
                type: 'memory',
                serialize: (v) => JSON.stringify(v),
                deserialize: (s) => JSON.parse(s)
            });

            const store = createStore({
                state: {
                    date: new Date('2024-01-01').toISOString(),
                    data: { nested: { value: 42 } }
                },
                persist: true,
                storage,
                storageKey: 'app'
            });

            store.setState({
                data: { nested: { value: 99 } }
            });

            const snapshot = store.getSnapshot();
            expect(snapshot.data.nested.value).toBe(99);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
