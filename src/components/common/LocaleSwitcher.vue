<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      :disabled="switching"
      :aria-busy="switching"
      class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
      :title="currentLocale?.name"
      :aria-label="currentLocale?.name"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @keydown.esc="closeDropdown"
      @keydown.down.prevent="openAndFocus"
    >
      <Icon name="globe" size="sm" />
      <span class="hidden sm:inline">{{ currentLocale?.code.toUpperCase() }}</span>
      <Icon
        name="chevronDown"
        size="xs"
        class="text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-1 w-56 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-dark-700 dark:bg-dark-800"
        @keydown.esc.stop.prevent="closeDropdown"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
      >
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          :disabled="switching"
          :aria-current="locale.code === currentLocaleCode ? 'true' : undefined"
          @click="selectLocale(locale.code)"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-700"
          :class="{
            'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400':
              locale.code === currentLocaleCode
          }"
        >
          <span class="text-left">{{ locale.name }}</span>
          <span class="ml-auto text-xs font-mono text-gray-400">{{ locale.code.toUpperCase() }}</span>
          <Icon v-if="locale.code === currentLocaleCode" name="check" size="sm" class="text-primary-500" />
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { setLocale, availableLocales } from '@/i18n'

const { locale } = useI18n()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const switching = ref(false)

const currentLocaleCode = computed(() => locale.value)
const currentLocale = computed(() => availableLocales.find((l) => l.code === locale.value))

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
  dropdownRef.value?.querySelector('button')?.focus()
}

async function openAndFocus() {
  isOpen.value = true
  await nextTick()
  const buttons = dropdownRef.value?.querySelectorAll<HTMLButtonElement>('button')
  buttons?.[1]?.focus()
}

function moveFocus(direction: number) {
  const buttons = Array.from(dropdownRef.value?.querySelectorAll<HTMLButtonElement>('button') || []).slice(1)
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
  buttons[(index + direction + buttons.length) % buttons.length]?.focus()
}

async function selectLocale(code: string) {
  if (switching.value || code === currentLocaleCode.value) {
    isOpen.value = false
    return
  }
  switching.value = true
  try {
    await setLocale(code)
    isOpen.value = false
    // 分组名称等内容由后端按请求语言返回，整页刷新让已加载的数据换成新语言
    window.location.reload()
  } finally {
    switching.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
