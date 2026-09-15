export interface FakeClock {
  now: () => number
  set: (value: number) => void
  advance: (milliseconds: number) => void
}

export function createFakeClock(start = 0): FakeClock {
  let current = start

  return {
    now: () => current,
    set: (value) => {
      current = value
    },
    advance: (milliseconds) => {
      current += milliseconds
    },
  }
}

export class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  constructor(entries: Record<string, string> = {}) {
    Object.entries(entries).forEach(([key, value]) => this.values.set(key, value))
  }

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

export interface ProviderRequest<Input, Output> {
  input: Input
  signal?: AbortSignal
  deferred: Deferred<Output>
}

export function createProviderFake<Input, Output>() {
  const requests: ProviderRequest<Input, Output>[] = []

  return {
    requests,
    request(input: Input, signal?: AbortSignal): Promise<Output> {
      const deferred = createDeferred<Output>()
      requests.push({ input, signal, deferred })
      return deferred.promise
    },
  }
}
