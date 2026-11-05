import lookup from './inline-lookup.json'

/** Translate legacy bilingual literals using the same complete locale bundle. */
export function createInlineTranslator(t: (key: string) => string) {
  return (_zh: string, en: string): string => {
    const key = (lookup as Record<string, string>)[en]
    return key ? t(key) : en
  }
}
