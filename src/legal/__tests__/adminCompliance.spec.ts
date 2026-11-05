import { describe, expect, it } from 'vitest'
import { getAdminComplianceDocument } from '../adminCompliance'

const locales = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'es', 'ru', 'fr', 'de', 'pt']
const original = getAdminComplianceDocument('en')

describe('bundled compliance documents', () => {
  it.each(locales)('%s retains the canonical version, all sections, commitments, and paragraphs', locale => {
    const document = getAdminComplianceDocument(locale)
    expect(document.match(/v2026\.06\.10/g)).toHaveLength(1)
    expect(document.match(/^## /gm)).toHaveLength(6)
    expect(document.match(/^[1-7]\. /gm)).toHaveLength(7)
    expect(document.trim().split(/\r?\n\s*\r?\n/)).toHaveLength(original.trim().split(/\r?\n\s*\r?\n/).length)
    expect(document).toContain('Sub2API')
    expect(document).toContain('OpenAI')
    expect(document).toContain('Anthropic')
    expect(document).toContain('Google')
    expect(document).toContain('User-Agent')
    if (locale !== 'en') expect(document).not.toBe(original)
  })
})
