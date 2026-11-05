/** URLs for browser-level navigation, separate from API and gateway URLs. */
export function appUrl(path: string, base = import.meta.env.BASE_URL): string {
  const prefix = '/' + String(base || '/').replace(/^\/+|\/+$/g, '')
  const normalizedBase = prefix === '/' ? '/' : prefix + '/'
  const localPath = '/' + path.replace(/^\/+/, '')
  if (normalizedBase !== '/' && localPath.startsWith(normalizedBase)) return localPath
  return normalizedBase + localPath.slice(1)
}

export function appPath(pathname: string, base = import.meta.env.BASE_URL): string {
  const prefix = appUrl('', base).replace(/\/$/, '')
  if (prefix && (pathname === prefix || pathname.startsWith(prefix + '/'))) {
    return pathname.slice(prefix.length) || '/'
  }
  return pathname
}
