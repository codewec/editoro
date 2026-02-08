/**
 * Store for tree state orchestration (loading, selection, DnD composition).
 * Used by `app/composables/useEditoroStores.ts`.
 */
import { storeToRefs } from '#imports'
import type { TreeNode } from '~/types/editoro'
import { useEditoroTreeDnD } from '~/composables/useEditoroTreeDnD'
import { useEditoroTreeLoading } from '~/composables/tree/useEditoroTreeLoading'
import { useEditoroTreeSelection } from '~/composables/tree/useEditoroTreeSelection'
import { useEditoroPreferencesStore } from '~/stores/editoroPreferences'

export const useEditoroTreeStore = defineStore('editoro-tree', () => {
  const toast = useToast()
  const { t } = useI18n()
  const preferencesStore = useEditoroPreferencesStore()
  const { showHiddenEntries } = storeToRefs(preferencesStore)

  const treeItems = ref<TreeNode[]>([])
  const selectedNode = ref<TreeNode>()
  const expandedTreePaths = ref<string[]>([])
  const isLoadingTree = ref(false)
  const treeInitialized = ref(false)

  function notifyError(title: string, description?: string) {
    toast.add({ title, description, color: 'error' })
  }

  const treeLoading = useEditoroTreeLoading({
    treeItems,
    selectedNode,
    expandedTreePaths,
    treeInitialized,
    isLoadingTree,
    showHiddenEntries,
    notifyLoadError: () => notifyError(t('errors.loadTree'))
  })

  const treeDnD = useEditoroTreeDnD({
    treeItems,
    loadTree: treeLoading.loadTree,
    notifyMoveError: () => notifyError(t('errors.move'))
  })

  const treeSelection = useEditoroTreeSelection({
    treeItems,
    selectedNode,
    expandedTreePaths
  })

  return {
    treeItems,
    selectedNode,
    expandedTreePaths,
    isLoadingTree,
    treeInitialized,
    draggingPath: treeDnD.draggingPath,
    dragOverTargetPath: treeDnD.dragOverTargetPath,
    applyTreeData: treeLoading.applyTreeData,
    loadTree: treeLoading.loadTree,
    refreshTree: treeLoading.refreshTree,
    selectNodeByPath: treeSelection.selectNodeByPath,
    goToFolderParent: treeSelection.goToFolderParent,
    onTreeDragStart: treeDnD.onTreeDragStart,
    onTreeDragEnd: treeDnD.onTreeDragEnd,
    onTreeDragOver: treeDnD.onTreeDragOver,
    onTreeDrop: treeDnD.onTreeDrop,
    onRootDrop: treeDnD.onRootDrop
  }
})
