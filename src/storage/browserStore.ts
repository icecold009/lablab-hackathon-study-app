import { currentEnvelopeFields, decodeStoredValue, migrateLegacyValue, type DecodedStorageValue } from './migrations'
import { getStorageValidator } from './schema'

export type StorageFailureStatus = 'unavailable' | 'invalid' | 'corrupt' | 'unsupported' | 'migration-failed' | 'write-failed' | 'remove-failed'

export type StorageReadResult<T> =
  | { status: 'missing'; value: T }
  | { status: 'unavailable'; value: T; error: unknown }
  | { status: 'current'; value: T; envelope: Record<string, unknown> }
  | { status: 'migrated'; value: T; migrationPersisted: boolean; error?: unknown }
  | { status: 'invalid'; value: T; raw: string; reason: string }
  | { status: 'corrupt'; value: T; raw: string; reason: string }
  | { status: 'unsupported'; value: T; raw: string; version: number }

export type StorageWriteResult =
  | { status: 'saved' }
  | { status: 'unavailable'; error: unknown }
  | { status: 'write-failed'; error: unknown }

export type StorageRemoveResult =
  | { status: 'removed' }
  | { status: 'unavailable'; error: unknown }
  | { status: 'remove-failed'; error: unknown }

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function notifyStorageError(key: string, status: StorageFailureStatus, error?: unknown): void {
  if (typeof window === 'undefined') return
  const message = error instanceof Error ? error.message : undefined
  window.dispatchEvent(new CustomEvent('icecold:storage-error', {
    detail: { key, status, ...(message ? { message } : {}) },
  }))
}

function notifyReadFailure<T>(key: string, result: StorageReadResult<T>): void {
  if (result.status === 'unavailable') notifyStorageError(key, 'unavailable', result.error)
  if (result.status === 'invalid') notifyStorageError(key, 'invalid')
  if (result.status === 'corrupt') notifyStorageError(key, 'corrupt')
  if (result.status === 'unsupported') notifyStorageError(key, 'unsupported')
  if (result.status === 'migrated' && !result.migrationPersisted) notifyStorageError(key, 'migration-failed', result.error)
}

export function readStoredValue<T>(key: string, fallback: T, storage: Storage | null = getLocalStorage()): StorageReadResult<T> {
  if (!storage) {
    const result: StorageReadResult<T> = { status: 'unavailable', value: fallback, error: new Error('Browser storage is unavailable.') }
    notifyReadFailure(key, result)
    return result
  }

  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (error) {
    const result: StorageReadResult<T> = { status: 'unavailable', value: fallback, error }
    notifyReadFailure(key, result)
    return result
  }

  if (raw === null) return { status: 'missing', value: fallback }

  const decoded = decodeStoredValue(raw, fallback, getStorageValidator(key))
  if (decoded.status === 'legacy') {
    const write = writeStoredValue(key, decoded.value, storage)
    const result: StorageReadResult<T> = write.status === 'saved'
      ? { status: 'migrated', value: decoded.value, migrationPersisted: true }
      : { status: 'migrated', value: decoded.value, migrationPersisted: false, error: write.error }
    notifyReadFailure(key, result)
    return result
  }
  if (decoded.status === 'current') {
    return { status: 'current', value: decoded.value, envelope: decoded.envelope }
  }
  notifyReadFailure(key, decoded)
  return decoded
}

export function decodeStoredRawValue<T>(key: string, raw: string, fallback: T): DecodedStorageValue<T> {
  return decodeStoredValue(raw, fallback, getStorageValidator(key))
}

export function writeStoredValue<T>(key: string, value: T, storage: Storage | null = getLocalStorage()): StorageWriteResult {
  if (!storage) return { status: 'unavailable', error: new Error('Browser storage is unavailable.') }

  try {
    const existing = currentEnvelopeFields(storage.getItem(key))
    storage.setItem(key, JSON.stringify(migrateLegacyValue(value, existing)))
    return { status: 'saved' }
  } catch (error) {
    return { status: 'write-failed', error }
  }
}

export function persistStoredValue<T>(key: string, value: T): boolean {
  const result = writeStoredValue(key, value)
  if (result.status !== 'saved') notifyStorageError(key, result.status, result.error)
  return result.status === 'saved'
}

export function removeStoredValue(key: string, storage: Storage | null = getLocalStorage()): StorageRemoveResult {
  if (!storage) return { status: 'unavailable', error: new Error('Browser storage is unavailable.') }
  try {
    storage.removeItem(key)
    return { status: 'removed' }
  } catch (error) {
    return { status: 'remove-failed', error }
  }
}

export function clearStoredValue(key: string): boolean {
  const result = removeStoredValue(key)
  if (result.status !== 'removed') notifyStorageError(key, result.status, result.error)
  return result.status === 'removed'
}
