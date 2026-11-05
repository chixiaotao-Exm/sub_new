import {afterEach, describe, expect, it} from 'vitest'
import {mount} from '@vue/test-utils'
import {defineComponent, nextTick} from 'vue'
import {chartPalette, useChartTheme} from '../useChartTheme'

afterEach(() => { document.documentElement.classList.remove('dark') })

describe('chart theme', () => {
  it('updates mounted graph colors after a black/white theme change', async () => {
    document.documentElement.classList.remove('dark')
    const wrapper=mount(defineComponent({
      setup() { return useChartTheme() },
      template:'<span>{{ colors.input }}|{{ colors.grid }}|{{ colors.text }}</span>',
    }))
    expect(wrapper.text()).toBe('#B45576|#ECE7EB|#59515A')
    document.documentElement.classList.add('dark')
    await new Promise(resolve=>setTimeout(resolve,0));await nextTick()
    expect(wrapper.text()).toBe('#DDA0B5|#373238|#D6CFD4')
    document.documentElement.classList.remove('dark')
    await new Promise(resolve=>setTimeout(resolve,0));await nextTick()
    expect(wrapper.text()).toBe('#B45576|#ECE7EB|#59515A')
    wrapper.unmount()
  })

  it('keeps rose, mauve and neutral series distinct without green or cyan', () => {
    for(const dark of [false,true]) {
      const palette=chartPalette(dark)
      expect(new Set(palette.series).size).toBe(palette.series.length)
      for(const color of [...palette.series,palette.input,palette.output,palette.cacheRead,palette.cacheHitRate]) {
        const [r,g,b]=[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16))
        // Every selected hue is red/mauve or neutral; none has a green dominant channel.
        expect(g).toBeLessThanOrEqual(Math.max(r,b))
      }
    }
  })
})
