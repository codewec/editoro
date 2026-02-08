/**
 * Prepares main-header props and handlers for `Workspace.vue`.
 * Used by `app/composables/useEditoroWorkspaceBindings.ts`.
 */
import { unref } from 'vue'
import type { EditoroState } from '~/composables/workspace/types'

export function useEditoroMainHeaderBindings(state: EditoroState) {
  const mainHeaderProps = computed(() => ({
    showExpandSidebarButton: unref(state.ui.isSidebarCollapsed),
    headerBadges: state.view.headerBadges.value,
    canRenameOrDelete: state.view.canRenameOrDelete.value,
    isSaving: state.editor.isSaving.value,
    saveStatusColor: state.editor.saveStatusColor.value,
    saveStatusIcon: state.editor.saveStatusIcon.value,
    saveStatusHint: state.editor.saveStatusHint.value
  }))

  const mainHeaderHandlers = {
    expandSidebar: state.ui.expandSidebar,
    selectBadge: (path: string) => {
      if (!path) {
        return
      }

      void state.actions.openPath(path)
    },
    togglePin: (path: string) => {
      if (!path) {
        return
      }

      state.editor.togglePinnedFile(path)
    },
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
