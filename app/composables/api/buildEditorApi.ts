/**
 * Builds the `editor` section of grouped editor API.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildEditorApi(options: BuildEditoroApiOptions) {
  const { editorStore } = options.stores
  const { editorRefs } = options.refs

  return {
    activeFilePath: editorRefs.activeFilePath,
    content: editorRefs.editorContent,
    viewMode: editorRefs.editorViewMode,
    isLoading: editorRefs.isLoadingFile,
    isSaving: editorRefs.isSaving,
    saveStatusColor: editorRefs.saveStatusColor,
    saveStatusIcon: editorRefs.saveStatusIcon,
    saveStatusHint: editorRefs.saveStatusHint,
    modeLabel: editorRefs.editorModeLabel,
    modeIcon: editorRefs.editorModeIcon,
    modeTooltip: editorRefs.editorModeTooltip,
    pinnedFilePaths: editorRefs.pinnedFilePaths,
    uploadImage: editorStore.uploadImage,
    toggleMode: editorStore.toggleEditorMode,
    isPinned: editorStore.isPinned,
    pinFile: editorStore.pinFile,
    unpinFile: editorStore.unpinFile,
    togglePinnedFile: editorStore.togglePinnedFile,
    toggleCurrentFilePin: editorStore.toggleCurrentFilePin
  }
}
