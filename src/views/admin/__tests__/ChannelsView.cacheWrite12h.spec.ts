import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Channel, ChannelModelPricing, PricingInterval } from '@/api/admin/channels'
import ChannelsView from '@/views/admin/ChannelsView.vue'

const { listChannels, updateChannel, getGroups, showSuccess, showError } = vi.hoisted(() => ({
  listChannels: vi.fn(),
  updateChannel: vi.fn(),
  getGroups: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    channels: { list: listChannels, update: updateChannel },
    groups: { getAll: getGroups },
    settings: { getWebSearchEmulationConfig: vi.fn().mockResolvedValue({ enabled: false }) },
  },
}))

vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showSuccess, showError }) }))
vi.mock('vue-i18n', async () => ({
  ...await vi.importActual<typeof import('vue-i18n')>('vue-i18n'),
  useI18n: () => ({ t: (key: string) => key }),
}))

// Keep this a view/form round-trip test: component-level price editing is covered
// separately, while both channels and account-stat cards must reach the API.
const PricingEntryCardStub = defineComponent({
  props: ['entry'],
  template: '<div class="pricing-entry">{{ entry.models.join(", ") }}</div>',
})

function interval(price: number | null): PricingInterval {
  return {
    min_tokens: 0, max_tokens: null, tier_label: '',
    input_price: 3e-6, output_price: 15e-6,
    cache_write_price: 3.75e-6, cache_write_1h_price: 6e-6,
    cache_write_12h_price: price, cache_read_price: 0.3e-6,
    input_multiplier: null, output_multiplier: null,
    cache_write_multiplier: null, cache_read_multiplier: null,
    per_request_price: null, sort_order: 0,
  }
}

function pricing(model: string, price: number | null, tierPrice: number | null): ChannelModelPricing {
  return {
    platform: 'openai', models: [model], billing_mode: 'token',
    input_price: 3e-6, output_price: 15e-6,
    cache_write_price: 3.75e-6, cache_write_1h_price: 6e-6,
    cache_write_12h_price: price, cache_read_price: 0.3e-6,
    image_input_price: null, image_output_price: null, per_request_price: null,
    intervals: [interval(tierPrice)], time_pricing: null,
  }
}

function mountView() {
  return mount(ChannelsView, {
    global: {
      stubs: {
        AppLayout: defineComponent({ template: '<main><slot /></main>' }),
        TablePageLayout: defineComponent({ template: '<section><slot name="filters" /><slot name="table" /><slot name="pagination" /></section>' }),
        DataTable: defineComponent({
          props: ['data'],
          template: '<div><div v-for="row in data" :key="row.id"><slot name="cell-actions" :row="row" /></div></div>',
        }),
        BaseDialog: defineComponent({ props: ['show'], template: '<section v-if="show"><slot /><slot name="footer" /></section>' }),
        PricingEntryCard: PricingEntryCardStub,
        Pagination: true, ConfirmDialog: true, EmptyState: true,
        Select: true, Icon: true, PlatformIcon: true, Toggle: true,
      },
    },
  })
}

describe('ChannelsView 12h cache-write compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroups.mockResolvedValue([{ id: 42, name: 'OpenAI', platform: 'openai', rate_multiplier: 1 }])
    updateChannel.mockResolvedValue({})
  })

  it.each([
    { label: 'configured', main: 7.5e-6, mainTier: 12.5e-6, stats: 32.5e-6, statsTier: 52.5e-6 },
    { label: 'free', main: 0, mainTier: 0, stats: 0, statsTier: 0 },
    { label: 'inherited', main: null, mainTier: null, stats: null, statsTier: null },
  ])('preserves $label model and interval prices after an unrelated channel edit', async (prices) => {
    const channel: Channel = {
      id: 7, name: 'TTL prices', description: '', status: 'active',
      billing_model_source: 'requested', restrict_models: false, group_ids: [42],
      model_pricing: [pricing('channel-model', prices.main, prices.mainTier)],
      model_mapping: {}, apply_pricing_to_account_stats: true,
      account_stats_pricing_rules: [{
        name: 'Stats override', group_ids: [42], account_ids: [],
        pricing: [pricing('stats-model', prices.stats, prices.statsTier)],
      }],
      created_at: '2026-11-11T00:00:00Z', updated_at: '2026-11-11T00:00:00Z',
    }
    listChannels.mockResolvedValue({ items: [channel], total: 1 })
    const wrapper = mountView()
    await flushPromises()
    await wrapper.findAll('button').find(button => button.text() === 'common.edit')!.trigger('click')
    await flushPromises()

    const cards = wrapper.findAllComponents(PricingEntryCardStub)
    expect(cards).toHaveLength(2)
    const expectDisplay = (value: number | null, price: number | null) => {
      if (price === null) expect(value).toBeNull()
      else expect(value).toBeCloseTo(price * 1e6, 8)
    }
    for (const [index, price, tierPrice] of [
      [0, prices.main, prices.mainTier], [1, prices.stats, prices.statsTier],
    ] as const) {
      const entry = cards[index].props('entry')
      expectDisplay(entry.cache_write_12h_price, price)
      expectDisplay(entry.intervals[0].cache_write_12h_price, tierPrice)
    }

    await wrapper.get('#channel-form input').setValue('Renamed only')
    await wrapper.get('#channel-form').trigger('submit')
    await flushPromises()

    expect(showError).not.toHaveBeenCalled()
    expect(updateChannel).toHaveBeenCalledTimes(1)
    expect(updateChannel).toHaveBeenCalledWith(7, expect.objectContaining({
      name: 'Renamed only',
      model_pricing: [expect.objectContaining({
        cache_write_12h_price: prices.main,
        intervals: [expect.objectContaining({ cache_write_12h_price: prices.mainTier })],
      })],
      account_stats_pricing_rules: [expect.objectContaining({
        pricing: [expect.objectContaining({
          cache_write_12h_price: prices.stats,
          intervals: [expect.objectContaining({ cache_write_12h_price: prices.statsTier })],
        })],
      })],
    }))
    wrapper.unmount()
  })
})
