import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AccessCodeError,
  REQUEST_TIMEOUT_MS,
  getAccessCode,
  regenerateAccessCode,
} from '../accessCode'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function failure(promise: Promise<unknown>): Promise<AccessCodeError> {
  try {
    await promise
  } catch (e) {
    expect(e).toBeInstanceOf(AccessCodeError)
    return e as AccessCodeError
  }
  throw new Error('expected the request to fail')
}

describe('getAccessCode', () => {
  it('returns the code and calls GET /access-code once', async () => {
    fetchMock.mockResolvedValue(json({ code: '5916', expiresAt: null }))

    await expect(getAccessCode()).resolves.toEqual({ code: '5916', expired: false })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/access-code')
    expect(init?.method).toBe('GET')
  })

  it('is not expired when expiresAt is in the future', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    fetchMock.mockResolvedValue(json({ code: '5916', expiresAt: future }))
    await expect(getAccessCode()).resolves.toEqual({ code: '5916', expired: false })
  })

  it('reports an expired code when expiresAt is in the past', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    fetchMock.mockResolvedValue(json({ code: '5916', expiresAt: past }))
    await expect(getAccessCode()).resolves.toEqual({ code: '5916', expired: true })
  })

  it.each([500, 503, 599])('maps HTTP %i to a server error', async (status) => {
    fetchMock.mockResolvedValue(json({}, status))
    expect((await failure(getAccessCode())).kind).toBe('server')
  })

  it.each([400, 401, 403, 404, 429])('maps HTTP %i to a general error', async (status) => {
    fetchMock.mockResolvedValue(json({}, status))
    expect((await failure(getAccessCode())).kind).toBe('general')
  })

  it('maps a network failure to a general error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect((await failure(getAccessCode())).kind).toBe('general')
  })

  it('abandons the request after the timeout and reports a general error', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const result = failure(getAccessCode())
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)

    expect((await result).kind).toBe('general')
  })

  it.each([
    ['too short', '591'],
    ['too long', '59160'],
    ['letters', '59a6'],
    ['null', null],
    ['a number', 5916],
  ])('rejects a malformed code (%s) as a general error', async (_label, code) => {
    fetchMock.mockResolvedValue(json({ code, expiresAt: null }))
    expect((await failure(getAccessCode())).kind).toBe('general')
  })

  it('rejects a response that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }))
    expect((await failure(getAccessCode())).kind).toBe('general')
  })
})

describe('regenerateAccessCode', () => {
  it('sends POST /access-code/regenerate and returns the new code', async () => {
    fetchMock.mockResolvedValue(json({ code: '4827', expiresAt: null }))

    await expect(regenerateAccessCode()).resolves.toEqual({ code: '4827', expired: false })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/access-code/regenerate')
    expect(init?.method).toBe('POST')
  })

  it('maps HTTP 500 to a server error', async () => {
    fetchMock.mockResolvedValue(json({}, 500))
    expect((await failure(regenerateAccessCode())).kind).toBe('server')
  })
})
