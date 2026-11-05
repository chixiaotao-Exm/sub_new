import { createI18n } from 'vue-i18n'
import { baseCompile } from '@intlify/message-compiler'
import en from '@/i18n/locales/en'
import zh from '@/i18n/locales/zh'

/** Install the same catalogs as the app; do not stub translated dialog labels. */
export function createDialogI18n(locale: 'en' | 'zh' = 'en') {
  return createI18n({
    legacy: false, locale, fallbackLocale: 'en', messages: { en, zh },
    // Vitest resolves the runtime-only i18n bundle; compile real local messages
    // with the official compiler instead of stubbing t() or its output.
    messageCompiler: (message, context) => {
      if (typeof message !== 'string') throw new TypeError('Expected source message')
      const result = baseCompile(message, { mode: 'arrow', onError: context.onError })
      return new Function(`return (${result.code})`)()
    },
  })
}
