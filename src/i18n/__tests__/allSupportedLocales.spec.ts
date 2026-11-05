import { describe, expect, it } from 'vitest'
import { baseCompile } from '@intlify/message-compiler'
import { availableLocales, normalizeLocale } from '../index'
import en from '../locales/en'
import zh from '../locales/zh'

const generated = import.meta.glob('../locales/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>
const flatten = (value: Record<string, unknown>, prefix = ''): Record<string, string> => Object.fromEntries(
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' && !Array.isArray(child)
      ? Object.entries(flatten(child as Record<string, unknown>, path))
      : [[path, child as string]]
  })
)
const english = flatten(en)
const chinese = flatten(zh)

describe('all ten supported interface languages', () => {
  it('retains every advertised language and previous v2 selections', () => {
    expect(availableLocales.map(locale => locale.code)).toEqual(['zh', 'zh-TW', 'en', 'ja', 'ko', 'es', 'ru', 'fr', 'de', 'pt'])
    expect(['zh-CN', 'zh-Hant', 'zh-HK', 'ja-JP', 'ko-KR', 'es-ES', 'ru-RU', 'fr-FR', 'de-DE', 'pt-BR', 'en-US'].map(normalizeLocale))
      .toEqual(['zh', 'zh-TW', 'zh-TW', 'ja', 'ko', 'es', 'ru', 'fr', 'de', 'pt', 'en'])
  })

  it.each(['zh-TW', 'ja', 'ko', 'es', 'ru', 'fr', 'de', 'pt'])('%s has complete, nonempty, compilable messages and intact placeholders', (locale) => {
    const dictionary = flatten(generated[`../locales/${locale}.json`] || {})
    const source = locale === 'zh-TW' ? chinese : english
    expect(Object.keys(source).filter(key => !(key in dictionary)), 'missing translation keys').toEqual([])
    expect(Object.keys(dictionary).filter(key => !(key in source)), 'unexpected translation keys').toEqual([])
    const issues: string[] = []
    for (const [key, text] of Object.entries(dictionary)) {
      if (typeof text !== 'string' || !text.trim()) { issues.push(`${key}: empty message`); continue }
      const placeholders = (s: string) => (s.match(/\{[^{}]*\}/g) || []).sort()
      if (JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(source[key]))) issues.push(`${key}: placeholders changed`)
      baseCompile(text, { onError: error => issues.push(`${key}: ${error.message}`) })
    }
    expect(issues).toEqual([])
  })
})
