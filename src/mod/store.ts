/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/Store.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { signal, batch, type Signal } from '@minejs/signals';
    import * as types from '../types';
    import { createStorageSignal } from './storage';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Store<T extends Record<string, any>> {
        private _state: { [K in keyof T]: Signal<T[K]> };
        private config: types.StoreConfig<T>;
        private subscribers = new Set<() => void>();

        constructor(config: types.StoreConfig<T>) {
            this.config = config;

            // Create signals for each state property
            this._state = {} as any;

            Object.entries(config.state).forEach(([key, value]) => {
                if (config.persist && config.storage) {
                    // Use storage-backed signal
                    this._state[key as keyof T] = createStorageSignal(
                        `${config.storageKey || 'store'}:${key}`,
                        value,
                        config.storage
                    );
                } else {
                    // Use regular signal
                    this._state[key as keyof T] = signal(value);
                }
            });
        }

        /**
         * Get state (reactive)
         */
        public get state(): { [K in keyof T]: Signal<T[K]> } {
            return this._state;
        }

        /**
         * Get snapshot (non-reactive)
         */
        public getSnapshot(): T {
            const snapshot = {} as T;

            Object.entries(this._state).forEach(([key, sig]) => {
                snapshot[key as keyof T] = (sig as Signal<any>)();
            });

            return snapshot;
        }

        /**
         * Set state (batch update)
         */
        public setState(updates: Partial<T>): void {
            batch(() => {
                Object.entries(updates).forEach(([key, value]) => {
                    if (key in this._state) {
                        this._state[key as keyof T].set(value);
                    }
                });
            });

            this.notify();
        }

        /**
         * Subscribe to state changes
         */
        public subscribe(callback: () => void): () => void {
            this.subscribers.add(callback);

            return () => {
                this.subscribers.delete(callback);
            };
        }

        private notify(): void {
            this.subscribers.forEach(callback => callback());
        }

        /**
         * Reset to initial state
         */
        public reset(): void {
            this.setState(this.config.state);
        }

        /**
         * Clear persisted data
         */
        public clearPersisted(): void {
            if (this.config.persist && this.config.storage) {
                Object.keys(this.config.state).forEach(key => {
                    this.config.storage!.remove(`${this.config.storageKey || 'store'}:${key}`);
                });
            }
        }
    }

    /**
     * Create a global store
     */
    export function createStore<T extends Record<string, any>>(
        config: types.StoreConfig<T>
    ): Store<T> {
        return new Store(config);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗


// ╚══════════════════════════════════════════════════════════════════════════════════════╝

