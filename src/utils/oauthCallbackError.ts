import { extractApiErrorCode, extractApiErrorMessage } from './apiError'

const expiredContextCodes = new Set([
  'PENDING_AUTH_SESSION_NOT_FOUND', 'PENDING_AUTH_SESSION_EXPIRED',
  'PENDING_AUTH_SESSION_CONSUMED', 'PENDING_AUTH_SESSION_INVALID',
  'PENDING_AUTH_CODE_INVALID', 'PENDING_AUTH_CODE_EXPIRED',
  'PENDING_AUTH_CODE_CONSUMED', 'PENDING_AUTH_BROWSER_MISMATCH',
])

export function oauthCallbackErrorMessage(error: unknown, t: (key: string) => string, fallback: string): string {
  const code = extractApiErrorCode(error)
  if (code && expiredContextCodes.has(code)) return t('auth.oidc.invalidPendingToken')
  // Retain provider/configuration details for errors other than a missing session.
  return extractApiErrorMessage(error, fallback)
}
