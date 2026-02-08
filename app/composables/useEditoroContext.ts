/**
 * Builds internal editor context (stores, refs, view-model, actions).
 * Used by `app/composables/useEditoroState.ts`.
 */
import { useEditoroEntryActions } from '~/composables/useEditoroEntryActions'
import { useEditoroFileSelection } from '~/composables/useEditoroFileSelection'
import { useEditoroStores } from '~/composables/useEditoroStores'
import { useEditoroTreeActions } from '~/composables/useEditoroTreeActions'
import { useEditoroViewModel } from '~/composables/useEditoroViewModel'

export function useEditoroContext() {
  const toast = useToast()
  const { t } = useI18n()

  const { stores, refs } = useEditoroStores()
  const { preferencesStore, treeStore, editorStore, uiStore } = stores
  const { treeRefs, editorRefs, uiRefs } = refs

  const viewModel = useEditoroViewModel({
    t,
    selectedNode: treeRefs.selectedNode,
    treeItems: treeRefs.treeItems,
    pinnedFilePaths: editorRefs.pinnedFilePaths,
    createTargetType: uiRefs.createTargetType,
    createInputPath: uiRefs.createInputPath
  })

  function notifyError(title: string, description?: string) {
    toast.add({ title, description, color: 'error' })
  }

  async function loadTree(preferPath?: string) {
    await treeStore.loadTree(preferPath)
  }

  const treeActions = useEditoroTreeActions({
    selectedNode: treeRefs.selectedNode,
    loadTree,
    toggleShowHiddenEntriesRaw: preferencesStore.toggleShowHiddenEntries
  })

  const fileSelection = useEditoroFileSelection({
    selectedNode: treeRefs.selectedNode,
    activeFilePath: editorRefs.activeFilePath,
    pinnedFilePaths: editorRefs.pinnedFilePaths,
    showHiddenEntries: refs.preferencesRefs.showHiddenEntries,
    setShowHiddenEntries: preferencesStore.setShowHiddenEntries,
    treeInitialized: treeRefs.treeInitialized,
    editorStore,
    loadTree
  })

  const entryActions = useEditoroEntryActions({
    t,
    notifyError,
    selectedNode: treeRefs.selectedNode,
    treeItems: treeRefs.treeItems,
    createInputPath: uiRefs.createInputPath,
    renameInputName: uiRefs.renameInputName,
    selectedBaseDirectory: viewModel.selectedBaseDirectory,
    loadTree,
    uiActions: {
      closeCreateModal: uiStore.closeCreateModal,
      openRenameModal: uiStore.openRenameModal,
      closeRenameModal: uiStore.closeRenameModal,
      closeDeleteModal: uiStore.closeDeleteModal
    }
  })

  return {
    stores,
    refs,
    viewModel,
    fileSelection,
    entryActions,
    actions: {
      refreshTree: treeActions.refreshTree,
      toggleShowHiddenEntries: treeActions.toggleShowHiddenEntries,
      openPath: fileSelection.openPath
    }
  }
}
