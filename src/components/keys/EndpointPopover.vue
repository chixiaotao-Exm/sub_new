<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import type { CustomEndpoint } from '@/types'

const props = defineProps<{
  apiBaseUrl: string
  customEndpoints: CustomEndpoint[]
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const copiedEndpoint = ref<string | null>(null)

let copiedResetTimer: number | undefined

const allEndpoints = computed(() => {
  const items: Array<{ name: string; endpoint: string; description: string; isDefault: boolean }> = []
  if (props.apiBaseUrl) {
    items.push({
      name: t('keys.endpoints.title'),
      endpoint: props.apiBaseUrl,
      description: '',
      isDefault: true,
    })
  }
  for (const ep of props.customEndpoints) {
    items.push({ ...ep, isDefault: false })
  }
  return items
})

async function copy(url: string) {
  const success = await copyToClipboard(url, t('keys.endpoints.copied'))
  if (!success) return

  copiedEndpoint.value = url
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
  copiedResetTimer = window.setTimeout(() => {
    if (copiedEndpoint.value === url) {
      copiedEndpoint.value = null
    }
  }, 1800)
}

function tooltipHint(endpoint: string): string {
  return copiedEndpoint.value === endpoint
    ? t('keys.endpoints.copiedHint')
    : t('keys.endpoints.clickToCopy')
}

function speedTestUrl(endpoint: string): string {
  return `https://www.tcptest.cn/http/${encodeURIComponent(endpoint)}`
}

onBeforeUnmount(() => {
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
})
</script>

<template>
  <section v-if="allEndpoints.length > 0" class="endpoint-panel" :aria-label="t('keys.endpoints.title')">
    <h2 class="endpoint-title">{{ t('keys.endpoints.title') }}</h2>
    <div v-for="(item, index) in allEndpoints" :key="index" class="endpoint-row">
      <div class="endpoint-content">
        <div class="endpoint-label">
          <span>{{ item.isDefault ? 'Base URL' : item.name }}</span>
          <span v-if="item.isDefault" class="endpoint-badge">{{ t('keys.endpoints.default') }}</span>
        </div>
        <code
          class="endpoint-url"
          role="button"
          tabindex="0"
          :aria-label="tooltipHint(item.endpoint) + ': ' + item.endpoint"
          @click="copy(item.endpoint)"
          @keydown.enter.prevent="copy(item.endpoint)"
          @keydown.space.prevent="copy(item.endpoint)"
        >{{ item.endpoint }}</code>
        <p v-if="item.description" class="endpoint-description">{{ item.description }}</p>
        <p class="endpoint-hint" aria-live="polite">{{ tooltipHint(item.endpoint) }}</p>
      </div>
      <div class="endpoint-actions">
        <button type="button" class="btn btn-secondary" :aria-label="tooltipHint(item.endpoint)" @click="copy(item.endpoint)">
          <svg v-if="copiedEndpoint === item.endpoint" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m5 13 4 4L19 7" /></svg>
          <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          {{ copiedEndpoint === item.endpoint ? t('keys.endpoints.copied') : t('common.copy') }}
        </button>
        <a :href="speedTestUrl(item.endpoint)" target="_blank" rel="noopener noreferrer" class="endpoint-test">{{ t('keys.endpoints.speedTest') }} ↗</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.endpoint-panel { padding: 20px 22px; border: 1px solid rgb(229 231 235); border-radius: 12px; background: white; }
.endpoint-title { margin: 0 0 14px; font-size: 17px; line-height: 1.5; font-weight: 600; }
.endpoint-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 15px 18px; border: 1px solid rgb(229 231 235); border-radius: 10px; background: rgb(249 250 251); }
.endpoint-row + .endpoint-row { margin-top: 10px; }
.endpoint-content { min-width: 0; }
.endpoint-label { display: flex; align-items: center; gap: 8px; color: rgb(107 114 128); font-size: 12px; margin-bottom: 6px; }
.endpoint-badge { border-radius: 4px; padding: 1px 5px; background: rgb(20 184 166 / .12); color: rgb(15 118 110); }
.endpoint-url { display: inline-block; font-size: 16px; line-height: 1.6; color: rgb(15 118 110); cursor: pointer; overflow-wrap: anywhere; }
.endpoint-url:focus-visible { outline: 2px solid rgb(20 184 166); outline-offset: 4px; border-radius: 3px; }
.endpoint-description, .endpoint-hint { margin: 5px 0 0; font-size: 12px; color: rgb(107 114 128); line-height: 1.6; }
.endpoint-actions { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.endpoint-test { color: rgb(107 114 128); font-size: 12px; white-space: nowrap; }
.dark .endpoint-panel { background: #161616; border-color: rgb(255 255 255 / .1); }
.dark .endpoint-row { background: rgb(110 231 183 / .035); border-color: rgb(255 255 255 / .09); }
.dark .endpoint-url, .dark .endpoint-badge { color: #6ee7b7; }
.dark .endpoint-label, .dark .endpoint-description, .dark .endpoint-hint, .dark .endpoint-test { color: #a3a3a3; }
@media (max-width: 640px) { .endpoint-panel { padding: 16px; } .endpoint-row { flex-direction: column; align-items: stretch; gap: 12px; padding: 14px; } .endpoint-actions { justify-content: space-between; } }
</style>

