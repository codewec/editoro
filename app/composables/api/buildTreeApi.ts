/**
 * Builds the `tree` section of grouped editor API.
 * Used by `app/composables/useEditoroApi.ts`.
 */
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildTreeApi(options: BuildEditoroApiOptions) {
  const { treeStore } = options.stores
  const { treeRefs } = options.refs

  return {
    items: treeRefs.treeItems,
    selectedNode: treeRefs.selectedNode,
    expandedPaths: treeRefs.expandedTreePaths,
    isLoading: treeRefs.isLoadingTree,
    isMoveInProgress: treeRefs.moveProgressModalOpen,
    moveProgressValue: treeRefs.moveProgressValue,
    moveProgressStage: treeRefs.moveProgressStage,
    moveSharedAttachmentCount: treeRefs.moveSharedAttachmentCount,
    draggingPath: treeRefs.draggingPath,
    dragOverTargetPath: treeRefs.dragOverTargetPath,
    selectNodeByPath: treeStore.selectNodeByPath,
    goToFolderParent: treeStore.goToFolderParent,
    refresh: options.actions.refreshTree,
    onDragStart: treeStore.onTreeDragStart,
    onDragEnd: treeStore.onTreeDragEnd,
    onDragOver: treeStore.onTreeDragOver,
    onDrop: treeStore.onTreeDrop,
    onRootDrop: treeStore.onRootDrop
  }
}
