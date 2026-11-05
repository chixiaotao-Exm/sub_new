import { createI18n } from 'vue-i18n'

export type LocaleCode = 'en' | 'zh' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'ru' | 'fr' | 'de' | 'pt'

type LocaleMessages = Record<string, any>

const LOCALE_KEY = 'sub2api_locale'
const DEFAULT_LOCALE: LocaleCode = 'en'

const localeLoaders: Record<LocaleCode, () => Promise<{ default: LocaleMessages }>> = {
  en: () => import('./locales/en'),
  zh: () => import('./locales/zh'),
  'zh-TW': () => import('./locales/zh-TW.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  es: () => import('./locales/es.json'),
  ru: () => import('./locales/ru.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  pt: () => import('./locales/pt.json')
}

function isLocaleCode(value: string): value is LocaleCode {
  return Object.prototype.hasOwnProperty.call(localeLoaders, value)
}

/** Keep previously saved v2 locale selections and standard browser tags. */
export function normalizeLocale(value: string | null | undefined): LocaleCode | null {
  if (!value) return null
  if (isLocaleCode(value)) return value
  const tag = value.toLowerCase().replace(/_/g, '-')
  if (/^zh-(tw|hk|mo|hant)(-|$)/.test(tag)) return 'zh-TW'
  const language = tag.split('-')[0]
  return isLocaleCode(language) ? language : null
}

function getDefaultLocale(): LocaleCode {
  const query = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null
  return normalizeLocale(query)
    || normalizeLocale(localStorage.getItem(LOCALE_KEY))
    || normalizeLocale(localStorage.getItem('ui_locale'))
    || normalizeLocale(navigator.language)
    || DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
  // 禁用 HTML 消息警告 - 引导步骤使用富文本内容（driver.js 支持 HTML）
  // 这些内容是内部定义的，不存在 XSS 风险
  warnHtmlMessage: false
})

const loadedLocales = new Set<LocaleCode>()
const loadingLocales = new Map<LocaleCode, Promise<void>>()
let localeChange = 0

export async function loadLocaleMessages(locale: LocaleCode): Promise<void> {
  if (loadedLocales.has(locale)) {
    return
  }

  if (loadingLocales.has(locale)) return loadingLocales.get(locale)
  const loading = localeLoaders[locale]().then((module) => {
    i18n.global.setLocaleMessage(locale, module.default)
    loadedLocales.add(locale)
  }).finally(() => loadingLocales.delete(locale))
  loadingLocales.set(locale, loading)
  return loading
}

export async function initI18n(): Promise<void> {
  const current = getLocale()
  await loadLocaleMessages(current)
  document.documentElement.setAttribute('lang', current)
}

export async function setLocale(locale: string): Promise<void> {
  const normalized = normalizeLocale(locale)
  if (!normalized) return
  const change = ++localeChange

  await loadLocaleMessages(normalized)
  if (change !== localeChange) return
  i18n.global.locale.value = normalized
  localStorage.setItem(LOCALE_KEY, normalized)
  localStorage.setItem('ui_locale', normalized)
  document.documentElement.setAttribute('lang', normalized)
  // A preview/share link may explicitly select a language. Keep that query in
  // sync before LocaleSwitcher reloads, otherwise it would undo the choice.
  const url = new URL(window.location.href)
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', normalized)
    window.history.replaceState(window.history.state, '', url)
  }

  // 同步更新浏览器页签标题，使其跟随语言切换
  const { resolveRouteDocumentTitle } = await import('@/router/title')
  const { default: router } = await import('@/router')
  const { useAppStore } = await import('@/stores/app')
  const { useAuthStore } = await import('@/stores/auth')
  const { useAdminSettingsStore } = await import('@/stores/adminSettings')
  const route = router.currentRoute.value
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const adminSettingsStore = useAdminSettingsStore()
  const customMenuItems = [
    ...(appStore.cachedPublicSettings?.custom_menu_items ?? []),
    ...(authStore.isAdmin ? adminSettingsStore.customMenuItems : []),
  ]
  document.title = resolveRouteDocumentTitle(route, appStore.siteName, customMenuItems)
}

export function getLocale(): LocaleCode {
  const current = i18n.global.locale.value
  return isLocaleCode(current) ? current : DEFAULT_LOCALE
}

export const availableLocales = [
  { code: 'zh', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' }
] as const

export default i18n
