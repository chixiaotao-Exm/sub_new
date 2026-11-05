import { describe, expect, it } from 'vitest'
import { invalidAccountResourceFields, hasInvalidGroupMultiplier } from '../resourceValidation'

const account = { platform: 'openai', concurrency: 1, priority: 1, rate_multiplier: 1, load_factor: null }
describe('resource values submitted by native forms', () => {
  it.each([-1, 0, 1.5, NaN, Infinity, ''])('rejects invalid account concurrency %s', value => {
    expect(invalidAccountResourceFields({ ...account, concurrency: value })).toContain('admin.accounts.concurrency')
  })
  it('rejects an unregistered platform', () => {
    expect(invalidAccountResourceFields({ ...account, platform: 'not-a-platform' })).toContain('admin.accounts.platform')
  })
  it.each([-1, NaN, Infinity, ''])('rejects malformed account billing rate %s', value => {
    expect(invalidAccountResourceFields({ ...account, rate_multiplier: value })).toContain('admin.accounts.billingRateMultiplier')
  })
  it('allows an explicit free account and omitted load factor', () => {
    expect(invalidAccountResourceFields({ ...account, rate_multiplier: 0 })).toEqual([])
  })
  it.each(['rate_multiplier', 'image_rate_multiplier', 'video_rate_multiplier', 'peak_rate_multiplier'])('rejects negative %s for group forms', field => {
    expect(hasInvalidGroupMultiplier({ [field]: -0.1 })).toBe(true)
    expect(hasInvalidGroupMultiplier({ [field]: Infinity })).toBe(true)
    expect(hasInvalidGroupMultiplier({ [field]: 0 })).toBe(false)
  })
})
