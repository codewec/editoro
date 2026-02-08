/**
 * Builds the `view` section with derived, UI-friendly computed values.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildViewApi(options: BuildEditoroApiOptions) {
  const { viewModel } = options

  return {
    selectedFolder: viewModel.selectedFolder,
    browserItems: viewModel.browserItems,
    selectedFolderParentPath: viewModel.selectedFolderParentPath,
    selectedNodeType: viewModel.selectedNodeType,
    selectedIsImage: viewModel.selectedIsImage,
    selectedImageUrl: viewModel.selectedImageUrl,
    selectedFileExtension: viewModel.selectedFileExtension,
    canRenameOrDelete: viewModel.canRenameOrDelete,
    editorTitle: viewModel.editorTitle,
    selectedPath: viewModel.selectedPath,
    createTitle: viewModel.createTitle,
    createButtonLabel: viewModel.createButtonLabel,
    createInputLabel: viewModel.createInputLabel,
    createPathPreview: viewModel.createPathPreview,
    renameTitle: viewModel.renameTitle,
    deleteTitle: viewModel.deleteTitle
  }
}
