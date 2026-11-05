<template>
  <div role="alert" class="space-y-4 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-900/10" data-testid="oauth-callback-error">
    <p class="break-words text-sm text-red-700 dark:text-red-300">{{ message }}</p>
    <RouterLink to="/login" class="btn btn-primary w-full">{{ t('auth.backToLogin') }}</RouterLink>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{ message: string }>()
const { t } = useI18n()
</script>
