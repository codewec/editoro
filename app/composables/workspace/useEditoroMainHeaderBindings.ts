/**
 * Prepares main-header props and handlers for `Workspace.vue`.
 * Used by `app/composables/useEditoroWorkspaceBindings.ts`.
 */
import type { EditoroState } from '~/composables/workspace/types'

export function useEditoroMainHeaderBindings(state: EditoroState) {
  const mainHeaderProps = computed(() => ({
    editorTitle: state.view.editorTitle.value,
    editorModeLabel: state.editor.modeLabel.value,
    editorModeIcon: state.editor.modeIcon.value,
    editorModeTooltip: state.editor.modeTooltip.value,
    canRenameOrDelete: state.view.canRenameOrDelete.value,
    isSaving: state.editor.isSaving.value,
    saveStatusColor: state.editor.saveStatusColor.value,
    saveStatusIcon: state.editor.saveStatusIcon.value,
    saveStatusHint: state.editor.saveStatusHint.value
  }))

  const mainHeaderHandlers = {
    toggleMode: state.editor.toggleMode,
    rename: state.actions.openRenameModal,
    remove: () => {
      state.ui.deleteModalOpen.value = true
    }
  }

  return {
    mainHeaderProps,
    mainHeaderHandlers
  }
}
