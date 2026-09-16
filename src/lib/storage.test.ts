import { createStore, memoryStorage, type StorageLike } from './storage'

interface V1 {
  count: number
}
interface V2 {
  count: number
  label: string
}

describe('createStore', () => {
  it('returns the initial value when nothing is stored', () => {
    const store = createStore({ key: 'k', version: 1, initial: () => ({ count: 0 }) })
    expect(store.load()).toEqual({ count: 0 })
  })

  it('round-trips values through the envelope', () => {
    const storage = memoryStorage()
    const store = createStore<V1>({ key: 'k', version: 1, initial: () => ({ count: 0 }) }, storage)
    store.save({ count: 7 })
    expect(JSON.parse(storage.getItem('k')!)).toEqual({ version: 1, data: { count: 7 } })
    expect(store.load()).toEqual({ count: 7 })
    store.clear()
    expect(store.load()).toEqual({ count: 0 })
  })

  it('migrates older versions and discards newer or corrupt ones', () => {
    const storage = memoryStorage()
    storage.setItem('k', JSON.stringify({ version: 1, data: { count: 3 } }))
    const store = createStore<V2>(
      {
        key: 'k',
        version: 2,
        initial: () => ({ count: 0, label: 'new' }),
        migrate: (data, from) => {
          expect(from).toBe(1)
          return { ...(data as V1), label: 'migrated' }
        },
      },
      storage,
    )
    expect(store.load()).toEqual({ count: 3, label: 'migrated' })

    storage.setItem('k', JSON.stringify({ version: 9, data: { count: 3 } }))
    expect(store.load()).toEqual({ count: 0, label: 'new' })
    storage.setItem('k', 'not json')
    expect(store.load()).toEqual({ count: 0, label: 'new' })
    storage.setItem('k', JSON.stringify({ nope: true }))
    expect(store.load()).toEqual({ count: 0, label: 'new' })
  })

  it('falls back to initial without a migrate function, and when validate throws', () => {
    const storage = memoryStorage()
    storage.setItem('k', JSON.stringify({ version: 1, data: { count: 3 } }))
    const noMigrate = createStore<V1>(
      { key: 'k', version: 2, initial: () => ({ count: -1 }) },
      storage,
    )
    expect(noMigrate.load()).toEqual({ count: -1 })

    storage.setItem('k', JSON.stringify({ version: 1, data: { count: 'bad' } }))
    const validated = createStore<V1>(
      {
        key: 'k',
        version: 1,
        initial: () => ({ count: 0 }),
        validate: (d) => {
          if (typeof (d as V1).count !== 'number') throw new Error('bad')
          return d as V1
        },
      },
      storage,
    )
    expect(validated.load()).toEqual({ count: 0 })
  })

  it('survives a storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const store = createStore<V1>({ key: 'k', version: 1, initial: () => ({ count: 0 }) }, broken)
    expect(store.load()).toEqual({ count: 0 })
    expect(() => store.save({ count: 1 })).not.toThrow()
    expect(() => store.clear()).not.toThrow()
  })
})
