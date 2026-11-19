import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessCodeError, getAccessCode, regenerateAccessCode } from '@/api/accessCode'
import { useAccessCode } from '../useAccessCode'

vi.mock('@/api/accessCode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/accessCode')>()),
  getAccessCode: vi.fn(),
  regenerateAccessCode: vi.fn(),
}))

const get = vi.mocked(getAccessCode)
const regen = vi.mocked(regenerateAccessCode)

type Result = { code: string; expired: boolean }

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

beforeEach(() => {
  get.mockReset()
  regen.mockReset()
})

describe('loading the code', () => {
  it('starts in the loading state', () => {
    expect(useAccessCode().state.value).toEqual({ status: 'loading', pending: 'load' })
  })

  it('stays loading until the backend answers, then shows the code', async () => {
    const d = deferred<Result>()
    get.mockReturnValue(d.promise)
    const { state, load } = useAccessCode()

    const done = load()
    expect(state.value).toEqual({ status: 'loading', pending: 'load' })
    expect(get).toHaveBeenCalledTimes(1)

    d.resolve({ code: '5916', expired: false })
    await done
    expect(state.value).toEqual({ status: 'ready', code: '5916' })
  })

  it('shows the expired state when the backend reports an expired code', async () => {
    get.mockResolvedValue({ code: '5916', expired: true })
    const { state, load } = useAccessCode()
    await load()
    expect(state.value).toEqual({ status: 'expired', code: '5916' })
  })

  it('maps a server error to the server error state', async () => {
    get.mockRejectedValue(new AccessCodeError('server', 'Server error (503)'))
    const { state, load } = useAccessCode()
    await load()
    expect(state.value).toEqual({ status: 'error', kind: 'server', failed: 'load' })
  })

  it('maps any other failure to the general error state', async () => {
    get.mockRejectedValue(new AccessCodeError('general', 'Could not reach the server'))
    const { state, load } = useAccessCode()
    await load()
    expect(state.value).toEqual({ status: 'error', kind: 'general', failed: 'load' })
  })

  it('treats an unexpected exception as a general error', async () => {
    get.mockRejectedValue(new Error('boom'))
    const { state, load } = useAccessCode()
    await load()
    expect(state.value).toEqual({ status: 'error', kind: 'general', failed: 'load' })
  })
})

describe('retry', () => {
  it('repeats loading the code after a failed load', async () => {
    get.mockRejectedValueOnce(new AccessCodeError('general', 'x'))
    const { state, load, retry } = useAccessCode()
    await load()

    const d = deferred<Result>()
    get.mockReturnValue(d.promise)
    const done = retry()
    expect(state.value).toEqual({ status: 'loading', pending: 'load' })
    d.resolve({ code: '5916', expired: false })
    await done

    expect(get).toHaveBeenCalledTimes(2)
    expect(state.value).toEqual({ status: 'ready', code: '5916' })
  })

  it('is ignored when no error is shown', async () => {
    get.mockResolvedValue({ code: '5916', expired: false })
    const { load, retry } = useAccessCode()
    await load()
    await retry()
    expect(get).toHaveBeenCalledTimes(1)
    expect(regen).not.toHaveBeenCalled()
  })
})

describe('regenerating the code', () => {
  async function ready() {
    get.mockResolvedValue({ code: '5916', expired: false })
    const api = useAccessCode()
    await api.load()
    return api
  }

  it('requests a new code, shows progress, then the new code and announces it', async () => {
    const api = await ready()
    const d = deferred<Result>()
    regen.mockReturnValue(d.promise)

    const done = api.regenerate()
    expect(api.state.value).toEqual({ status: 'loading', pending: 'regenerate' })

    d.resolve({ code: '4827', expired: false })
    await done

    expect(regen).toHaveBeenCalledTimes(1)
    expect(api.state.value).toEqual({ status: 'ready', code: '4827' })
    expect(api.announcement.value).toContain('4 8 2 7')
  })

  it('works from the expired state', async () => {
    get.mockResolvedValue({ code: '5916', expired: true })
    const api = useAccessCode()
    await api.load()
    regen.mockResolvedValue({ code: '4827', expired: false })
    await api.regenerate()
    expect(api.state.value).toEqual({ status: 'ready', code: '4827' })
  })

  it('sends only one request when activated twice in quick succession', async () => {
    const api = await ready()
    const d = deferred<Result>()
    regen.mockReturnValue(d.promise)

    const first = api.regenerate()
    const second = api.regenerate()
    d.resolve({ code: '4827', expired: false })
    await Promise.all([first, second])

    expect(regen).toHaveBeenCalledTimes(1)
  })

  it('is ignored while the code is still loading', async () => {
    const api = useAccessCode()
    await api.regenerate()
    expect(regen).not.toHaveBeenCalled()
  })

  it('shows the server error state on HTTP 500 and retry repeats the regeneration', async () => {
    const api = await ready()
    regen.mockRejectedValueOnce(new AccessCodeError('server', 'Server error (500)'))
    await api.regenerate()
    expect(api.state.value).toEqual({ status: 'error', kind: 'server', failed: 'regenerate' })

    regen.mockResolvedValueOnce({ code: '4827', expired: false })
    await api.retry()
    expect(regen).toHaveBeenCalledTimes(2)
    expect(get).toHaveBeenCalledTimes(1)
    expect(api.state.value).toEqual({ status: 'ready', code: '4827' })
  })

  it('shows the general error state on a network failure and retry repeats the regeneration', async () => {
    const api = await ready()
    regen.mockRejectedValueOnce(new AccessCodeError('general', 'Could not reach the server'))
    await api.regenerate()
    expect(api.state.value).toEqual({ status: 'error', kind: 'general', failed: 'regenerate' })

    regen.mockResolvedValueOnce({ code: '1234', expired: false })
    await api.retry()
    expect(regen).toHaveBeenCalledTimes(2)
    expect(api.state.value).toEqual({ status: 'ready', code: '1234' })
  })
})
