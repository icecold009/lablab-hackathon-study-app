import { describe, expect, it } from 'vitest'
import {
  decodeStoredRawValue,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from './browserStore'
import { STORAGE_KEYS } from './schema'
import { MemoryStorage } from '../test/fakes'
import { createPlan, createQuizResult, createSetup } from '../test/fixtures'

describe('browser storage adapter', () => {
  it('reads a current envelope and preserves its metadata', () => {
    const setup = createSetup()
    const storage = new MemoryStorage({
      [STORAGE_KEYS.setup]: JSON.stringify({
        version: 1,
        data: setup,
        metadata: { source: 'fixture' },
      }),
    })

    const result = readStoredValue(STORAGE_KEYS.setup, null, storage)

    expect(result.status).toBe('current')
    expect(result.value).toEqual(setup)
    expect(result.status === 'current' ? result.envelope.metadata : undefined).toEqual({ source: 'fixture' })
  })

  it('migrates a legacy value once and then reads the envelope', () => {
    const setup = createSetup()
    const storage = new MemoryStorage({
      [STORAGE_KEYS.setup]: JSON.stringify(setup),
    })

    const first = readStoredValue(STORAGE_KEYS.setup, null, storage)
    const second = readStoredValue(STORAGE_KEYS.setup, null, storage)

    expect(first).toMatchObject({ status: 'migrated', value: setup, migrationPersisted: true })
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.setup)!)).toEqual({ version: 1, data: setup })
    expect(second).toMatchObject({ status: 'current', value: setup })
  })

  it('migrates each application record shape without changing its key', () => {
    const records = [
      { key: STORAGE_KEYS.setup, value: createSetup(), fallback: null },
      { key: STORAGE_KEYS.plan, value: createPlan(), fallback: null },
      { key: STORAGE_KEYS.quizResults, value: [createQuizResult()], fallback: [] },
      {
        key: STORAGE_KEYS.activeTimer,
        value: { blockId: 'block-cell-biology', remainingSeconds: 120, running: true, updatedAt: 1_756_684_800_000 },
        fallback: null,
      },
      { key: STORAGE_KEYS.quizTopic, value: { topicId: 'topic-cell-biology', topicName: 'Cell Biology' }, fallback: null },
    ] as const

    for (const record of records) {
      const storage = new MemoryStorage({ [record.key]: JSON.stringify(record.value) })
      const result = readStoredValue(record.key, record.fallback, storage)

      expect(result).toMatchObject({ status: 'migrated', value: record.value, migrationPersisted: true })
      expect(JSON.parse(storage.getItem(record.key)!)).toEqual({ version: 1, data: record.value })
    }
  })

  it('does not overwrite invalid, corrupt, or future-version records', () => {
    const cases = [
      { raw: JSON.stringify({ examName: 'Biology' }), status: 'invalid' },
      { raw: '{not-json', status: 'corrupt' },
      { raw: JSON.stringify({ version: 2, data: createSetup() }), status: 'unsupported' },
    ] as const

    for (const testCase of cases) {
      const storage = new MemoryStorage({ [STORAGE_KEYS.setup]: testCase.raw })
      const result = readStoredValue(STORAGE_KEYS.setup, null, storage)

      expect(result.status).toBe(testCase.status)
      expect(storage.getItem(STORAGE_KEYS.setup)).toBe(testCase.raw)
    }
  })

  it('preserves safe envelope fields when writing new data', () => {
    const storage = new MemoryStorage({
      custom: JSON.stringify({
        version: 1,
        data: 'before',
        metadata: { owner: 'study' },
        futureSafeField: true,
      }),
    })

    expect(writeStoredValue('custom', 'after', storage)).toEqual({ status: 'saved' })
    expect(JSON.parse(storage.getItem('custom')!)).toEqual({
      version: 1,
      data: 'after',
      metadata: { owner: 'study' },
      futureSafeField: true,
    })
  })

  it('returns typed write and remove failures without hiding the original value', () => {
    class FailingStorage extends MemoryStorage {
      override setItem(): void {
        throw new Error('quota exceeded')
      }

      override removeItem(): void {
        throw new Error('storage locked')
      }
    }

    const raw = JSON.stringify(createSetup())
    const storage = new FailingStorage({ [STORAGE_KEYS.setup]: raw })

    expect(writeStoredValue(STORAGE_KEYS.setup, createSetup(), storage)).toMatchObject({
      status: 'write-failed',
    })
    expect(removeStoredValue(STORAGE_KEYS.setup, storage)).toMatchObject({
      status: 'remove-failed',
    })
    expect(storage.getItem(STORAGE_KEYS.setup)).toBe(raw)
  })

  it('reports a migration persistence failure while retaining the legacy record', () => {
    class FailingStorage extends MemoryStorage {
      override setItem(): void {
        throw new Error('quota exceeded')
      }
    }

    const raw = JSON.stringify(createSetup())
    const storage = new FailingStorage({ [STORAGE_KEYS.setup]: raw })

    const result = readStoredValue(STORAGE_KEYS.setup, null, storage)

    expect(result).toMatchObject({
      status: 'migrated',
      migrationPersisted: false,
      error: expect.any(Error),
    })
    expect(storage.getItem(STORAGE_KEYS.setup)).toBe(raw)
  })

  it('decodes cross-tab values without writing them back', () => {
    const setup = createSetup()
    const raw = JSON.stringify({ version: 1, data: setup })

    expect(decodeStoredRawValue(STORAGE_KEYS.setup, raw, null)).toMatchObject({
      status: 'current',
      value: setup,
    })
  })
})
