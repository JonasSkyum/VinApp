/**
 * Typed, versioned localStorage wrapper. Values are stored as `{ version, data }`
 * so the shape can evolve through `migrate`. Every access is guarded: a blocked
 * or full storage degrades to in-memory behaviour instead of crashing the app.
 */

export interface StoreSchema<T> {
  key: string
  version: number
  /** Fresh value when nothing is stored or the stored value is unusable. */
  initial: () => T
  /** Upgrades data written by an older version. Throw to discard it. */
  migrate?: (data: unknown, fromVersion: number) => T
  /** Final check of the (migrated) data; throw to discard it. */
  validate?: (data: unknown) => T
}

export interface Store<T> {
  load(): T
  save(value: T): void
  clear(): void
}

interface Envelope {
  version: number
  data: unknown
}

/** Minimal subset of the Web Storage API, so tests can pass a Map-backed stand-in. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function memoryStorage(): StorageLike {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

function defaultStorage(): StorageLike {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // Access can throw (privacy mode); fall through.
  }
  return memoryStorage()
}

export function createStore<T>(
  schema: StoreSchema<T>,
  storage: StorageLike = defaultStorage(),
): Store<T> {
  function load(): T {
    let raw: string | null
    try {
      raw = storage.getItem(schema.key)
    } catch {
      return schema.initial()
    }
    if (raw === null) return schema.initial()
    try {
      const envelope = JSON.parse(raw) as Partial<Envelope>
      if (
        typeof envelope !== 'object' ||
        envelope === null ||
        typeof envelope.version !== 'number'
      ) {
        return schema.initial()
      }
      if (envelope.version > schema.version) return schema.initial()
      let data = envelope.data
      if (envelope.version < schema.version) {
        if (!schema.migrate) return schema.initial()
        data = schema.migrate(data, envelope.version)
      }
      return schema.validate ? schema.validate(data) : (data as T)
    } catch {
      return schema.initial()
    }
  }

  function save(value: T): void {
    const envelope: Envelope = { version: schema.version, data: value }
    try {
      storage.setItem(schema.key, JSON.stringify(envelope))
    } catch {
      // Quota exceeded or storage blocked: keep running with in-memory state.
    }
  }

  function clear(): void {
    try {
      storage.removeItem(schema.key)
    } catch {
      // ignore
    }
  }

  return { load, save, clear }
}
