import { useState, useEffect, useCallback, useRef } from 'react';
import {
  decodeStoredRawValue,
  notifyStorageError,
  persistStoredValue,
  readStoredValue,
} from '../storage/browserStore';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readStoredValue(key, initialValue).value;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        persistStoredValue(key, nextValue);
        return nextValue;
      });
    },
    [key],
  );

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setStoredValue(initialValueRef.current);
        return;
      }

      const result = decodeStoredRawValue(key, e.newValue, initialValueRef.current);
      if (result.status === 'current' || result.status === 'legacy') {
        setStoredValue(result.value);
      } else {
        notifyStorageError(key, result.status, 'reason' in result ? result.reason : undefined);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [storedValue, setValue];
}
