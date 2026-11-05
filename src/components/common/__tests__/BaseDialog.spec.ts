import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseDialog from '../BaseDialog.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}))

describe('BaseDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.classList.remove('modal-open')
  })

  it('traps forward and backward Tab focus inside the active dialog', async () => {
    const wrapper = mount(BaseDialog, {
      attachTo: document.body,
      props: { show: true, title: 'Edit', showCloseButton: false },
      slots: { default: '<input id="first" /><button disabled>Disabled</button><button id="last">Save</button>' },
      global: { stubs: { Icon: true } },
    })
    await nextTick()
    const first = document.getElementById('first')!
    const last = document.getElementById('last')!
    last.focus()
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.dispatchEvent(forward)
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
    wrapper.unmount()
  })

  it('focuses the panel for a dialog without actionable controls', async () => {
    const wrapper = mount(BaseDialog, {
      attachTo: document.body,
      props: { show: true, title: 'Details', showCloseButton: false },
      slots: { default: '<input disabled /><div hidden><button>Hidden</button></div>' },
      global: { stubs: { Icon: true } },
    })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(document.querySelector('.modal-content'))
    wrapper.unmount()
  })

  it('closes only the top dialog with Escape and keeps the remaining scroll lock', async () => {
    const options = { attachTo: document.body, props: { show: true, title: 'Dialog' }, global: { stubs: { Icon: true } } }
    const first = mount(BaseDialog, options)
    const second = mount(BaseDialog, options)
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(second.emitted('close')).toHaveLength(1)
    expect(first.emitted('close')).toBeUndefined()
    second.unmount()
    expect(document.body.classList.contains('modal-open')).toBe(true)
    first.unmount()
    expect(document.body.classList.contains('modal-open')).toBe(false)
  })

  it('resets body scroll position when reopened', async () => {
    const wrapper = mount(BaseDialog, {
      attachTo: document.body,
      props: { show: false, title: 'Details' },
      slots: { default: '<div style="height: 2000px">content</div>' },
      global: { stubs: { Icon: true } }
    })

    await wrapper.setProps({ show: true })
    await nextTick()
    const body = document.body.querySelector<HTMLElement>('.modal-body')
    expect(body).not.toBeNull()
    body!.scrollTop = 480

    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true })
    await nextTick()

    expect(document.body.querySelector<HTMLElement>('.modal-body')?.scrollTop).toBe(0)
    wrapper.unmount()
  })
})
