import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseDialog from '../BaseDialog.vue'
import { createDialogI18n } from './dialogTestI18n'

enableAutoUnmount(afterEach)

function openDialog(title: string) {
  return mount(BaseDialog, { props: { show: true, title }, global: { plugins: [createDialogI18n()], stubs: { Icon: true } } })
}

describe('dialog accessible titles', () => {
  it.each([['en', 'Close'], ['zh', '关闭']] as const)('uses the actual %s catalog for the close control', (locale, label) => {
    mount(BaseDialog, { props: { show: true, title: 'Details' }, global: { plugins: [createDialogI18n(locale)], stubs: { Icon: true } } })
    expect(document.body.querySelector('button')?.getAttribute('aria-label')).toBe(label)
  })
  it('associates simultaneous dialogs with their own title', async () => {
    openDialog('Edit account')
    openDialog('Confirm deletion')
    await nextTick()
    const dialogs = Array.from(document.body.querySelectorAll('[role="dialog"]'))
    expect(dialogs).toHaveLength(2)
    const titles = dialogs.map(dialog => document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent)
    expect(titles).toEqual(['Edit account', 'Confirm deletion'])
  })

  it('keeps the title association stable when a dialog is reopened', async () => {
    const wrapper = openDialog('Details')
    await nextTick()
    const id = document.body.querySelector('[role="dialog"]')!.getAttribute('aria-labelledby')!
    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true, title: 'Updated details' })
    expect(document.body.querySelector('[role="dialog"]')!.getAttribute('aria-labelledby')).toBe(id)
    expect(document.getElementById(id)?.textContent).toBe('Updated details')
  })
})
