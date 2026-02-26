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
import { fetchMoveEntryJobStatusApi, startMoveEntryJobApi } from '~/services/files-api'

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
  const moveProgressModalOpen = ref(false)
  const moveProgressValue = ref(0)
  const moveProgressStage = ref('')
  const moveSharedAttachmentCount = ref(0)

  // Move operation runs as a server-side background job.
  // UI remains blocked with modal progress until the job completes,
  // so selection/opening happens only after final path is stable.
  async function moveEntryWithProgress(from: string, to: string) {
    moveProgressModalOpen.value = true
    moveProgressValue.value = 0
    moveProgressStage.value = t('move.progress.starting')
    moveSharedAttachmentCount.value = 0

    try {
      const started = await startMoveEntryJobApi(from, to)
      const jobId = started.jobId

      while (true) {
        const status = await fetchMoveEntryJobStatusApi(jobId)
        moveProgressValue.value = status.progress
        moveProgressStage.value = status.stage || t('move.progress.processing')

        if (status.state === 'running') {
          await new Promise(resolve => setTimeout(resolve, 250))
          continue
        }

        if (status.state === 'error') {
          throw new Error(status.error || t('errors.move'))
        }

        moveSharedAttachmentCount.value = status.sharedAttachmentCount
        if (status.sharedAttachmentCount > 0) {
          toast.add({
            title: t('move.sharedAttachments', { count: status.sharedAttachmentCount }),
            color: 'warning'
          })
        }
        return status.path
      }
    } finally {
      moveProgressModalOpen.value = false
    }
  }

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
    moveEntry: moveEntryWithProgress,
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
    moveProgressModalOpen,
    moveProgressValue,
    moveProgressStage,
    moveSharedAttachmentCount,
    draggingPath: treeDnD.draggingPath,
    dragOverTargetPath: treeDnD.dragOverTargetPath,
    applyTreeData: treeLoading.applyTreeData,
    loadTree: treeLoading.loadTree,
    refreshTree: treeLoading.refreshTree,
    moveEntryWithProgress,
    selectNodeByPath: treeSelection.selectNodeByPath,
    goToFolderParent: treeSelection.goToFolderParent,
    onTreeDragStart: treeDnD.onTreeDragStart,
    onTreeDragEnd: treeDnD.onTreeDragEnd,
    onTreeDragOver: treeDnD.onTreeDragOver,
    onTreeDrop: treeDnD.onTreeDrop,
    onRootDrop: treeDnD.onRootDrop
  }
})
