/**
 * Builds the `settings` section of grouped editor API.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildSettingsApi(options: BuildEditoroApiOptions) {
  const { preferencesStore } = options.stores
  const { preferencesRefs } = options.refs

  return {
    showHiddenEntries: preferencesRefs.showHiddenEntries,
    modalOpen: preferencesRefs.settingsModalOpen,
    locale: preferencesRefs.settingsLocale,
    colorMode: preferencesRefs.settingsColorMode,
    localeOptions: options.viewModel.localeOptions,
    colorModeOptions: options.viewModel.colorModeOptions,
    toggleShowHiddenEntries: options.actions.toggleShowHiddenEntries,
    openModal: preferencesStore.openSettingsModal,
    closeModal: preferencesStore.closeSettingsModal,
    setLocale: preferencesStore.setLocalePreference,
    setColorMode: preferencesStore.setColorModePreference
  }
}
