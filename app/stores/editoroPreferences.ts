/**
 * Store for persisted user preferences (language, color mode, hidden files).
 * Used by `app/composables/useEditoroStores.ts`.
 */
import type { ColorModePreference } from '~/types/editoro'

const ALLOWED_COLOR_MODES: ColorModePreference[] = ['light', 'dark', 'system']
const SUPPORTED_LOCALES = ['ru', 'en'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export const useEditoroPreferencesStore = defineStore('editoro-preferences', () => {
  const { locale, setLocale } = useI18n()
  const colorMode = useColorMode()

  const showHiddenEntriesCookie = useCookie<string>('editoro.show-hidden', { path: '/', sameSite: 'lax' })
  const localeCookie = useCookie<string>('editoro.locale', { path: '/', sameSite: 'lax' })
  const colorModeCookie = useCookie<string>('editoro.color-mode', { path: '/', sameSite: 'lax' })

  const showHiddenEntries = ref(showHiddenEntriesCookie.value === '1')
  const settingsModalOpen = ref(false)
  const settingsLocale = ref<SupportedLocale>(locale.value as SupportedLocale)
  const settingsColorMode = ref<ColorModePreference>('system')

  function initialize() {
    if (localeCookie.value && localeCookie.value !== locale.value && isSupportedLocale(localeCookie.value)) {
      settingsLocale.value = localeCookie.value
      void setLocale(localeCookie.value)
    } else if (!localeCookie.value) {
      localeCookie.value = locale.value
    }

    const initialColorMode = colorModeCookie.value as ColorModePreference | undefined
    if (initialColorMode && ALLOWED_COLOR_MODES.includes(initialColorMode)) {
      colorMode.preference = initialColorMode
      settingsColorMode.value = initialColorMode
    } else {
      settingsColorMode.value = (colorMode.preference as ColorModePreference) || 'system'
      colorModeCookie.value = settingsColorMode.value
    }

    settingsLocale.value = locale.value
  }

  function toggleShowHiddenEntries() {
    showHiddenEntries.value = !showHiddenEntries.value
  }

  function setShowHiddenEntries(nextValue: boolean) {
    showHiddenEntries.value = !!nextValue
  }

  function openSettingsModal() {
    settingsLocale.value = locale.value
    settingsColorMode.value = (colorMode.preference as ColorModePreference) || 'system'
    settingsModalOpen.value = true
  }

  function closeSettingsModal() {
    settingsModalOpen.value = false
  }

  async function setLocalePreference(nextLocale: string) {
    if (!isSupportedLocale(nextLocale)) {
      return
    }

    settingsLocale.value = nextLocale
    await setLocale(nextLocale)
    localeCookie.value = nextLocale
  }

  function setColorModePreference(nextPreference: string) {
    const value = ALLOWED_COLOR_MODES.includes(nextPreference as ColorModePreference)
      ? (nextPreference as ColorModePreference)
      : 'system'

    settingsColorMode.value = value
    colorMode.preference = value
    colorModeCookie.value = value
  }

  watch(showHiddenEntries, (value) => {
    showHiddenEntriesCookie.value = value ? '1' : '0'
  })

  watch(locale, (value) => {
    if (!isSupportedLocale(value)) {
      return
    }

    settingsLocale.value = value
    localeCookie.value = value
  })

  return {
    showHiddenEntries,
    settingsModalOpen,
    settingsLocale,
    settingsColorMode,
    initialize,
    toggleShowHiddenEntries,
    setShowHiddenEntries,
    openSettingsModal,
    closeSettingsModal,
    setLocalePreference,
    setColorModePreference
  }
})
