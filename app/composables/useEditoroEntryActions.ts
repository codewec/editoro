/**
 * Encapsulates create/rename/delete operations for tree entries.
 * Used by `app/composables/useEditoroContext.ts`.
 */
import type { ComputedRef, Ref } from 'vue'
import type { CreateTargetType, TreeNode } from '~/types/editoro'
import { createEntryApi, deleteEntryApi } from '~/services/files-api'
import { getFileExtension, isMarkdownPath } from '~/utils/editoro-file'
import { normalizeCreatePathInput } from '~/utils/editoro-create'
import { buildPath, findNodeByPath, getParentPath } from '~/utils/editoro-path'

type ToastError = (title: string, description?: string) => void

type UiActionsLike = {
  closeCreateModal: () => void
  openRenameModal: (value: string) => void
  closeRenameModal: () => void
  closeDeleteModal: () => void
}

type EntryActionOptions = {
  t: (key: string, params?: Record<string, unknown>) => string
  notifyError: ToastError
  selectedNode: Ref<TreeNode | undefined>
  treeItems: Ref<TreeNode[]>
  createInputPath: Ref<string>
  renameInputName: Ref<string>
  selectedBaseDirectory: ComputedRef<string>
  loadTree: (preferPath?: string) => Promise<void>
  moveEntry: (from: string, to: string) => Promise<string>
  uiActions: UiActionsLike
}

export function useEditoroEntryActions(options: EntryActionOptions) {
  async function createEntry(type: CreateTargetType) {
    const { trimmed, forceRoot, name } = normalizeCreatePathInput(options.createInputPath.value)

    if (!trimmed) {
      options.notifyError(options.t('errors.specifyFileOrFolder'))
      return
    }

    if (!name) {
      options.notifyError(options.t('errors.emptyName'))
      return
    }

    const nextPath = forceRoot ? name : buildPath(options.selectedBaseDirectory.value, name)

    try {
      const result = await createEntryApi(type, nextPath)

      await options.loadTree(result.path)

      if (type === 'file') {
        const fileNode = findNodeByPath(options.treeItems.value, result.path)
        if (fileNode) {
          options.selectedNode.value = fileNode
        }
      }

      options.uiActions.closeCreateModal()
      options.createInputPath.value = ''
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.createEntry'))
    }
  }

  function openRenameModal() {
    const node = options.selectedNode.value
    if (!node) {
      return
    }

    const initialName = node.type === 'file'
      ? node.label.replace(/\.md$/i, '')
      : node.label

    options.uiActions.openRenameModal(initialName)
  }

  async function renameSelectedEntry() {
    const node = options.selectedNode.value
    const rawName = options.renameInputName.value.trim()

    if (!node || !rawName) {
      options.notifyError(options.t('errors.specifyName'))
      return
    }

    let nextName = rawName

    if (node.type === 'file' && isMarkdownPath(node.path)) {
      const base = rawName.replace(/(\.md)+$/i, '')

      if (!base) {
        options.notifyError(options.t('errors.emptyFileName'))
        return
      }

      nextName = `${base}.md`
    } else if (node.type === 'file') {
      const hasExtension = rawName.includes('.') && !rawName.endsWith('.')
      if (!hasExtension) {
        const currentExt = getFileExtension(node.path)
        nextName = currentExt ? `${rawName}.${currentExt}` : rawName
      }
    }

    const targetPath = buildPath(getParentPath(node.path), nextName)

    try {
      const movedPath = await options.moveEntry(node.path, targetPath)

      await options.loadTree(movedPath)
      options.uiActions.closeRenameModal()
      options.renameInputName.value = ''
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.rename'))
    }
  }

  async function deleteSelectedEntry() {
    const node = options.selectedNode.value
    if (!node) {
      return
    }

    try {
      await deleteEntryApi(node.path)
      options.uiActions.closeDeleteModal()
      await options.loadTree()
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.delete'))
    }
  }

  return {
    createEntry,
    openRenameModal,
    renameSelectedEntry,
    deleteSelectedEntry
  }
}
