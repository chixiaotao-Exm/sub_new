import { describe, expect, it } from 'vitest'
import { oauthCallbackErrorMessage } from '../oauthCallbackError'
const t = (key: string) => key === 'auth.oidc.invalidPendingToken' ? '会话已过期，请重新登录。' : key
describe('OAuth callback terminal errors', () => {
  it.each(['PENDING_AUTH_SESSION_NOT_FOUND','PENDING_AUTH_SESSION_EXPIRED','PENDING_AUTH_SESSION_CONSUMED','PENDING_AUTH_SESSION_INVALID','PENDING_AUTH_CODE_INVALID','PENDING_AUTH_CODE_EXPIRED','PENDING_AUTH_CODE_CONSUMED','PENDING_AUTH_BROWSER_MISMATCH'])('localizes %s without exposing raw session internals', reason => {
    expect(oauthCallbackErrorMessage({ reason, message: 'pending auth session not found' }, t, 'fallback')).toBe('会话已过期，请重新登录。')
  })
  it('preserves an unrelated provider configuration error', () => {
    expect(oauthCallbackErrorMessage({ reason: 'UPSTREAM_ERROR', message: 'The identity provider rejected the client ID' }, t, 'fallback')).toBe('The identity provider rejected the client ID')
  })
  it('handles the older nested error shape', () => {
    expect(oauthCallbackErrorMessage({ response: { data: { code: 'PENDING_AUTH_SESSION_EXPIRED' } } }, t, 'fallback')).toBe('会话已过期，请重新登录。')
  })
})
