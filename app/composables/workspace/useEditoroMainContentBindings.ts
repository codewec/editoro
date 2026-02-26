/**
 * Prepares main-content props and handlers for `Workspace.vue`.
 * Used by `app/composables/useEditoroWorkspaceBindings.ts`.
 */
import type { WorkspaceBindingOptions } from '~/composables/workspace/types'

export function useEditoroMainContentBindings(options: WorkspaceBindingOptions) {
  const { state } = options

  const mainContentProps = computed(() => ({
    isLoadingTree: state.tree.isLoading.value,
    isLoadingFile: state.editor.isLoading.value,
    selectedNodeType: state.view.selectedNodeType.value,
    selectedPath: state.view.selectedPath.value,
    selectedFolder: state.view.selectedFolder.value,
    selectedFolderParentPath: state.view.selectedFolderParentPath.value,
    browserItems: state.view.browserItems.value,
    selectedIsImage: state.view.selectedIsImage.value,
    selectedImageUrl: state.view.selectedImageUrl.value,
    selectedFileExtension: state.view.selectedFileExtension.value,
    editorViewMode: state.editor.viewMode.value,
    editorContent: state.editor.content.value,
    canUploadImage: !!state.editor.activeFilePath.value,
    uploadImage: state.editor.uploadImage,
    uploadFile: state.editor.uploadFile,
    editorToolbarItems: options.editorToolbarItems.value,
    editorSuggestionItems: options.editorSuggestionItems.value
  }))

  const mainContentHandlers = {
    toggleMode: state.editor.toggleMode,
    updateEditorContent: (value: string) => {
      state.editor.content.value = value
    },
    selectPath: state.tree.selectNodeByPath,
    goParent: state.tree.goToFolderParent
  }

  return {
    mainContentProps,
    mainContentHandlers
  }
}
