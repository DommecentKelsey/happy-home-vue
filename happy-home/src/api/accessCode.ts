/**
 * All communication with the access-code backend lives in this module.
 *
 * The real endpoint is not available yet. This implements the contract assumed in
 * openspec/changes/add-access-code-card/design.md (decision 3):
 *
 *   GET  {VITE_API_BASE_URL}/access-code             -> 200 { code: "5916", expiresAt: string | null }
 *   POST {VITE_API_BASE_URL}/access-code/regenerate  -> 200 { code: "4827", expiresAt: string | null }
 *
 * When the real contract is known, only this file (and its tests) should change.
 */

import { mockGetAccessCode, mockRegenerateAccessCode } from './mockAccessCode'

export interface AccessCode {
  /** Exactly four digits. */
  code: string
  /** True when the backend reports that the code has expired. */
  expired: boolean
}

export type AccessCodeErrorKind = 'server' | 'general'

export class AccessCodeError extends Error {
  readonly kind: AccessCodeErrorKind

  constructor(kind: AccessCodeErrorKind, message: string) {
    super(message)
    this.name = 'AccessCodeError'
    this.kind = kind
  }
}

export const REQUEST_TIMEOUT_MS = 10_000

const CODE_PATTERN = /^\d{4}$/

function baseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
}

/** In development without a configured backend, a fake one is used (see mockAccessCode.ts). */
function useMock(): boolean {
  return import.meta.env.DEV && baseUrl() === ''
}

/** Decides whether the backend considers the code expired. */
function isExpired(expiresAt: unknown, now: number = Date.now()): boolean {
  if (typeof expiresAt !== 'string') return false
  const time = Date.parse(expiresAt)
  return !Number.isNaN(time) && time < now
}

function parse(body: unknown): AccessCode {
  if (typeof body !== 'object' || body === null) {
    throw new AccessCodeError('general', 'Unexpected response')
  }
  const { code, expiresAt } = body as { code?: unknown; expiresAt?: unknown }
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) {
    throw new AccessCodeError('general', 'Invalid access code in response')
  }
  return { code, expired: isExpired(expiresAt) }
}

async function request(path: string, method: 'GET' | 'POST'): Promise<AccessCode> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    let response: Response
    try {
      response = await fetch(`${baseUrl()}${path}`, {
        method,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
    } catch {
      // Network failure or timeout (abort).
      throw new AccessCodeError('general', 'Could not reach the server')
    }

    if (response.status >= 500 && response.status <= 599) {
      throw new AccessCodeError('server', `Server error (${response.status})`)
    }
    if (!response.ok) {
      throw new AccessCodeError('general', `Unexpected status ${response.status}`)
    }

    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new AccessCodeError('general', 'Response was not valid JSON')
    }
    return parse(body)
  } finally {
    clearTimeout(timer)
  }
}

/** Gets the current access code of the apartment. */
export function getAccessCode(): Promise<AccessCode> {
  if (useMock()) return mockGetAccessCode()
  return request('/access-code', 'GET')
}

/** Issues a new access code; the previous code stops working. */
export function regenerateAccessCode(): Promise<AccessCode> {
  if (useMock()) return mockRegenerateAccessCode()
  return request('/access-code/regenerate', 'POST')
}
