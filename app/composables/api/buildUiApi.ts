/**
 * Builds the `ui` section of grouped editor API.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildUiApi(options: BuildEditoroApiOptions) {
  const { uiStore } = options.stores
  const { uiRefs } = options.refs

  return {
    sidebarWidth: uiRefs.sidebarWidth,
    minSidebarWidth: uiStore.minSidebarWidth,
    maxSidebarWidth: uiStore.maxSidebarWidth,
    createModalOpen: uiRefs.createModalOpen,
    createTargetType: uiRefs.createTargetType,
    createInputPath: uiRefs.createInputPath,
    renameModalOpen: uiRefs.renameModalOpen,
    renameInputName: uiRefs.renameInputName,
    deleteModalOpen: uiRefs.deleteModalOpen,
    onSidebarResizeStart: uiStore.onSidebarResizeStart
  }
}
