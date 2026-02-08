import type { TreeNode } from '~/types/editoro'
import { findNodeByPath } from '~/utils/editoro-path'

type SidebarDnDHandlersOptions = {
  getTreeItems: () => TreeNode[]
  onDragStart: (item: TreeNode, event: DragEvent) => void
  onDragOver: (item: TreeNode, event: DragEvent) => void
  onDrop: (item: TreeNode, event: DragEvent) => void
}

/**
 * Maps path-based drag events from the tree template to node-based callbacks.
 * Used by `app/components/editoro/Sidebar.vue`.
 */
export function useEditoroSidebarDnDHandlers(options: SidebarDnDHandlersOptions) {
  function getItemByPath(path: string) {
    return findNodeByPath(options.getTreeItems(), path)
  }

  function emitDragStart(path: string, event: DragEvent) {
    const item = getItemByPath(path)
    if (!item) {
      return
    }

    options.onDragStart(item, event)
  }

  function emitDragOver(path: string, event: DragEvent) {
    const item = getItemByPath(path)
    if (!item) {
      return
    }

    options.onDragOver(item, event)
  }

  function emitDrop(path: string, event: DragEvent) {
    const item = getItemByPath(path)
    if (!item) {
      return
    }

    options.onDrop(item, event)
  }

  return {
    emitDragStart,
    emitDragOver,
    emitDrop
  }
}
