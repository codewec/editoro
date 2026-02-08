/**
 * Builds the `actions` section of grouped editor API.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildActionsApi(options: BuildEditoroApiOptions) {
  const { uiStore } = options.stores
  const { entryActions } = options

  return {
    openCreateModal: uiStore.openCreateModal,
    openPath: options.actions.openPath,
    createEntry: entryActions.createEntry,
    openRenameModal: entryActions.openRenameModal,
    renameSelectedEntry: entryActions.renameSelectedEntry,
    deleteSelectedEntry: entryActions.deleteSelectedEntry
  }
}
