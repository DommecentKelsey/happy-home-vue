import { ref, readonly } from 'vue'
import { AccessCodeError, getAccessCode, regenerateAccessCode } from '@/api/accessCode'

export type AccessCodeAction = 'load' | 'regenerate'

export type AccessCodeState =
  | { status: 'loading'; pending: AccessCodeAction }
  | { status: 'ready'; code: string }
  | { status: 'expired'; code: string }
  | { status: 'error'; kind: 'server' | 'general'; failed: AccessCodeAction }

/**
 * Behavior of the access code screen: loading the code, requesting a new one and retrying
 * after a failure. Knows nothing about the HTTP details (see api/accessCode.ts).
 */
export function useAccessCode() {
  const state = ref<AccessCodeState>({ status: 'loading', pending: 'load' })
  /** Text for a polite live region, set when a new code has been issued. */
  const announcement = ref('')

  async function run(action: AccessCodeAction): Promise<void> {
    state.value = { status: 'loading', pending: action }
    try {
      const { code, expired } =
        action === 'load' ? await getAccessCode() : await regenerateAccessCode()
      state.value = expired ? { status: 'expired', code } : { status: 'ready', code }
      if (action === 'regenerate') {
        announcement.value = `A new access code is shown: ${code.split('').join(' ')}`
      }
    } catch (error) {
      const kind = error instanceof AccessCodeError ? error.kind : 'general'
      state.value = { status: 'error', kind, failed: action }
    }
  }

  /** Requests the current code. Call once when the screen opens. */
  function load(): Promise<void> {
    return run('load')
  }

  /** Requests a new code; ignored while another request is running. */
  async function regenerate(): Promise<void> {
    if (state.value.status === 'loading') return
    announcement.value = ''
    await run('regenerate')
  }

  /** Repeats the action that failed; ignored unless an error is shown. */
  async function retry(): Promise<void> {
    if (state.value.status !== 'error') return
    await run(state.value.failed)
  }

  return { state: readonly(state), announcement: readonly(announcement), load, regenerate, retry }
}
