/**
 * Computes UI-facing derived data from raw tree/editor state.
 * Used by `app/composables/useEditoroContext.ts`.
 */
import type { Ref } from 'vue'
import type { CreateTargetType, DirectoryTreeNode, EditorPinnedBadge, SelectOption, Translator, TreeNode } from '~/types/editoro'
import { buildCreatePathPreview, getSelectedBaseDirectory } from '~/utils/editoro-create'
import { buildImageUrl, getFileExtension, isImagePath } from '~/utils/editoro-file'
import { findNodeByPath, getBaseName, getParentPath } from '~/utils/editoro-path'

type ViewModelOptions = {
  t: Translator
  selectedNode: Ref<TreeNode | undefined>
  treeItems: Ref<TreeNode[]>
  pinnedFilePaths: Ref<string[]>
  createTargetType: Ref<CreateTargetType>
  createInputPath: Ref<string>
}

export function useEditoroViewModel(options: ViewModelOptions) {
  const selectedFolder = computed<DirectoryTreeNode | undefined>(() => {
    return options.selectedNode.value?.type === 'directory' ? options.selectedNode.value : undefined
  })

  const browserItems = computed(() => selectedFolder.value ? (selectedFolder.value.children || []) : options.treeItems.value)
  const selectedFolderParentPath = computed(() => selectedFolder.value ? getParentPath(selectedFolder.value.path) : '')

  const canRenameOrDelete = computed(() => !!options.selectedNode.value?.path)

  const editorTitle = computed(() => {
    const node = options.selectedNode.value
    if (!node) {
      return options.t('main.root')
    }

    return node.type === 'file' ? node.label : node.path
  })

  const selectedPath = computed(() => options.selectedNode.value?.path || '')
  const selectedNodeType = computed(() => options.selectedNode.value?.type)

  const selectedIsImage = computed(() => {
    return options.selectedNode.value?.type === 'file' && isImagePath(options.selectedNode.value.path)
  })

  const selectedImageUrl = computed(() => {
    if (!selectedIsImage.value || !options.selectedNode.value || options.selectedNode.value.type !== 'file') {
      return ''
    }

    return buildImageUrl(options.selectedNode.value.path)
  })

  const selectedFileExtension = computed(() => {
    if (options.selectedNode.value?.type !== 'file') {
      return ''
    }

    return getFileExtension(options.selectedNode.value.path)
  })

  const headerBadges = computed<EditorPinnedBadge[]>(() => {
    const badges: EditorPinnedBadge[] = []
    const currentNode = options.selectedNode.value
    const currentPath = currentNode?.path || ''

    for (const path of options.pinnedFilePaths.value) {
      const node = findNodeByPath(options.treeItems.value, path)
      badges.push({
        key: `pinned:${path}`,
        path,
        label: node?.label || getBaseName(path) || path,
        isCurrent: currentPath === path,
        isPinned: true,
        canPin: true
      })
    }

    // Show non-pinned selected node as the right-most badge.
    if (currentNode && !options.pinnedFilePaths.value.includes(currentNode.path)) {
      badges.push({
        key: `current:${currentNode.path}`,
        path: currentNode.path,
        label: currentNode.type === 'directory'
          ? currentNode.path
          : (currentNode.label || getBaseName(currentNode.path) || currentNode.path),
        isCurrent: true,
        isPinned: false,
        canPin: true
      })
    } else if (!currentNode) {
      badges.push({
        key: 'root',
        path: '',
        label: options.t('main.root'),
        isCurrent: true,
        isPinned: false,
        canPin: false
      })
    }

    return badges
  })

  const createTitle = computed(() => options.createTargetType.value === 'file'
    ? options.t('titles.createFile')
    : options.t('titles.createFolder'))

  const createButtonLabel = computed(() => options.createTargetType.value === 'file'
    ? options.t('titles.createFile')
    : options.t('titles.createFolder'))

  const createInputLabel = computed(() => options.createTargetType.value === 'file'
    ? options.t('titles.createFileLabel')
    : options.t('titles.createFolderLabel'))

  const selectedBaseDirectory = computed(() => getSelectedBaseDirectory(options.selectedNode.value))
  const createPathPreview = computed(() => buildCreatePathPreview(options.createInputPath.value, selectedBaseDirectory.value, options.t))

  const renameTitle = computed(() => options.selectedNode.value?.type === 'directory'
    ? options.t('titles.renameFolder')
    : options.t('titles.renameFile'))

  const deleteTitle = computed(() => options.selectedNode.value?.type === 'directory'
    ? options.t('titles.deleteFolder')
    : options.t('titles.deleteFile'))

  const localeOptions = computed<SelectOption[]>(() => [
    { label: options.t('settings.ru'), value: 'ru' },
    { label: options.t('settings.en'), value: 'en' }
  ])

  const colorModeOptions = computed<SelectOption[]>(() => [
    { label: options.t('settings.system'), value: 'system' },
    { label: options.t('settings.light'), value: 'light' },
    { label: options.t('settings.dark'), value: 'dark' }
  ])

  return {
    selectedFolder,
    browserItems,
    selectedFolderParentPath,
    canRenameOrDelete,
    editorTitle,
    selectedPath,
    selectedNodeType,
    selectedIsImage,
    selectedImageUrl,
    selectedFileExtension,
    headerBadges,
    createTitle,
    createButtonLabel,
    createInputLabel,
    selectedBaseDirectory,
    createPathPreview,
    renameTitle,
    deleteTitle,
    localeOptions,
    colorModeOptions
  }
}
