import { isKnownPlatform } from '@/constants/platformCatalog'

export interface AccountResourceInput {
  platform: string
  concurrency: unknown
  priority: unknown
  rate_multiplier: unknown
  load_factor?: unknown
}

/** Validate only fields actually supplied by bulk edits/imports; do not rewrite defaults. */
export function invalidAccountResourcePatchFields(
  input: Partial<AccountResourceInput>,
  options: { allowZeroConcurrency?: boolean; allowNullRate?: boolean; allowClearLoadFactor?: boolean } = {},
): string[] {
  const fields: string[] = []
  if (input.platform !== undefined && (typeof input.platform !== 'string' || !isKnownPlatform(input.platform))) fields.push('admin.accounts.platform')
  if (input.concurrency !== undefined && (typeof input.concurrency !== 'number' || !Number.isSafeInteger(input.concurrency) || input.concurrency < (options.allowZeroConcurrency ? 0 : 1))) fields.push('admin.accounts.concurrency')
  if (input.priority !== undefined && (typeof input.priority !== 'number' || !Number.isSafeInteger(input.priority) || input.priority < 0)) fields.push('admin.accounts.priority')
  if (input.rate_multiplier !== undefined && !(options.allowNullRate && input.rate_multiplier === null) && (typeof input.rate_multiplier !== 'number' || !Number.isFinite(input.rate_multiplier) || input.rate_multiplier < 0)) fields.push('admin.accounts.billingRateMultiplier')
  if (input.load_factor != null && input.load_factor !== '' && (typeof input.load_factor !== 'number' || !Number.isSafeInteger(input.load_factor) || input.load_factor < (options.allowClearLoadFactor ? 0 : 1))) fields.push('admin.accounts.loadFactor')
  return fields
}

/** Validate before a multi-step create flow or account edit can send data. */
export function invalidAccountResourceFields(input: AccountResourceInput): string[] {
  const fields: string[] = []
  if (!isKnownPlatform(input.platform)) fields.push('admin.accounts.platform')
  if (typeof input.concurrency !== 'number' || !Number.isSafeInteger(input.concurrency) || input.concurrency < 1) fields.push('admin.accounts.concurrency')
  if (typeof input.priority !== 'number' || !Number.isSafeInteger(input.priority) || input.priority < 0) fields.push('admin.accounts.priority')
  if (typeof input.rate_multiplier !== 'number' || !Number.isFinite(input.rate_multiplier) || input.rate_multiplier < 0) fields.push('admin.accounts.billingRateMultiplier')
  if (input.load_factor != null && input.load_factor !== '' && (typeof input.load_factor !== 'number' || !Number.isSafeInteger(input.load_factor) || input.load_factor < 1)) fields.push('admin.accounts.loadFactor')
  return fields
}

export function hasInvalidGroupMultiplier(input: Record<string, unknown>): boolean {
  return ['rate_multiplier', 'image_rate_multiplier', 'video_rate_multiplier', 'peak_rate_multiplier'].some(key => {
    const value = input[key]
    return value !== undefined && value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
  })
}
