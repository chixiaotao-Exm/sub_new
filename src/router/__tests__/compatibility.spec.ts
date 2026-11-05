import { describe, expect, it } from 'vitest'
import { appPath, appUrl } from '../appUrls'
import { compatibilityRoutes } from '../compatibility'

describe('deployment-aware navigation', () => {
  it.each(['/', '/v2/'])('retains deep links, query and fragments under %s', base => {
    const target = '/payment/result?order_id=123&status=success#result'
    expect(appUrl(target, base)).toBe(base + target.slice(1))
    expect(appPath(appUrl('/admin/ops', base), base)).toBe('/admin/ops')
    expect(appUrl(appUrl('/login', base), base)).toBe(base + 'login')
  })

  it('does not strip a similarly named unrelated path', () => {
    expect(appPath('/v20/login', '/v2/')).toBe('/v20/login')
  })

  it('keeps canonical user paths distinct from admin shortcuts', () => {
    for (const base of ['/', '/v2/']) {
      const paths = compatibilityRoutes(base).map(r => r.path)
      for (const path of ['/dashboard', '/usage', '/orders', '/redeem', '/subscriptions']) {
        expect(paths).not.toContain(path)
      }
    }
  })

  it('does not take over the existing root KOOK /ops service', () => {
    expect(compatibilityRoutes('/').find(r => r.path === '/ops')).toBeUndefined()
    expect(compatibilityRoutes('/v2/').find(r => r.path === '/ops')).toBeDefined()
  })

  it.each([
    ['/users', '/admin/users'], ['/accounts', '/admin/accounts'],
    ['/ip-rules', '/admin/proxies'], ['/coupons', '/admin/promo-codes'],
    ['/my-usage', '/usage'], ['/my-orders', '/orders'], ['/recharge', '/purchase'],
  ])('preserves bookmark filters when redirecting %s', (path, target) => {
    const route = compatibilityRoutes('/').find(r => r.path === path)!
    const redirect = route.redirect as (to: any) => unknown
    expect(redirect({ query: { page: '2', group_id: '4' }, hash: '#details' })).toEqual({
      path: target, query: { page: '2', group_id: '4' }, hash: '#details',
    })
  })
})
