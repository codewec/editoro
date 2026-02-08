import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { findNodeByPath, getAncestorPaths, getParentPath } from '~/utils/editoro-path'

/**
 * Handles tree node selection and parent-folder navigation.
 * Used by `useEditoroTreeStore`.
 */
export function useEditoroTreeSelection(options: {
  treeItems: Ref<TreeNode[]>
  selectedNode: Ref<TreeNode | undefined>
  expandedTreePaths: Ref<string[]>
}) {
  function selectNodeByPath(path: string) {
    const node = findNodeByPath(options.treeItems.value, path)
    if (!node) {
      return
    }

    options.selectedNode.value = node
    options.expandedTreePaths.value = Array.from(new Set([
      ...options.expandedTreePaths.value,
      ...getAncestorPaths(path),
      ...(node.type === 'directory' ? [node.path] : [])
    ]))
  }

  function goToFolderParent() {
    const node = options.selectedNode.value
    if (!node || node.type !== 'directory') {
      return
    }

    const parentPath = getParentPath(node.path)
    if (!parentPath) {
      options.selectedNode.value = undefined
      return
    }

    selectNodeByPath(parentPath)
  }

  return {
    selectNodeByPath,
    goToFolderParent
  }
}
