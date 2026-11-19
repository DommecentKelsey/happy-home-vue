/**
 * Development-only fake backend, used when VITE_API_BASE_URL is not set.
 * Lets you see the card with digits before the real endpoint exists.
 *
 * Force a state with a query parameter, e.g. http://localhost:5173/?mock=error
 *   (default) -> a random 4-digit code
 *   ?mock=expired  -> an expired code
 *   ?mock=error    -> general error
 *   ?mock=server   -> server error
 */
import { AccessCodeError, type AccessCode } from './accessCode'

const DELAY_MS = 600

function randomCode(): string {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, '0')
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DELAY_MS))
}

async function respond(): Promise<AccessCode> {
  await delay()
  const mode = new URLSearchParams(window.location.search).get('mock')
  if (mode === 'error') throw new AccessCodeError('general', 'Mock error')
  if (mode === 'server') throw new AccessCodeError('server', 'Mock server error')
  return { code: randomCode(), expired: mode === 'expired' }
}

export const mockGetAccessCode = respond
export const mockRegenerateAccessCode = respond
