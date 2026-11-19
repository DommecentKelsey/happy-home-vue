import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AccessCode from '../AccessCode.vue'
import AccessCodeCard from '../AccessCodeCard.vue'
import AppLogo from '../AppLogo.vue'
import BaseButton from '../BaseButton.vue'
import CodeDigit from '../CodeDigit.vue'
import StatusMessage from '../StatusMessage.vue'
import IconAlert from '../icons/IconAlert.vue'
import IconClock from '../icons/IconClock.vue'
import IconClose from '../icons/IconClose.vue'
import IconHome from '../icons/IconHome.vue'
import IconRetry from '../icons/IconRetry.vue'
import IconServer from '../icons/IconServer.vue'
import IconSpinner from '../icons/IconSpinner.vue'
import type { AccessCodeState } from '@/composables/useAccessCode'

describe('icons', () => {
  it.each([
    ['close', IconClose],
    ['retry', IconRetry],
    ['alert', IconAlert],
    ['clock', IconClock],
    ['server', IconServer],
    ['spinner', IconSpinner],
    ['home', IconHome],
  ])('%s renders a decorative svg', (_name, Icon) => {
    const svg = mount(Icon).find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('uses the requested size', () => {
    expect(
      mount(IconClose, { props: { size: 14 } })
        .find('svg')
        .attributes('width'),
    ).toBe('14')
  })
})

describe('CodeDigit', () => {
  it.each([
    ['default', '5', '5'],
    ['hidden', '5', '*'],
    ['error', '5', '–'],
    ['unavailable', '5', '–'],
    ['expired', '5', '5'],
  ] as const)('state %s shows "%s" as %s', (state, digit, shown) => {
    const wrapper = mount(CodeDigit, { props: { digit, state } })
    expect(wrapper.text()).toBe(shown)
    expect(wrapper.attributes('data-state')).toBe(state)
  })
})

describe('AccessCode', () => {
  it('shows the four digits from left to right', () => {
    const wrapper = mount(AccessCode, { props: { code: '5916' } })
    expect(wrapper.findAllComponents(CodeDigit).map((d) => d.text())).toEqual(['5', '9', '1', '6'])
  })

  it('is announced as one value', () => {
    const wrapper = mount(AccessCode, { props: { code: '5916' } })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Access code 5 9 1 6')
  })

  it('announces loading and shows four masked digits', () => {
    const wrapper = mount(AccessCode, { props: { state: 'hidden' } })
    expect(wrapper.attributes('aria-label')).toBe('Loading access code')
    expect(wrapper.findAllComponents(CodeDigit).map((d) => d.text())).toEqual(['*', '*', '*', '*'])
  })

  it('announces an expired code as expired', () => {
    const wrapper = mount(AccessCode, { props: { code: '5916', state: 'expired' } })
    expect(wrapper.attributes('aria-label')).toBe('Expired access code 5 9 1 6')
  })

  it.each(['error', 'unavailable'] as const)('announces the %s state as unavailable', (state) => {
    const wrapper = mount(AccessCode, { props: { state } })
    expect(wrapper.attributes('aria-label')).toBe('Access code unavailable')
    expect(wrapper.findAllComponents(CodeDigit).map((d) => d.text())).toEqual(['–', '–', '–', '–'])
  })
})

describe('StatusMessage', () => {
  it('error: alert role, alert icon and text', () => {
    const wrapper = mount(StatusMessage, { props: { type: 'error' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.findComponent(IconAlert).exists()).toBe(true)
    expect(wrapper.text()).toBe('Something went wrong. Please try again.')
  })

  it('warning: status role, clock icon and expired text', () => {
    const wrapper = mount(StatusMessage, { props: { type: 'warning' } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.findComponent(IconClock).exists()).toBe(true)
    expect(wrapper.text()).toBe('This code has expired. Get a new code.')
  })

  it('server-error: alert role, server icon and text', () => {
    const wrapper = mount(StatusMessage, { props: { type: 'server-error' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.findComponent(IconServer).exists()).toBe(true)
    expect(wrapper.text()).toBe('Server error (500). Try again later.')
  })
})

describe('BaseButton', () => {
  it('shows its label and emits click', async () => {
    const wrapper = mount(BaseButton, { props: { label: 'Get new code' } })
    expect(wrapper.text()).toBe('Get new code')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('can show the retry icon', () => {
    const wrapper = mount(BaseButton, { props: { label: 'Try again', retryIcon: true } })
    expect(wrapper.findComponent(IconRetry).exists()).toBe(true)
  })

  it('while loading: spinner instead of label, busy, disabled and no clicks', async () => {
    const wrapper = mount(BaseButton, { props: { label: 'Get new code', loading: true } })
    expect(wrapper.findComponent(IconSpinner).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Get new code')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('AppLogo', () => {
  it('shows the home icon and the name', () => {
    const wrapper = mount(AppLogo)
    expect(wrapper.findComponent(IconHome).exists()).toBe(true)
    expect(wrapper.text()).toBe('Happy home')
  })
})

describe('AccessCodeCard', () => {
  const mountCard = (state: AccessCodeState) => mount(AccessCodeCard, { props: { state } })
  const button = (w: ReturnType<typeof mountCard>) => w.findComponent(BaseButton)
  const digitStates = (w: ReturnType<typeof mountCard>) =>
    w.findAllComponents(CodeDigit).map((d) => d.attributes('data-state'))

  it('loading: masked digits, spinner button, no message', () => {
    const w = mountCard({ status: 'loading', pending: 'load' })
    expect(digitStates(w)).toEqual(['hidden', 'hidden', 'hidden', 'hidden'])
    expect(button(w).props('loading')).toBe(true)
    expect(w.findComponent(StatusMessage).exists()).toBe(false)
  })

  it('ready: shows the code and an enabled "Get new code" button', () => {
    const w = mountCard({ status: 'ready', code: '5916' })
    expect(w.find('[role="img"]').attributes('aria-label')).toBe('Access code 5 9 1 6')
    expect(digitStates(w)).toEqual(['default', 'default', 'default', 'default'])
    expect(button(w).props()).toMatchObject({
      label: 'Get new code',
      loading: false,
      retryIcon: false,
    })
    expect(w.findComponent(StatusMessage).exists()).toBe(false)
  })

  it('expired: struck digits, warning message, "Get new code" starts a regeneration', async () => {
    const w = mountCard({ status: 'expired', code: '5916' })
    expect(digitStates(w)).toEqual(['expired', 'expired', 'expired', 'expired'])
    expect(w.findComponent(StatusMessage).props('type')).toBe('warning')
    await button(w).trigger('click')
    expect(w.emitted('regenerate')).toHaveLength(1)
    expect(w.emitted('retry')).toBeUndefined()
  })

  it('server error: neutral boxes, server message, "Try again" emits retry', async () => {
    const w = mountCard({ status: 'error', kind: 'server', failed: 'load' })
    expect(digitStates(w)).toEqual(['unavailable', 'unavailable', 'unavailable', 'unavailable'])
    expect(w.findComponent(StatusMessage).props('type')).toBe('server-error')
    expect(button(w).props()).toMatchObject({ label: 'Try again', retryIcon: true })
    await button(w).trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(w.emitted('regenerate')).toBeUndefined()
  })

  it('general error: error boxes, general message, "Try again"', () => {
    const w = mountCard({ status: 'error', kind: 'general', failed: 'regenerate' })
    expect(digitStates(w)).toEqual(['error', 'error', 'error', 'error'])
    expect(w.findComponent(StatusMessage).props('type')).toBe('error')
    expect(button(w).props('label')).toBe('Try again')
  })

  it.each<AccessCodeState>([
    { status: 'loading', pending: 'load' },
    { status: 'ready', code: '5916' },
    { status: 'expired', code: '5916' },
    { status: 'error', kind: 'server', failed: 'load' },
    { status: 'error', kind: 'general', failed: 'load' },
  ])('always explains that a new code invalidates the old one (%o)', (state) => {
    const text = mountCard(state).text()
    expect(text).toContain('unique for your apartment')
    expect(text).toContain('old code can not be used anymore')
  })

  it('has a native close button that emits close', async () => {
    const w = mountCard({ status: 'ready', code: '5916' })
    const close = w.find('button[aria-label="Close"]')
    // A native <button type="button"> is operable with Enter and Space by browsers.
    expect(close.element.tagName).toBe('BUTTON')
    expect(close.attributes('type')).toBe('button')
    await close.trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('names the region by its title', () => {
    const w = mountCard({ status: 'ready', code: '5916' })
    expect(w.find('h1').text()).toBe('Your access code:')
    expect(w.find('section').attributes('aria-labelledby')).toBe(w.find('h1').attributes('id'))
  })
})
