import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { AccessCodeError, getAccessCode, regenerateAccessCode } from '@/api/accessCode'
import AccessCodeView from '../AccessCodeView.vue'

vi.mock('@/api/accessCode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/accessCode')>()),
  getAccessCode: vi.fn(),
  regenerateAccessCode: vi.fn(),
}))

const get = vi.mocked(getAccessCode)
const regen = vi.mocked(regenerateAccessCode)

beforeEach(() => {
  get.mockReset()
  regen.mockReset()
})

const label = (w: ReturnType<typeof mount>) => w.find('[role="img"]').attributes('aria-label')

describe('AccessCodeView', () => {
  it('requests the code exactly once when it opens and shows the loading state', async () => {
    get.mockReturnValue(new Promise(() => {}))
    const w = mount(AccessCodeView)
    await flushPromises()

    expect(get).toHaveBeenCalledTimes(1)
    expect(label(w)).toBe('Loading access code')
    expect(w.find('button.base-button').attributes('aria-busy')).toBe('true')
    expect(w.find('button.base-button').attributes('disabled')).toBeDefined()
  })

  it('walks loading → code → regenerate → new code and announces it', async () => {
    get.mockResolvedValue({ code: '5916', expired: false })
    const w = mount(AccessCodeView)
    await flushPromises()
    expect(label(w)).toBe('Access code 5 9 1 6')
    expect(w.find('[aria-live="polite"]').text()).toBe('')

    let finish!: (v: { code: string; expired: boolean }) => void
    regen.mockReturnValue(new Promise((res) => (finish = res)))
    await w.find('button.base-button').trigger('click')
    expect(label(w)).toBe('Loading access code')

    finish({ code: '4827', expired: false })
    await flushPromises()

    expect(regen).toHaveBeenCalledTimes(1)
    expect(label(w)).toBe('Access code 4 8 2 7')
    expect(w.find('[aria-live="polite"]').text()).toContain('4 8 2 7')
  })

  it('shows the server error state and "Try again" loads the code again', async () => {
    get.mockRejectedValueOnce(new AccessCodeError('server', 'Server error (503)'))
    const w = mount(AccessCodeView)
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toBe('Server error (500). Try again later.')
    expect(w.find('button.base-button').text()).toBe('Try again')

    get.mockResolvedValueOnce({ code: '5916', expired: false })
    await w.find('button.base-button').trigger('click')
    await flushPromises()

    expect(get).toHaveBeenCalledTimes(2)
    expect(label(w)).toBe('Access code 5 9 1 6')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('dismisses everything when the close control is used', async () => {
    get.mockResolvedValue({ code: '5916', expired: false })
    const w = mount(AccessCodeView)
    await flushPromises()

    await w.find('button[aria-label="Close"]').trigger('click')

    expect(w.find('main').exists()).toBe(false)
    expect(w.text()).toBe('')
  })
})
