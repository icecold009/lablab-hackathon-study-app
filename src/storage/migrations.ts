import {
  isCurrentStorageEnvelope,
  isStorageEnvelope,
  STORAGE_VERSION,
  type StorageEnvelope,
  type StorageValidator,
} from './schema'

export type DecodedStorageValue<T> =
  | { status: 'current'; value: T; envelope: StorageEnvelope<T> }
  | { status: 'legacy'; value: T }
  | { status: 'invalid'; value: T; raw: string; reason: string }
  | { status: 'corrupt'; value: T; raw: string; reason: string }
  | { status: 'unsupported'; value: T; raw: string; version: number }

export function decodeStoredValue<T>(
  raw: string,
  fallback: T,
  validator: StorageValidator = () => true,
): DecodedStorageValue<T> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'corrupt', value: fallback, raw, reason: 'Stored value is not valid JSON.' }
  }

  if (isStorageEnvelope(parsed)) {
    if (!isCurrentStorageEnvelope(parsed)) {
      return { status: 'unsupported', value: fallback, raw, version: parsed.version }
    }
    if (!validator(parsed.data)) {
      return { status: 'invalid', value: fallback, raw, reason: 'Stored envelope payload failed validation.' }
    }
    return { status: 'current', value: parsed.data as T, envelope: parsed as StorageEnvelope<T> }
  }

  if (!validator(parsed)) {
    return { status: 'invalid', value: fallback, raw, reason: 'Legacy stored value failed validation.' }
  }

  return { status: 'legacy', value: parsed as T }
}

export function migrateLegacyValue<T>(value: T, previous?: Record<string, unknown>): StorageEnvelope<T> {
  const preservedFields = Object.fromEntries(
    Object.entries(previous ?? {}).filter(([key]) => key !== 'version' && key !== 'data'),
  )

  return {
    ...preservedFields,
    version: STORAGE_VERSION,
    data: value,
  }
}

export function currentEnvelopeFields(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    return isCurrentStorageEnvelope(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}
