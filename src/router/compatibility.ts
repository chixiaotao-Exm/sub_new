import type { RouteRecordRaw } from 'vue-router'

// Canonical original user routes (/usage, /orders, /redeem, /subscriptions)
// intentionally keep their user meaning. Administrative pages live under /admin.
const legacyPaths: Record<string, string> = {
  '/users': '/admin/users',
  '/accounts': '/admin/accounts',
  '/groups': '/admin/groups',
  '/channels': '/admin/channels/pricing',
  '/plugins': '/admin/plugins',
  '/announcements': '/admin/announcements',
  '/ip-rules': '/admin/proxies',
  '/coupons': '/admin/promo-codes',
  '/audit': '/admin/audit-logs',
  '/settings': '/admin/settings',
  '/my-usage': '/usage',
  '/my-usage-keys': '/usage',
  '/my-orders': '/orders',
  '/recharge': '/purchase',
}

export function compatibilityRoutes(base = import.meta.env.BASE_URL): RouteRecordRaw[] {
  const entries = { ...legacyPaths }
  // The root /ops belongs to the existing KOOK service. Never claim it here.
  if (base.replace(/\/$/, '') === '/v2') entries['/ops'] = '/admin/ops'
  return Object.entries(entries).map(([path, target]) => ({
    path,
    redirect: to => ({ path: target, query: to.query, hash: to.hash }),
  }))
}
