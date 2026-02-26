/**
 * Handles drag-and-drop for tree nodes and performs move operations.
 * Used by `app/stores/editoroTree.ts`.
 */
import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { buildPath, findNodeByPath, getBaseName, getParentPath } from '~/utils/editoro-path'

type TreeDnDOptions = {
  treeItems: Ref<TreeNode[]>
  moveEntry: (from: string, to: string) => Promise<string>
  loadTree: (preferPath?: string) => Promise<void>
  notifyMoveError: () => void
}

export function useEditoroTreeDnD(options: TreeDnDOptions) {
  const draggingPath = ref('')
  const dragOverTargetPath = ref('')

  function onTreeDragStart(item: TreeNode, event: DragEvent) {
    draggingPath.value = item.path
    dragOverTargetPath.value = ''

    if (!event.dataTransfer) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.path)

    // Use custom drag preview so long labels remain readable while dragging.
    const preview = document.createElement('div')
    preview.className = 'editoro-drag-preview'
    preview.style.position = 'fixed'
    preview.style.top = '-9999px'
    preview.style.left = '-9999px'
    preview.style.padding = '8px 10px'
    preview.style.borderRadius = '8px'
    preview.style.border = '1px solid color-mix(in oklab, var(--ui-border-muted) 80%, transparent)'
    preview.style.background = 'var(--ui-bg-elevated)'
    preview.style.color = 'var(--ui-text)'
    preview.style.fontSize = '13px'
    preview.style.fontWeight = '500'
    preview.style.maxWidth = '280px'
    preview.style.whiteSpace = 'nowrap'
    preview.style.overflow = 'hidden'
    preview.style.textOverflow = 'ellipsis'
    preview.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)'
    preview.textContent = item.label

    document.body.appendChild(preview)
    event.dataTransfer.setDragImage(preview, 16, 16)
    requestAnimationFrame(() => preview.remove())
  }

  function onTreeDragEnd() {
    draggingPath.value = ''
    dragOverTargetPath.value = ''
  }

  function getDropDirectoryPath(item: TreeNode) {
    return item.type === 'directory' ? item.path : getParentPath(item.path)
  }

  function canDropToDirectory(sourceNode: TreeNode, targetDirectoryPath: string) {
    if (sourceNode.type === 'directory') {
      // Prevent moving a folder into itself or any of its descendants.
      if (targetDirectoryPath === sourceNode.path || targetDirectoryPath.startsWith(`${sourceNode.path}/`)) {
        return false
      }
    }

    return buildPath(targetDirectoryPath, getBaseName(sourceNode.path)) !== sourceNode.path
  }

  function onTreeDragOver(item: TreeNode, event: DragEvent) {
    if (!draggingPath.value || draggingPath.value === item.path) {
      return
    }

    const sourceNode = findNodeByPath(options.treeItems.value, draggingPath.value)
    if (!sourceNode) {
      return
    }

    const targetDirectoryPath = getDropDirectoryPath(item)
    if (!canDropToDirectory(sourceNode, targetDirectoryPath)) {
      return
    }

    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    dragOverTargetPath.value = item.path
  }

  async function moveByDnD(targetDirectoryPath: string) {
    if (!draggingPath.value) {
      return
    }

    const sourceNode = findNodeByPath(options.treeItems.value, draggingPath.value)
    if (!sourceNode || !canDropToDirectory(sourceNode, targetDirectoryPath)) {
      return
    }

    const targetPath = buildPath(targetDirectoryPath, getBaseName(sourceNode.path))

    try {
      const movedPath = await options.moveEntry(sourceNode.path, targetPath)
      await options.loadTree(movedPath)
    } catch (error) {
      console.error(error)
      options.notifyMoveError()
    } finally {
      onTreeDragEnd()
    }
  }

  async function onTreeDrop(item: TreeNode, event: DragEvent) {
    event.preventDefault()
    await moveByDnD(getDropDirectoryPath(item))
  }

  async function onRootDrop(event: DragEvent) {
    event.preventDefault()
    await moveByDnD('')
  }

  return {
    draggingPath,
    dragOverTargetPath,
    onTreeDragStart,
    onTreeDragEnd,
    onTreeDragOver,
    onTreeDrop,
    onRootDrop
  }
}
