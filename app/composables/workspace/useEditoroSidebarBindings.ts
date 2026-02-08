/**
 * Prepares sidebar props and handlers for `Workspace.vue`.
 * Used by `app/composables/useEditoroWorkspaceBindings.ts`.
 */
import type { EditoroState } from '~/composables/workspace/types'

export function useEditoroSidebarBindings(state: EditoroState) {
  const sidebarProps = computed(() => ({
    width: state.ui.sidebarWidth.value,
    minWidth: state.ui.minSidebarWidth,
    maxWidth: state.ui.maxSidebarWidth,
    isLoadingTree: state.tree.isLoading.value,
    showHiddenEntries: state.settings.showHiddenEntries.value,
    settingsModalOpen: state.settings.modalOpen.value,
    settingsLocale: state.settings.locale.value,
    settingsColorMode: state.settings.colorMode.value,
    localeOptions: state.settings.localeOptions.value,
    colorModeOptions: state.settings.colorModeOptions.value,
    draggingPath: state.tree.draggingPath.value,
    dragOverTargetPath: state.tree.dragOverTargetPath.value,
    treeItems: state.tree.items.value
  }))

  const sidebarHandlers = {
    create: state.actions.openCreateModal,
    refresh: state.tree.refresh,
    toggleHidden: state.settings.toggleShowHiddenEntries,
    openSettings: state.settings.openModal,
    closeSettings: state.settings.closeModal,
    changeLocale: state.settings.setLocale,
    changeColorMode: state.settings.setColorMode,
    sidebarResizeStart: state.ui.onSidebarResizeStart,
    rootDrop: state.tree.onRootDrop,
    treeDragStart: state.tree.onDragStart,
    treeDragEnd: state.tree.onDragEnd,
    treeDragOver: state.tree.onDragOver,
    treeDrop: state.tree.onDrop,
    // Explicit reset avoids stale highlight after leaving a potential drop target.
    treeDragLeave: () => {
      state.tree.dragOverTargetPath.value = ''
    }
  }

  return {
    sidebarProps,
    sidebarHandlers
  }
}
