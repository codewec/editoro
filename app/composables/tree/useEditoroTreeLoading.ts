import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { fetchTree } from '~/services/files-api'
import { collectDirectoryPaths, findNodeByPath, getAncestorPaths } from '~/utils/editoro-path'

/**
 * Loads and applies tree data while preserving expansion/selection when possible.
 * Used by `useEditoroTreeStore`.
 */
export function useEditoroTreeLoading(options: {
  treeItems: Ref<TreeNode[]>
  selectedNode: Ref<TreeNode | undefined>
  expandedTreePaths: Ref<string[]>
  treeInitialized: Ref<boolean>
  isLoadingTree: Ref<boolean>
  showHiddenEntries: Ref<boolean>
  notifyLoadError: () => void
}) {
  function applyTreeData(items: TreeNode[], preferPath?: string) {
    options.treeItems.value = items
    options.treeInitialized.value = true

    const directories = collectDirectoryPaths(items)
    const previousExpanded = options.expandedTreePaths.value.filter(path => directories.has(path))
    const targetPath = preferPath || options.selectedNode.value?.path
    const nextSelection = targetPath ? findNodeByPath(items, targetPath) : undefined

    if (nextSelection) {
      options.selectedNode.value = nextSelection
      options.expandedTreePaths.value = Array.from(new Set([
        ...previousExpanded,
        ...getAncestorPaths(nextSelection.path),
        ...(nextSelection.type === 'directory' ? [nextSelection.path] : [])
      ]))
      return
    }

    options.selectedNode.value = undefined
    options.expandedTreePaths.value = previousExpanded
  }

  async function loadTree(preferPath?: string) {
    options.isLoadingTree.value = true

    try {
      const data = await fetchTree(options.showHiddenEntries.value)
      applyTreeData(data.items, preferPath)
    } catch (error) {
      console.error(error)
      options.notifyLoadError()
    } finally {
      options.isLoadingTree.value = false
    }
  }

  async function refreshTree() {
    await loadTree(options.selectedNode.value?.path)
  }

  return {
    applyTreeData,
    loadTree,
    refreshTree
  }
}
