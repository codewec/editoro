/**
 * Prepares modal props and handlers for `Workspace.vue`.
 * Used by `app/composables/useEditoroWorkspaceBindings.ts`.
 */
import type { EditoroState } from '~/composables/workspace/types'

export function useEditoroModalsBindings(state: EditoroState) {
  const modalsProps = computed(() => ({
    createModalOpen: state.ui.createModalOpen.value,
    createTitle: state.view.createTitle.value,
    createInputLabel: state.view.createInputLabel.value,
    createInputPath: state.ui.createInputPath.value,
    createButtonLabel: state.view.createButtonLabel.value,
    createPathPreview: state.view.createPathPreview.value,
    createTargetType: state.ui.createTargetType.value,
    renameModalOpen: state.ui.renameModalOpen.value,
    renameTitle: state.view.renameTitle.value,
    renameInputName: state.ui.renameInputName.value,
    deleteModalOpen: state.ui.deleteModalOpen.value,
    deleteTitle: state.view.deleteTitle.value,
    selectedPath: state.view.selectedPath.value
  }))

  const modalsHandlers = {
    updateCreateModalOpen: (value: boolean) => {
      state.ui.createModalOpen.value = value
    },
    updateCreateInputPath: (value: string) => {
      state.ui.createInputPath.value = value
    },
    create: state.actions.createEntry,
    updateRenameModalOpen: (value: boolean) => {
      state.ui.renameModalOpen.value = value
    },
    updateRenameInputName: (value: string) => {
      state.ui.renameInputName.value = value
    },
    rename: state.actions.renameSelectedEntry,
    updateDeleteModalOpen: (value: boolean) => {
      state.ui.deleteModalOpen.value = value
    },
    remove: state.actions.deleteSelectedEntry
  }

  return {
    modalsProps,
    modalsHandlers
  }
}
