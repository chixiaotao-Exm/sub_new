import { computed, onMounted, onUnmounted, ref } from 'vue'

/** Canvas charts do not inherit CSS colors, so provide an explicit theme palette. */
export function chartPalette(dark: boolean) {
  const series = dark
    ? ['#DDA0B5', '#B3A1C1', '#A6ADB8', '#D0B0A0', '#A49BA8', '#C58EA2', '#A996BC', '#BBA5AE', '#8F8796', '#C59AA7', '#AAA2AD', '#D5C3CD']
    : ['#B45576', '#8A718B', '#687588', '#A98270', '#827581', '#BE7890', '#76608C', '#A2888D', '#665C69', '#9C6D7C', '#8F8A90', '#A793A3']
  return {
    series,
    text: dark ? '#D6CFD4' : '#59515A',
    muted: dark ? '#A69EA6' : '#77717A',
    grid: dark ? '#373238' : '#ECE7EB',
    surface: dark ? '#202023' : '#FFFCFD',
    input: series[0],
    output: series[1],
    cacheCreation: dark ? '#A6ADB8' : '#787A84',
    cacheRead: dark ? '#CFB0A0' : '#9B7865',
    cacheHitRate: dark ? '#C2ADCE' : '#745980',
    other: dark ? '#8F8992' : '#9A929C',
    warning: dark ? '#D2B28A' : '#A08057',
    error: dark ? '#D5949E' : '#AD5966',
  }
}

/** Observe the actual root class so graphs update immediately on the theme switch. */
export function useChartTheme() {
  const readDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const isDark = ref(readDark())
  let observer: MutationObserver | undefined
  onMounted(() => {
    isDark.value = readDark()
    observer = new MutationObserver(() => { isDark.value = readDark() })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })
  onUnmounted(() => observer?.disconnect())
  return { isDark, colors: computed(() => chartPalette(isDark.value)) }
}
